import cv2
import torch
import numpy as np
from collections import defaultdict
from Tracking import load_model, create_tracker, draw_ellipse, CLASS_COLORS
from camera_movement_estimator import CameraMovementEstimator
from speed_and_distance_estimator import SpeedAndDistance_Estimator
from player_ball_assigner import assign_ball_to_players
from team_classifier import SiglipTeamClassifier
from view_transformer import ViewTransformer
from speed_and_distance_estimator import SpeedAndDistance_Estimator
from db_connect import KicksenseDB
from datetime import datetime, timedelta

VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/working_video.mp4"
OUTPUT_VIDEO_PATH = "video_results/advanced_player_tracking_output.mp4"
STATS_CSV_PATH = "video_results/player_stats_advanced.csv"
DISPLAY_SIZE = (900, 600)
TEAM_COLORS = [
    (0, 255, 255),   # Team 0 - yellow/cyan
    (255, 140, 0),   # Team 1 - orange
    (0, 200, 255),   # fallback extra
]

# Pixel to meter conversion factor (approximate)
# Standard football field is ~105m long and ~68m wide
# Adjust this based on your video resolution and field coverage
PIXELS_PER_METER = 30  # You can tune this value

print("🎯 Running in NO-CALIBRATION mode (pixel-based approximation)")
print(f"📏 Using conversion: {PIXELS_PER_METER} pixels = 1 meter")

# Initialize models
model = load_model("/home/labuser/Downloads/weights/best.pt")
tracker = create_tracker()

# Require CUDA for inference
if not torch.cuda.is_available():
    raise RuntimeError("CUDA is required but not available. Check GPU drivers and PyTorch install.")
device = "cuda"

cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    print("❌ Error: Could not open video file")
    exit()
fps = int(cap.get(cv2.CAP_PROP_FPS))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"🎬 Video: {VIDEO_PATH}")
print(f"📊 FPS: {fps}, Resolution: {width}x{height}, Total frames: {total_frames}")
if total_frames <= 0:
    print("❌ Error: Could not get total frame count. Video may be corrupted.")
    cap.release()
    exit()
# === INITIALIZE CAMERA MOVEMENT ESTIMATOR (using first frame) ===
print("\n📷 Initializing camera movement estimator...")
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
ret, first_frame = cap.read()
if not ret:
    print("❌ Error: Could not read first frame")
    cap.release()
    exit()
    
camera_estimator = CameraMovementEstimator(first_frame)
print("✅ Camera movement estimator initialized")
# ... (Around line 60) ...
speed_estimator = SpeedAndDistance_Estimator(fps=fps, frame_window=5)

# === ADD THIS ===
print("📐 Initializing View Transformer (Homography)...")
view_transformer = ViewTransformer()
# ================
# === INITIALIZE SPEED AND DISTANCE ESTIMATOR ===
speed_estimator = SpeedAndDistance_Estimator(fps=fps, frame_window=5)
# === INITIALIZE TEAM CLASSIFIER (SigLIP embeddings + PCA + KMeans) ===
print("🤝 Initializing SigLIP-based team classifier (this may download weights once)...")
team_classifier = SiglipTeamClassifier(
    model_name="google/siglip-base-patch16-224",
    k=2,
    warmup_frames=40,
    min_samples=24,
    pca_components=64,
)
# === VIDEO WRITER ===
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(OUTPUT_VIDEO_PATH, fourcc, fps, (width, height))
# Track storage structure: tracks[object_name][frame_idx][track_id] = info
tracks = defaultdict(lambda: defaultdict(dict))
track_class_map = {}
camera_movement_per_frame = []

# Variables for camera movement estimation
old_gray = cv2.cvtColor(first_frame, cv2.COLOR_BGR2GRAY)
mask_features = np.zeros_like(old_gray)
mask_features[:, 0:20] = 1
mask_features[:, -20:] = 1

