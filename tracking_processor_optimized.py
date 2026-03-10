import cv2
import torch
import numpy as np
import time
from collections import defaultdict
from Tracking import load_model, create_tracker, CLASS_COLORS
from camera_movement_estimator import CameraMovementEstimator
from speed_and_distance_estimator import SpeedAndDistance_Estimator
from player_ball_assigner import assign_ball_to_players
from team_classifier import SiglipTeamClassifier
from view_transformer import ViewTransformer


class StableIDManager:
    """
    Maintains stable person IDs across temporary exits by re-identifying
    with appearance (HSV histograms) + position gating.
    """

    def __init__(
        self,
        fps: int,
        max_inactive_seconds: float = 2.5,
        hist_bins: int = 16,
        min_hist_score: float = 0.45,
        base_position_gate: float = 80.0,
        max_speed_px_per_frame: float = 18.0,
    ):
        self.max_inactive_frames = max(1, int(fps * max_inactive_seconds))
        self.hist_bins = hist_bins
        self.min_hist_score = min_hist_score
        self.base_position_gate = base_position_gate
        self.max_speed_px_per_frame = max_speed_px_per_frame

        self.next_global_id = 1
        self.active_track_to_global = {}
        self.global_state = {}

    @staticmethod
    def _clamp_bbox(bbox, width, height):
        x1, y1, x2, y2 = bbox
        x1 = max(0, min(width - 1, x1))
        x2 = max(0, min(width - 1, x2))
        y1 = max(0, min(height - 1, y1))
        y2 = max(0, min(height - 1, y2))
        if x2 <= x1 or y2 <= y1:
            return None
        return [x1, y1, x2, y2]

    def _compute_hist(self, frame, bbox):
        h, w = frame.shape[:2]
        bbox = self._clamp_bbox(bbox, w, h)
        if bbox is None:
            return None
        x1, y1, x2, y2 = bbox
        if (x2 - x1) < 8 or (y2 - y1) < 8:
            return None
        crop = frame[y1:y2, x1:x2]
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [self.hist_bins, self.hist_bins], [0, 180, 0, 256])
        hist = cv2.normalize(hist, hist).flatten()
        return hist

    @staticmethod
    def _cosine_sim(a, b):
        if a is None or b is None:
            return None
        denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
        return float(np.dot(a, b) / denom)

    def _position_gate(self, last_pos, pos, dt):
        if last_pos is None or pos is None:
            return True, None
        dist = float(np.hypot(pos[0] - last_pos[0], pos[1] - last_pos[1]))
        allowed = self.base_position_gate + self.max_speed_px_per_frame * dt
        return dist <= allowed, dist / max(allowed, 1e-6)

    def _match_inactive(self, hist, pos, frame_idx):
        best_gid = None
        best_score = -1.0
        for gid, state in self.global_state.items():
            dt = frame_idx - state["last_seen"]
            if dt <= 0 or dt > self.max_inactive_frames:
                continue

            ok, pos_ratio = self._position_gate(state.get("last_pos"), pos, dt)
            if not ok:
                continue

            hist_score = self._cosine_sim(hist, state.get("hist"))
            if hist_score is None:
                # Fallback to position-only score
                score = 1.0 - (pos_ratio or 1.0)
            else:
                # Slightly penalize larger position deltas
                score = hist_score - 0.15 * (pos_ratio or 0.0)

            if score > best_score:
                best_score = score
                best_gid = gid

        if best_gid is not None and best_score >= self.min_hist_score:
            return best_gid
        return None

    def assign(self, track_id, frame, bbox, pos, frame_idx):
        if track_id in self.active_track_to_global:
            gid = self.active_track_to_global[track_id]
        else:
            hist = self._compute_hist(frame, bbox)
            gid = self._match_inactive(hist, pos, frame_idx)
            if gid is None:
                gid = self.next_global_id
                self.next_global_id += 1
            self.active_track_to_global[track_id] = gid

        hist = self._compute_hist(frame, bbox)
        state = self.global_state.setdefault(gid, {})
        state["hist"] = hist
        state["last_pos"] = pos
        state["last_seen"] = frame_idx
        return gid

    def cleanup(self, seen_track_ids, frame_idx):
        # Drop active mappings for tracks not seen this frame
        missing = [tid for tid in self.active_track_to_global if tid not in seen_track_ids]
        for tid in missing:
            self.active_track_to_global.pop(tid, None)

        # Prune very old inactive IDs
        prune_after = self.max_inactive_frames * 3
        to_delete = [gid for gid, st in self.global_state.items()
                     if frame_idx - st.get("last_seen", frame_idx) > prune_after]
        for gid in to_delete:
            self.global_state.pop(gid, None)

