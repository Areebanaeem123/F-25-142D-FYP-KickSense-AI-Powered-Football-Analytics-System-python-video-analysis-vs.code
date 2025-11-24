import cv2
import numpy as np
import csv
import os
from collections import defaultdict, deque
class AdvancedSpeedEstimator:
    """
    Advanced speed estimator with homography transformation and camera movement compensation
    """
    def __init__(self, fps=30, frame_window=5):
        self.fps = fps
        self.frame_window = frame_window  # Calculate speed over N frames
        
        # Homography matrix (will be set during calibration)
        self.homography_matrix = None
        
        # Storage for player positions
        self.player_positions = defaultdict(list)  # track_id -> list of (frame, x, y, x_transformed, y_transformed)
        self.player_speeds = defaultdict(list)  # track_id -> list of speeds
        self.player_distances = defaultdict(float)  # track_id -> total distance
        
        # Camera movement compensation
        self.camera_movement = []  # List of (dx, dy) per frame
        self.lk_params = dict(
            winSize=(15, 15),
            maxLevel=2,
            criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03)
        )
        self.old_gray = None
        self.old_features = None
        
        print(f"🎬 FPS: {fps}")
        print(f"📊 Frame window: {frame_window}")
    
    def set_homography_from_field_points(self, field_points_pixels, field_points_meters):
        """
        Calculate homography matrix from field reference points
        
        Args:
            field_points_pixels: List of 4 points in pixels [(x1,y1), (x2,y2), (x3,y3), (x4,y4)]
            field_points_meters: List of 4 points in meters [(x1,y1), (x2,y2), (x3,y3), (x4,y4)]
        """
        src_points = np.float32(field_points_pixels)
        dst_points = np.float32(field_points_meters)
        
        self.homography_matrix = cv2.getPerspectiveTransform(src_points, dst_points)
        print(f"✅ Homography matrix calculated")
        return self.homography_matrix
    
    def set_homography_from_calibration(self, frame, field_width_meters=68.0, field_length_meters=105.0):
        """
        Interactive calibration - user clicks 4 corners of the field
        
        Args:
            frame: Video frame for calibration
            field_width_meters: Real field width (default 68m)
            field_length_meters: Real field length (default 105m)
        """
        print("\n📏 HOMOGRAPHY CALIBRATION MODE")
        print("Click 4 corners of the field in this order:")
        print("1. Top-left corner")
        print("2. Top-right corner")
        print("3. Bottom-right corner")
        print("4. Bottom-left corner")
        print("Press 'q' to quit\n")
        
        # Calculate display size (max 1280x720 for comfortable viewing)
        original_height, original_width = frame.shape[:2]
        max_display_width = 1280
        max_display_height = 720
        
        # Calculate scaling factor
        scale_width = max_display_width / original_width
        scale_height = max_display_height / original_height
        scale_factor = min(scale_width, scale_height, 1.0)  # Don't upscale
        
        display_width = int(original_width * scale_factor)
        display_height = int(original_height * scale_factor)
        
        print(f"Original size: {original_width}x{original_height}")
        print(f"Display size: {display_width}x{display_height}")
        print(f"Scale factor: {scale_factor:.3f}\n")
        
        # Resize frame for display
        display_frame = cv2.resize(frame, (display_width, display_height))
        working_frame = display_frame.copy()
        
        points = []  # These will be in display coordinates
        actual_points = []  # These will be in original frame coordinates
        
        def mouse_callback(event, x, y, flags, param):
            nonlocal working_frame
            if event == cv2.EVENT_LBUTTONDOWN and len(points) < 4:
                # Store display point
                points.append((x, y))
                
                # Calculate actual point in original frame
                actual_x = int(x / scale_factor)
                actual_y = int(y / scale_factor)
                actual_points.append((actual_x, actual_y))
                
                # Draw on display frame
                working_frame = display_frame.copy()
                
                # Draw all points and lines
                for i, pt in enumerate(points):
                    cv2.circle(working_frame, pt, 8, (0, 255, 0), -1)
                    cv2.circle(working_frame, pt, 8, (255, 255, 255), 2)
                    cv2.putText(working_frame, str(i+1), (pt[0]+12, pt[1]+12),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                    
                    if i > 0:
                        cv2.line(working_frame, points[i-1], pt, (0, 255, 0), 2)
                
                # Close the rectangle if 4 points
                if len(points) == 4:
                    cv2.line(working_frame, points[-1], points[0], (0, 255, 0), 2)
                    cv2.putText(working_frame, "Press any key to confirm", 
                               (display_width//2 - 150, 30),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                
                cv2.imshow("Calibration", working_frame)
        
        cv2.namedWindow("Calibration", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("Calibration", display_width, display_height)
        cv2.setMouseCallback("Calibration", mouse_callback)
        cv2.imshow("Calibration", working_frame)
        
        while len(points) < 4:
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                cv2.destroyAllWindows()
                return None
        
        cv2.waitKey(0)  # Wait for confirmation
        cv2.destroyAllWindows()
        
        print(f"✅ Selected points (original coordinates):")
        for i, (x, y) in enumerate(actual_points, 1):
            print(f"  Point {i}: ({x}, {y})")
        
        # Define real-world coordinates (meters)
        real_world_points = [
            (0, 0),                                    # Top-left
            (field_width_meters, 0),                   # Top-right
            (field_width_meters, field_length_meters), # Bottom-right
            (0, field_length_meters)                   # Bottom-left
        ]
        
        # Use actual_points (original frame coordinates) for homography
        return self.set_homography_from_field_points(actual_points, real_world_points)
    
    def estimate_camera_movement(self, frame, frame_idx):
        """
        Estimate camera movement between frames using optical flow
        """
        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Initialize on first frame
        if self.old_gray is None:
            self.old_gray = frame_gray
            
            # Create mask for feature detection (edges of frame)
            mask = np.zeros_like(frame_gray)
            mask[:, 0:20] = 1
            mask[:, -20:] = 1
            
            self.old_features = cv2.goodFeaturesToTrack(
                frame_gray,
                maxCorners=100,
                qualityLevel=0.3,
                minDistance=3,
                blockSize=7,
                mask=mask
            )
            self.camera_movement.append((0, 0))
            return (0, 0)
        
        # Calculate optical flow
        if self.old_features is not None and len(self.old_features) > 0:
            new_features, status, _ = cv2.calcOpticalFlowPyrLK(
                self.old_gray, frame_gray, self.old_features, None, **self.lk_params
            )
            
            if new_features is not None:
                # Find maximum movement
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
                
                # Only update if significant movement
                if max_distance > 5:
                    self.camera_movement.append((camera_dx, camera_dy))
                    # Re-detect features
                    mask = np.zeros_like(frame_gray)
                    mask[:, 0:20] = 1
                    mask[:, -20:] = 1
                    self.old_features = cv2.goodFeaturesToTrack(
                        frame_gray, maxCorners=100, qualityLevel=0.3,
                        minDistance=3, blockSize=7, mask=mask
                    )
                else:
                    self.camera_movement.append((0, 0))
            else:
                self.camera_movement.append((0, 0))
        else:
            self.camera_movement.append((0, 0))
        
        self.old_gray = frame_gray.copy()
        return self.camera_movement[-1]
    
    def transform_position(self, x, y):
        """
        Transform pixel position to real-world meters using homography
        """
        if self.homography_matrix is None:
            return None, None
        
        point = np.array([[[x, y]]], dtype=np.float32)
        transformed = cv2.perspectiveTransform(point, self.homography_matrix)
        return transformed[0][0][0], transformed[0][0][1]
    
    def update(self, frame_idx, tracks, frame=None):
        """
        Update player positions and calculate speeds
        """
        # Estimate camera movement if frame is provided
        camera_dx, camera_dy = 0, 0
        if frame is not None:
            camera_dx, camera_dy = self.estimate_camera_movement(frame, frame_idx)
        
        current_speeds = {}
        
        for track in tracks:
            if not track.is_confirmed():
                continue
            
            track_id = track.track_id
            bbox = track.to_ltrb()
            
            # Get foot position (bottom center)
            x_center = (bbox[0] + bbox[2]) / 2
            y_foot = bbox[3]
            
            # Compensate for camera movement
            x_adjusted = x_center - camera_dx
            y_adjusted = y_foot - camera_dy
            
            # Transform to real-world coordinates
            x_transformed, y_transformed = self.transform_position(x_adjusted, y_adjusted)
            
            # Store position
            self.player_positions[track_id].append({
                'frame': frame_idx,
                'x_pixel': x_center,
                'y_pixel': y_foot,
                'x_adjusted': x_adjusted,
                'y_adjusted': y_adjusted,
                'x_transformed': x_transformed,
                'y_transformed': y_transformed
            })
            
            # Calculate speed using frame window
            if len(self.player_positions[track_id]) >= 2:
                speed_ms, speed_kmh, distance = self._calculate_speed_windowed(track_id, frame_idx)
                
                if speed_ms is not None:
                    self.player_speeds[track_id].append(speed_ms)
                    
                    current_speeds[track_id] = {
                        'speed_kmh': speed_kmh,
                        'speed_ms': speed_ms,
                        'distance': self.player_distances[track_id],
                        'max_speed_kmh': max(self.player_speeds[track_id]) * 3.6 if self.player_speeds[track_id] else 0
                    }
        
        return current_speeds
    
    def _calculate_speed_windowed(self, track_id, current_frame):
        """
        Calculate speed over frame window for smoothness
        """
        positions = self.player_positions[track_id]
        
        if len(positions) < 2:
            return None, None, 0
        
        # Find position at start of window
        start_idx = None
        for i in range(len(positions) - 1, -1, -1):
            if current_frame - positions[i]['frame'] >= self.frame_window:
                start_idx = i
                break
        
        if start_idx is None:
            start_idx = 0
        
        start_pos = positions[start_idx]
        end_pos = positions[-1]
        
        # Use transformed positions if available
        if start_pos['x_transformed'] is not None and end_pos['x_transformed'] is not None:
            x1, y1 = start_pos['x_transformed'], start_pos['y_transformed']
            x2, y2 = end_pos['x_transformed'], end_pos['y_transformed']
        else:
            # Fallback to pixel positions with basic conversion
            x1, y1 = start_pos['x_adjusted'], start_pos['y_adjusted']
            x2, y2 = end_pos['x_adjusted'], end_pos['y_adjusted']
            # Approximate conversion (will be inaccurate without homography)
            x1, y1, x2, y2 = x1/50, y1/50, x2/50, y2/50
        
        # Calculate distance in meters
        distance_meters = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        
        # Update total distance
        self.player_distances[track_id] += distance_meters
        
        # Calculate time
        frame_diff = end_pos['frame'] - start_pos['frame']
        time_seconds = frame_diff / self.fps
        
        if time_seconds == 0:
            return None, None, 0
        
        # Calculate speed
        speed_ms = distance_meters / time_seconds
        speed_kmh = speed_ms * 3.6
        
        return speed_ms, speed_kmh, distance_meters
    
    def get_player_stats(self, track_id):
        """Get comprehensive stats for a player"""
        if track_id not in self.player_speeds or len(self.player_speeds[track_id]) == 0:
            return None
        
        speeds_kmh = [s * 3.6 for s in self.player_speeds[track_id]]
        
        return {
            'track_id': track_id,
            'max_speed_kmh': max(speeds_kmh),
            'avg_speed_kmh': np.mean(speeds_kmh),
            'total_distance_m': self.player_distances[track_id],
            'sprint_count': sum(1 for s in speeds_kmh if s > 20)
        }
    
    def export_stats_to_csv(self, output_path, track_class_map=None):
        """Export player statistics to CSV"""
        class_names = {0: "Ball", 1: "Goalkeeper", 2: "Player", 3: "Referee"}
        
        with open(output_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Track_ID', 'Class', 'Max_Speed_kmh', 'Avg_Speed_kmh', 
                           'Total_Distance_m', 'Sprint_Count'])
            
            for track_id in sorted(self.player_speeds.keys()):
                stats = self.get_player_stats(track_id)
                if stats:
                    class_id = track_class_map.get(track_id, 2) if track_class_map else 2
                    class_name = class_names.get(class_id, "Unknown")
                    
                    writer.writerow([
                        track_id,
                        class_name,
                        f"{stats['max_speed_kmh']:.2f}",
                        f"{stats['avg_speed_kmh']:.2f}",
                        f"{stats['total_distance_m']:.2f}",
                        stats['sprint_count']
                    ])
        
        print(f"✅ Stats exported to: {output_path}")


def draw_speed_overlay(frame, track_id, bbox, speed_info, color):
    """Draw speed information on frame"""
    x1, y1, x2, y2 = map(int, bbox)
    
    speed_kmh = speed_info['speed_kmh']
    speed_text = f"{speed_kmh:.1f} km/h"
    
    text_x = x1
    text_y = y1 - 10
    
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.5
    thickness = 1
    (text_width, text_height), _ = cv2.getTextSize(speed_text, font, font_scale, thickness)
    
    padding = 5
    cv2.rectangle(frame, 
                  (text_x - padding, text_y - text_height - padding),
                  (text_x + text_width + padding, text_y + padding),
                  (0, 0, 0), -1)
    
    cv2.putText(frame, speed_text, (text_x, text_y),
                font, font_scale, color, thickness)
    
    return frame