old_features = cv2.goodFeaturesToTrack(
    old_gray,
    maxCorners=100,
    qualityLevel=0.3,
    minDistance=3,
    blockSize=7,
    mask=mask_features
)
camera_movement_per_frame.append([0, 0])

lk_params = dict(
    winSize=(15, 15),
    maxLevel=2,
    criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03)
)

def get_foot_position(bbox):
    """Get foot position from bbox"""
    x1, y1, x2, y2 = bbox
    return int((x1 + x2) / 2), int(y2)

def pixel_to_meters(pixel_distance):
    """Convert pixel distance to meters using approximation"""
    return pixel_distance / PIXELS_PER_METER

def draw_triangle_for_ball(frame, bbox, color):
    """Draw a triangle above the ball"""
    try:
        x1, y1, x2, y2 = bbox
        x_center = int((x1 + x2) / 2)
        y_top = int(y1)
        triangle_size = 15
        pt1 = (x_center, y_top - triangle_size - 5)
        pt2 = (x_center - triangle_size, y_top - 5)
        pt3 = (x_center + triangle_size, y_top - 5)
        triangle_points = np.array([pt1, pt2, pt3], np.int32)
        cv2.fillPoly(frame, [triangle_points], color)
        cv2.polylines(frame, [triangle_points], True, (255, 255, 255), 2)
    except Exception as e:
        print(f"⚠️ draw_triangle_for_ball error: {e}")
    return frame

def estimate_camera_movement(frame, old_gray, old_features):
    """Estimate camera movement for current frame"""
    frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    if old_features is not None and len(old_features) > 0:
        new_features, status, _ = cv2.calcOpticalFlowPyrLK(
            old_gray, frame_gray, old_features, None, **lk_params
        )
        
        if new_features is not None:
            max_distance = 0
            camera_dx, camera_dy = 0, 0
            
            for new, old in zip(new_features, old_features):
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
                new_old_features = cv2.goodFeaturesToTrack(
                    frame_gray, maxCorners=100, qualityLevel=0.3,
                    minDistance=3, blockSize=7, mask=mask
                )
                return (camera_dx, camera_dy), frame_gray, new_old_features
            else:
                return (0, 0), frame_gray, old_features
        else:
            return (0, 0), frame_gray, old_features
    else:
        return (0, 0), frame_gray, old_features

# === PROCESS VIDEO WITH STREAMING ===
print("\n🎬 Starting video processing with streaming...")
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