class OptimizedTrackingProcessor:
    """Optimized version with performance improvements"""
    
    def __init__(self, video_path, model_path, pixels_per_meter=30):
        self.video_path = video_path
        self.model_path = model_path
        self.pixels_per_meter = pixels_per_meter
        
        # OPTIMIZATION: Add performance flags
        self.detection_interval = 2  # Run detection every N frames
        self.team_classification_interval = 30  # Classify teams every N frames
        self.camera_estimation_interval = 1  # Camera movement every N frames
        self.profile_performance = True  # Enable profiling
        
        # Initialize models
        self.model = load_model(model_path)
        self.tracker = create_tracker()
        
        # Require CUDA
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA is required but not available.")
        self.device = "cuda"
        
        # Video properties
        self.cap = cv2.VideoCapture(video_path)
        if not self.cap.isOpened():
            raise RuntimeError(f"Could not open video: {video_path}")
        
        self.fps = int(self.cap.get(cv2.CAP_PROP_FPS))
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Initialize components
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        ret, first_frame = self.cap.read()
        if not ret:
            raise RuntimeError("Could not read first frame")
        
        self.camera_estimator = CameraMovementEstimator(first_frame)
        self.speed_estimator = SpeedAndDistance_Estimator(fps=self.fps, frame_window=5)
        self.view_transformer = ViewTransformer()
        self.team_classifier = SiglipTeamClassifier(
            model_name="google/siglip-base-patch16-224",
            k=2,
            warmup_frames=40,
            min_samples=24,
            pca_components=64,
        )
        self.id_manager = StableIDManager(fps=self.fps)
        
        # Data storage
        self.tracks = defaultdict(lambda: defaultdict(dict))
        self.track_class_map = {}
        self.stable_class_map = {}
        self.camera_movement_per_frame = []
        
        # OPTIMIZATION: Cache for detections and classifications
        self.last_detections = []
        self.last_detection_data = []
        self.classified_tracks = set()
        
        # Performance tracking
        self.timers = {
            'detection': 0,
            'tracking': 0,
            'team_class': 0,
            'camera': 0,
            'data_prep': 0,
            'total': 0
        }
        
        # Initialize optical flow for camera movement
        self._init_optical_flow(first_frame)
        
        print(f"✅ Optimized Tracking Processor Initialized")
        print(f"📊 Video: {self.fps} FPS, {self.width}x{self.height}, {self.total_frames} frames")
        print(f"⚡ Performance Optimizations:")
        print(f"   - Detection interval: {self.detection_interval} frames")
        print(f"   - Team classification interval: {self.team_classification_interval} frames")
        print(f"   - Camera estimation interval: {self.camera_estimation_interval} frames")
    
    def _init_optical_flow(self, first_frame):
        """Initialize optical flow parameters"""
        self.old_gray = cv2.cvtColor(first_frame, cv2.COLOR_BGR2GRAY)
        mask_features = np.zeros_like(self.old_gray)
        mask_features[:, 0:20] = 1
        mask_features[:, -20:] = 1
        
        self.old_features = cv2.goodFeaturesToTrack(
            self.old_gray,
            maxCorners=100,
            qualityLevel=0.3,
            minDistance=3,
            blockSize=7,
            mask=mask_features
        )
        self.camera_movement_per_frame.append([0, 0])
        
        self.lk_params = dict(
            winSize=(15, 15),
            maxLevel=2,
            criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03)
        )
    
    @staticmethod
    def get_foot_position(bbox):
        """Get foot position from bbox"""
        x1, y1, x2, y2 = bbox
        return int((x1 + x2) / 2), int(y2)
    
    def pixel_to_meters(self, pixel_distance):
        """Convert pixel distance to meters"""
        return pixel_distance

    @staticmethod
    def _prefer_class(existing_cls, new_cls):
        """
        Prefer non-player classes when available.
        Priority: Goalkeeper (1), Referee (3), Player (2).
        """
        if existing_cls is None:
            return new_cls
        if existing_cls == new_cls:
            return existing_cls
        # If we already have GK/Ref, keep it.
        if existing_cls in (1, 3):
            return existing_cls
        # If new is GK/Ref, upgrade from Player.
        if new_cls in (1, 3):
            return new_cls
        # Otherwise keep existing.
        return existing_cls
    
    def estimate_camera_movement(self, frame):
        """Estimate camera movement for current frame"""
        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if self.old_features is not None and len(self.old_features) > 0:
            new_features, status, _ = cv2.calcOpticalFlowPyrLK(
                self.old_gray, frame_gray, self.old_features, None, **self.lk_params
            )
            
            if new_features is not None:
                max_distance = 0
                camera_dx, camera_dy = 0, 0
                
                for new, old in zip(new_features, self.old_features):
                    new_pt = new.ravel()
                    old_pt = old.ravel()
                    distance = np.sqrt((new_pt[0] - old_pt[0])**2 + (new_pt[1] - old_pt[1])**2)
                    
                    if distance > max_distance:
                        max_distance = distance
                        camera_dx = old_pt[0] - new_pt[0]
                        camera_dy = old_pt[1] - new_pt[1]
                
                if max_distance > 5:
                    mask = np.zeros_like(frame_gray)
                    mask[:, 0:20] = 1
                    mask[:, -20:] = 1
                    self.old_features = cv2.goodFeaturesToTrack(
                        frame_gray, maxCorners=100, qualityLevel=0.3,
                        minDistance=3, blockSize=7, mask=mask
                    )
                
                self.old_gray = frame_gray
                return (camera_dx, camera_dy)
        
        self.old_gray = frame_gray
        return (0, 0)
    
    def process_video(self):
        """Main tracking loop with optimizations"""
        print("\n🎬 Starting optimized video processing...")
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        frame_idx = 0
        
        while True:
            frame_start = time.time()
            
            ret, frame = self.cap.read()
            if not ret:
                break
            
            # OPTIMIZATION: Camera movement - run less frequently or skip for static camera
            t1 = time.time()
            if frame_idx > 0 and frame_idx % self.camera_estimation_interval == 0:
                camera_movement = self.estimate_camera_movement(frame)
                self.camera_movement_per_frame.append(list(camera_movement))
            elif frame_idx > 0:
                # Reuse last camera movement
                self.camera_movement_per_frame.append(self.camera_movement_per_frame[-1])
            self.timers['camera'] += time.time() - t1
            
            camera_dx, camera_dy = self.camera_movement_per_frame[frame_idx]
            
            # OPTIMIZATION: Run detection every N frames
            t1 = time.time()
            if frame_idx % self.detection_interval == 0:
                frame_small = cv2.resize(frame, (640, 360))
                
                with torch.no_grad():
                    results = self.model.predict(
                        frame_small, conf=0.4, iou=0.5,
                        device=self.device, half=True, verbose=False
                    )[0]
                
                detections = []
                detection_data = []
                ball_detections = []
                
                for box in getattr(results, "boxes", []):
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    x1 = int(x1 * frame.shape[1] / 640)
                    x2 = int(x2 * frame.shape[1] / 640)
                    y1 = int(y1 * frame.shape[0] / 360)
                    y2 = int(y2 * frame.shape[0] / 360)
                    
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    if cls == 0:
                        ball_detections.append({'bbox': [x1, y1, x2, y2], 'cls': cls, 'conf': conf})
                    else:
                        detections.append([[x1, y1, x2-x1, y2-y1], conf, str(cls)])
                        detection_data.append({'bbox': [x1, y1, x2, y2], 'cls': cls, 'conf': conf})
                
                # Cache detections
                self.last_detections = detections
                self.last_detection_data = detection_data
            else:
                # Reuse cached detections
                detections = self.last_detections
                detection_data = self.last_detection_data
            
            self.timers['detection'] += time.time() - t1
            
            # Tracking (always run - tracker handles missing detections)
            t1 = time.time()
            tracked_objects = self.tracker.update_tracks(detections, frame=frame)
            self.timers['tracking'] += time.time() - t1
            
            # Data preparation and storage
            t1 = time.time()
            seen_track_ids = set()
            for track in tracked_objects:
                if not track.is_confirmed():
                    continue
                seen_track_ids.add(track.track_id)
                
                # Match track to detection
                track_bbox = track.to_ltrb()
                track_center_x = (track_bbox[0] + track_bbox[2]) / 2
                track_center_y = (track_bbox[1] + track_bbox[3]) / 2
                
                min_dist = float('inf')
                best_cls = self.track_class_map.get(track.track_id, 2)
                
                for det in detection_data:
                    det_bbox = det['bbox']
                    det_center_x = (det_bbox[0] + det_bbox[2]) / 2
                    det_center_y = (det_bbox[1] + det_bbox[3]) / 2
                    dist = ((track_center_x - det_center_x)**2 + (track_center_y - det_center_y)**2)**0.5
                    
                    if dist < min_dist:
                        min_dist = dist
                        best_cls = det['cls']
                
                self.track_class_map[track.track_id] = best_cls
                
                # Store track info
                x1, y1, x2, y2 = map(int, track.to_ltrb())
                bbox = [x1, y1, x2, y2]
                foot_x, foot_y = self.get_foot_position(bbox)
                
                foot_x_adjusted = foot_x - camera_dx
                foot_y_adjusted = foot_y - camera_dy
                x_meters = self.pixel_to_meters(foot_x_adjusted)
                y_meters = self.pixel_to_meters(foot_y_adjusted)
                
                cls = self.track_class_map[track.track_id]
                if cls == 1:
                    object_name = "goalkeepers"
                elif cls == 2:
                    object_name = "players"
                elif cls == 3:
                    object_name = "referees"
                    self.team_classifier.track_team.pop(track.track_id, None)
                else:
                    object_name = "players"

                stable_id = self.id_manager.assign(
                    track.track_id,
                    frame=frame,
                    bbox=bbox,
                    pos=(foot_x, foot_y),
                    frame_idx=frame_idx,
                )

                existing_cls = self.stable_class_map.get(stable_id)
                self.stable_class_map[stable_id] = self._prefer_class(existing_cls, cls)

                self.tracks[object_name][frame_idx][stable_id] = {
                    'bbox': bbox,
                    'position': (foot_x, foot_y),
                    'position_adjusted': (foot_x_adjusted, foot_y_adjusted),
                    'position_transformed': (x_meters, y_meters)
                }
            
                # OPTIMIZATION: Team classification - run much less frequently
                if object_name in ["players", "goalkeepers"]:
                    # Only classify new tracks or update existing ones periodically
                    should_classify = (
                        track.track_id not in self.classified_tracks or 
                        frame_idx % self.team_classification_interval == 0
                    )
                    
                    t_team = time.time()
                    if should_classify:
                        self.team_classifier.add_sample(frame, bbox, stable_id)
                        team_id = self.team_classifier.predict(frame, bbox, stable_id)
                        self.classified_tracks.add(stable_id)
                    else:
                        # Reuse existing classification
                        team_id = self.team_classifier.track_team.get(stable_id)
                    
                    if team_id is not None:
                        self.tracks[object_name][frame_idx][stable_id]['team_id'] = team_id
                    self.timers['team_class'] += time.time() - t_team
            
            self.timers['data_prep'] += time.time() - t1
            self.id_manager.cleanup(seen_track_ids, frame_idx)
            
            # Ball tracking (no optimization needed - minimal cost)
            for ball in ball_detections:
                self.tracks["ball"][frame_idx]["ball"] = {
                    'bbox': ball['bbox'],
                    'position': self.get_foot_position(ball['bbox']),
                    'position_adjusted': self.get_foot_position(ball['bbox']),
                    'position_transformed': None
                }
            
            assign_ball_to_players(self.tracks, frame_idx, max_distance_pixels=70.0)
            
            self.timers['total'] += time.time() - frame_start
            
            # Progress reporting with performance stats
            if frame_idx % 100 == 0:
                fps_current = 100 / (time.time() - frame_start + 0.001) if frame_idx > 0 else 0
                print(f"\nFrame {frame_idx}/{self.total_frames} | Processing: {fps_current:.1f} FPS")
                
                if self.profile_performance and self.timers['total'] > 0:
                    print("  Time breakdown:")
                    for key in ['detection', 'tracking', 'team_class', 'camera', 'data_prep']:
                        val = self.timers[key]
                        pct = (val / self.timers['total'] * 100)
                        print(f"    {key}: {val:.2f}s ({pct:.1f}%)")
            
            frame_idx += 1
        
        print(f"\n✅ Tracking complete for {frame_idx} frames")
        print(f"⚡ Average processing speed: {frame_idx / self.timers['total']:.1f} FPS")
        self.cap.release()
    
    def post_process(self):
        """Apply transformations and calculate physics"""
        print("\n📐 Applying Perspective Transform...")
        self.view_transformer.add_transformed_position_to_tracks(self.tracks)
        
        print("🌊 Smoothing trajectories...")
        self.speed_estimator.smooth_positions(self.tracks)
        
        print("⚡ Calculating speed and distance...")
        self.speed_estimator.add_speed_and_distance_to_tracks(self.tracks)
        print("✅ Post-processing complete")
    
    def get_results(self):
        """Return processed data"""
        return {
            'tracks': self.tracks,
            'track_class_map': self.track_class_map,
            'stable_class_map': self.stable_class_map,
            'camera_movement': self.camera_movement_per_frame,
            'fps': self.fps,
            'width': self.width,
            'height': self.height,
            'total_frames': self.total_frames,
            'performance': self.timers
        }