frame_idx = 0
old_gray_stream = old_gray
old_features_stream = old_features

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Estimate camera movement for this frame
    if frame_idx > 0:
        camera_movement, old_gray_stream, old_features_stream = estimate_camera_movement(
            frame, old_gray_stream, old_features_stream
        )
        camera_movement_per_frame.append(list(camera_movement))
    
    camera_dx, camera_dy = camera_movement_per_frame[frame_idx]
    
    # Run detection
    frame_small = cv2.resize(frame, (640, 360))
    
    with torch.no_grad():
        results = model.predict(
            frame_small,
            conf=0.4,
            iou=0.5,
            device=device,
            half=True,
            verbose=False
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
    
    tracked_objects = tracker.update_tracks(detections, frame=frame)
    
    # Map track IDs to classes
    for track in tracked_objects:
        if not track.is_confirmed():
            continue
        
        track_bbox = track.to_ltrb()
        track_center_x = (track_bbox[0] + track_bbox[2]) / 2
        track_center_y = (track_bbox[1] + track_bbox[3]) / 2
        
        min_dist = float('inf')
        best_cls = track_class_map.get(track.track_id, 2)
        
        for det in detection_data:
            det_bbox = det['bbox']
            det_center_x = (det_bbox[0] + det_bbox[2]) / 2
            det_center_y = (det_bbox[1] + det_bbox[3]) / 2
            
            dist = ((track_center_x - det_center_x)**2 +
                   (track_center_y - det_center_y)**2)**0.5
            
            if dist < min_dist:
                min_dist = dist
                best_cls = det['cls']
        
        track_class_map[track.track_id] = best_cls
        
        # Get track info
        x1, y1, x2, y2 = map(int, track.to_ltrb())
        bbox = [x1, y1, x2, y2]
        
        # Get foot position
        foot_x, foot_y = get_foot_position(bbox)
        
        # Adjust for camera movement
        foot_x_adjusted = foot_x - camera_dx
        foot_y_adjusted = foot_y - camera_dy
        
        # Convert adjusted pixel positions to approximate meters
        x_meters = pixel_to_meters(foot_x_adjusted)
        y_meters = pixel_to_meters(foot_y_adjusted)
        
        # Determine object category
        cls = track_class_map[track.track_id]
        if cls == 1:
            object_name = "goalkeepers"
        elif cls == 2:
            object_name = "players"
        elif cls == 3:
            object_name = "referees"
            # Ensure referees never carry team assignments even if misclassified earlier
            team_classifier.track_team.pop(track.track_id, None)
        else:
            object_name = "players"
        
        # Store track info
        tracks[object_name][frame_idx][track.track_id] = {
            'bbox': bbox,
            'position': (foot_x, foot_y),
            'position_adjusted': (foot_x_adjusted, foot_y_adjusted),
            'position_transformed': (x_meters, y_meters)
        }
        # Add sample for team classification (players/keepers)
        if object_name in ["players", "goalkeepers"]:
            team_classifier.add_sample(frame, bbox, track.track_id)
            team_id = team_classifier.predict(frame, bbox, track.track_id)
            if team_id is not None:
                tracks[object_name][frame_idx][track.track_id]['team_id'] = team_id
    
    # Store ball detections
    for ball in ball_detections:
        tracks["ball"][frame_idx]["ball"] = {
            'bbox': ball['bbox'],
            'position': get_foot_position(ball['bbox']),
            'position_adjusted': get_foot_position(ball['bbox']),
            'position_transformed': None
        }

    # Assign ball to nearest player/keeper in this frame
    assign_ball_to_players(tracks, frame_idx, max_distance_pixels=70.0)
    
    if frame_idx % 100 == 0:
        print(f"Tracking frame {frame_idx}/{total_frames}")
    
    frame_idx += 1

print(f"✅ Tracking complete for {frame_idx} frames")

# === POST-PROCESSING (TRANSFORM & SMOOTH) ===
print("\n📐 Applying Perspective Transform (Pixels -> Meters)...")
# 1. Overwrite the approximate positions with accurate Matrix positions
view_transformer.add_transformed_position_to_tracks(tracks)

print("🌊 Smoothing trajectories to remove jitter...")
# 2. Smooth the path (Average Filter) so speed doesn't jump around
speed_estimator.smooth_positions(tracks)

print("⚡ Calculating accurate speed and distance...")
# 3. Calculate physics based on the new smooth paths
speed_estimator.add_speed_and_distance_to_tracks(tracks)
print("✅ Physics calculations complete")

# === SECOND PASS: RENDER VIDEO WITH OVERLAYS ===
print("\n🎨 Rendering video with overlays...")
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
frame_idx = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    frame = frame.copy()
    
    # Draw tracked players
    for object_name in ["goalkeepers", "players", "referees"]:
        if object_name in tracks and frame_idx in tracks[object_name]:
            for track_id, track_info in tracks[object_name][frame_idx].items():
                bbox = track_info['bbox']
                x1, y1, x2, y2 = bbox
                
                # Determine color based on class
                cls = track_class_map.get(track_id, 2)
                color = CLASS_COLORS.get(cls, (255, 180, 120))
                
                # Draw ellipse
                draw_ellipse(frame, (x1, y1, x2, y2), color, track_id)

                # Team label overlay
                team_id = track_info.get('team_id')
                if team_id is not None:
                    team_color = TEAM_COLORS[team_id % len(TEAM_COLORS)]
                    label = f"T{team_id + 1}"
                    label_bg = (x1, max(0, y1 - 18))
                    cv2.rectangle(frame, label_bg, (label_bg[0] + 30, label_bg[1] + 18), team_color, -1)
                    cv2.putText(frame, label, (label_bg[0] + 4, label_bg[1] + 13),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

                # Highlight player with ball
                if track_info.get('has_ball'):
                    indicator_pos = (x1 + 12, max(10, y1 - 12))
                    cv2.circle(frame, indicator_pos, 10, (0, 165, 255), -1)
                    cv2.putText(frame, "BALL", (indicator_pos[0] - 15, indicator_pos[1] - 15),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 2)
                
                # Draw speed and distance
                if 'speed' in track_info and 'distance' in track_info:
                    speed = track_info['speed']
                    distance = track_info['distance']
                    
                    # Cap speed at realistic values
                    if speed > 45:
                        speed = 0
                    
                    if speed > 0:
                        position = list(track_info['position'])
                        position[1] += 40
                        position = tuple(map(int, position))
                        # Use black text for white players, white text for others
                        text_color = (0, 0, 0) if cls == 2 else (255, 255, 255)
                        cv2.putText(frame, f"{speed:.1f} km/h", position, cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 2)
                        cv2.putText(frame, f"{distance:.1f} m",(position[0], position[1] + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 2)
    
    # Draw ball
    if "ball" in tracks and frame_idx in tracks["ball"]:
        for ball_id, ball_info in tracks["ball"][frame_idx].items():
            draw_triangle_for_ball(frame, ball_info['bbox'], CLASS_COLORS[0])
    
    # Frame counter
    cv2.rectangle(frame, (10, 10), (400, 50), (0, 0, 0), -1)
    cv2.putText(frame, f"Frame: {frame_idx}/{total_frames}",
               (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    # Camera movement info
    camera_dx, camera_dy = camera_movement_per_frame[frame_idx]
    info_x, info_y = 10, height - 60
    overlay = frame.copy()
    cv2.rectangle(overlay, (info_x, info_y), (info_x + 300, info_y + 50), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
    cv2.putText(frame, f"Camera X: {camera_dx:.1f}px", (info_x + 10, info_y + 20),
               cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    cv2.putText(frame, f"Camera Y: {camera_dy:.1f}px", (info_x + 10, info_y + 40),
               cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    
    # Legend
    legend_y = 70
    legend_items = [
        ("Ball", CLASS_COLORS[0]),
        ("Goalkeeper", CLASS_COLORS[1]),
        ("Player", CLASS_COLORS[2]),
        ("Referee", CLASS_COLORS[3])
    ]
    
    legend_height = len(legend_items) * 30 + 10
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 60), (150, 60 + legend_height), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
    
    for label, color in legend_items:
        if label == "Ball":
            triangle_center_y = legend_y
            triangle_size = 8
            pt1 = (30, triangle_center_y - triangle_size)
            pt2 = (30 - triangle_size, triangle_center_y + triangle_size)
            pt3 = (30 + triangle_size, triangle_center_y + triangle_size)
            triangle_points = np.array([pt1, pt2, pt3], np.int32)
            cv2.fillPoly(frame, [triangle_points], color)
            cv2.polylines(frame, [triangle_points], True, (255, 255, 255), 1)
        else:
            cv2.circle(frame, (30, legend_y), 8, color, -1)
            cv2.circle(frame, (30, legend_y), 8, (255, 255, 255), 1)
        
        cv2.putText(frame, label, (50, legend_y + 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        legend_y += 30
    
    # Add "Approximate Mode" indicator
    cv2.putText(frame, "Pixel Approximation Mode", (width - 300, 30),
               cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 2)
    
    out.write(frame)
    
    frame_display = cv2.resize(frame, DISPLAY_SIZE)
    cv2.imshow("Advanced Player Tracking", frame_display)
    
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break
    
    if frame_idx % 100 == 0:
        print(f"Rendering frame {frame_idx}/{total_frames}")
    
    frame_idx += 1

cap.release()
out.release()
cv2.destroyAllWindows()

# ... [Previous code remains the same] ...

# === EXPORT STATISTICS (CSV) ===
print("\n📊 Exporting statistics to CSV...")
player_stats = speed_estimator.export_stats_to_csv(tracks, STATS_CSV_PATH, track_class_map)

# =========================================================
# === NEW: SAVE TO TIMESCALEDB (DOCKER) ===
# =========================================================
print("\n💾 Saving smoothed data to TimescaleDB (Docker)...")

try:
    # 1. Connect to Database
    # Ensure these credentials match your docker-compose.yml
    db_config = {
        "dbname": "kicksense",
        "user": "postgres",
        "password": "password123",
        "host": "localhost",
        "port": "5432"
    }
    db = KicksenseDB(db_config)
    
    # 2. Iterate through frames chronologically
    # We use sorted keys to ensure time increases linearly
    sorted_frames = sorted(tracks["players"].keys())
    
    # Start time reference for timestamp calculation
    match_start_time = datetime.now() 

    for frame_idx in sorted_frames:
        # Calculate Timestamp: Start + (Frame Number * Seconds per Frame)
        timestamp = match_start_time + timedelta(seconds=frame_idx / fps)
        
        current_batch = []
        
        # Get player data for this frame
        for track_id, info in tracks["players"][frame_idx].items():
            
            # Validation: Only save if we have both Position (Meters) and Speed
            if "position_transformed" in info and "speed" in info:
                
                # Get Position (Meters)
                pos = info["position_transformed"]
                if pos is None: continue
                
                # Get Speed (Convert km/h -> m/s for standard DB units)
                speed_kmh = info["speed"]
                speed_ms = speed_kmh / 3.6
                
                # Get Team (Default to 0 if unknown)
                team_id = info.get("team_id", 0)
                
                # Append to batch: (track_id, team_id, x, y, speed_ms, is_sprinting)
                current_batch.append((
                    track_id,
                    team_id,
                    pos[0],           # X (Meters)
                    pos[1],           # Y (Meters)
                    speed_ms,         # Speed (m/s)
                    speed_kmh > 25.0  # is_sprinting (Threshold: 25 km/h)
                ))
        
        # Send this frame's batch to the DB Helper
        # Match ID is hardcoded to 1 for this demo
        if current_batch:
            db.add_frame_data(timestamp, current_batch, match_id=1)

    # 3. Final Flush & Close
    db.close()
    print("✅ Data successfully saved to Docker Database!")

except Exception as e:
    print(f"⚠️ Database Error: {e}")
    print("Continuing without saving to DB...")

# =========================================================
# === END DATABASE SECTION ===
# =========================================================

# Filter out unrealistic speeds from summary (For Console Output)
player_stats_filtered = [s for s in player_stats if s['max_speed_kmh'] <= 45]

print(f"\n✅ Processing complete!")
print(f"📹 Output video: {OUTPUT_VIDEO_PATH}")
print(f"📊 Statistics CSV: {STATS_CSV_PATH}")

# Print summary
print(f"\n⚽ SPEED SUMMARY (Top 10 - Realistic speeds only):")
for i, stats in enumerate(player_stats_filtered[:10], 1):
    print(f"  {i}. ID {stats['track_id']} ({stats['class']}): "
          f"Max {stats['max_speed_kmh']:.1f} km/h, "
          f"Distance {stats['total_distance_m']:.1f}m")

if len(player_stats) != len(player_stats_filtered):
    print(f"\n⚠️ Filtered out {len(player_stats) - len(player_stats_filtered)} tracks with unrealistic speeds (>45 km/h)")