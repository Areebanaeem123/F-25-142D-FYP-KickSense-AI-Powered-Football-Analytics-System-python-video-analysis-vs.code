import cv2
import torch
import numpy as np
from Tracking import load_model, create_tracker, draw_ellipse, CLASS_COLORS
from sprint_speed_estimation import AdvancedSpeedEstimator, draw_speed_overlay
VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/match.mp4"
OUTPUT_VIDEO_PATH = "/home/labuser/Desktop/KickSense/video_results/output_advanced.mp4"
STATS_CSV_PATH = "/home/labuser/Desktop/KickSense/video_results/player_stats_advanced.csv"
DISPLAY_SIZE = (900, 600)
# Initialize models
model = load_model("/home/labuser/Downloads/weights/best.pt")
tracker = create_tracker()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
cap = cv2.VideoCapture(VIDEO_PATH)
fps = int(cap.get(cv2.CAP_PROP_FPS))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
# === INITIALIZE ADVANCED SPEED ESTIMATOR ===
speed_estimator = AdvancedSpeedEstimator(
    fps=fps,
    frame_window=5  # Calculate speed over 5 frames for smoothness
)
# === HOMOGRAPHY CALIBRATION ===
print("\n🎯 STEP 1: Homography Calibration")
print("This will open a frame for you to mark the field corners.")
print("You can use the penalty box or entire field.")

# Get a frame for calibration
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
ret, calibration_frame = cap.read()
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Reset to beginning

if ret:
    # Option 1: Interactive calibration (RECOMMENDED)
    homography = speed_estimator.set_homography_from_calibration(
        calibration_frame,
        field_width_meters=68.0,
        field_length_meters=105.0
    )
    
    # Option 2: Manual points (uncomment if you know the points)
    # field_points_pixels = [(x1,y1), (x2,y2), (x3,y3), (x4,y4)]
    # field_points_meters = [(0,0), (68,0), (68,105), (0,105)]
    # homography = speed_estimator.set_homography_from_field_points(
    #     field_points_pixels, field_points_meters
    # )
    
    if homography is None:
        print("❌ Calibration cancelled. Exiting...")
        exit()
else:
    print("❌ Could not read frame for calibration")
    exit()

print("\n🎬 Starting video processing with advanced speed estimation...")

# Video writer for output
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(OUTPUT_VIDEO_PATH, fourcc, fps, (width, height))

frame_idx = 0
track_class_map = {}

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

def draw_statistics_panel(frame, speed_estimator, track_class_map):
    """Draw top speeds panel"""
    panel_x = width - 350
    panel_y = 10
    panel_width = 340
    panel_height = 200
    
    overlay = frame.copy()
    cv2.rectangle(overlay, (panel_x, panel_y), 
                  (panel_x + panel_width, panel_y + panel_height), 
                  (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
    
    cv2.putText(frame, "TOP SPEEDS", (panel_x + 10, panel_y + 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    player_stats = []
    for track_id in speed_estimator.player_speeds.keys():
        stats = speed_estimator.get_player_stats(track_id)
        if stats and track_id in track_class_map:
            class_id = track_class_map[track_id]
            if class_id in [1, 2]:
                player_stats.append(stats)
    
    player_stats.sort(key=lambda x: x['max_speed_kmh'], reverse=True)
    
    y_offset = panel_y + 55
    for i, stats in enumerate(player_stats[:5]):
        track_id = stats['track_id']
        max_speed = stats['max_speed_kmh']
        distance = stats['total_distance_m']
        
        class_id = track_class_map.get(track_id, 2)
        color = CLASS_COLORS.get(class_id, (255, 255, 255))
        
        text = f"{i+1}. ID{track_id}: {max_speed:.1f} km/h ({distance:.0f}m)"
        cv2.putText(frame, text, (panel_x + 15, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        y_offset += 30
    
    return frame

def draw_camera_movement_info(frame, camera_movement):
    """Draw camera movement information"""
    dx, dy = camera_movement
    info_x, info_y = 10, height - 60
    
    overlay = frame.copy()
    cv2.rectangle(overlay, (info_x, info_y), (info_x + 300, info_y + 50), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
    
    cv2.putText(frame, f"Camera X: {dx:.1f}px", (info_x + 10, info_y + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    cv2.putText(frame, f"Camera Y: {dy:.1f}px", (info_x + 10, info_y + 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    return frame

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    frame_small = cv2.resize(frame, (640, 360))
    
    with torch.no_grad():
        results = model.predict(frame_small, conf=0.4, iou=0.5, device="cuda", 
                              half=True, verbose=False)[0]
    
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
    
    tracks = tracker.update_tracks(detections, frame=frame)
    
    # === UPDATE SPEED ESTIMATOR WITH FRAME (for camera movement) ===
    speed_info = speed_estimator.update(frame_idx, tracks, frame=frame)
    
    # Get current camera movement
    current_camera_movement = speed_estimator.camera_movement[-1] if speed_estimator.camera_movement else (0, 0)
    
    # Map track IDs to classes
    for track in tracks:
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
            
            x1 = max(track_bbox[0], det_bbox[0])
            y1 = max(track_bbox[1], det_bbox[1])
            x2 = min(track_bbox[2], det_bbox[2])
            y2 = min(track_bbox[3], det_bbox[3])
            
            intersection = max(0, x2 - x1) * max(0, y2 - y1)
            track_area = (track_bbox[2] - track_bbox[0]) * (track_bbox[3] - track_bbox[1])
            det_area = (det_bbox[2] - det_bbox[0]) * (det_bbox[3] - det_bbox[1])
            iou = intersection / (track_area + det_area - intersection + 1e-6)
            
            if dist < min_dist and iou > 0.3:
                min_dist = dist
                best_cls = det['cls']
        
        track_class_map[track.track_id] = best_cls
    
    # Draw tracked objects
    for track in tracks:
        if not track.is_confirmed():
            continue
        
        x1, y1, x2, y2 = map(int, track.to_ltrb())
        track_id = track.track_id
        cls = track_class_map.get(track_id, 2)
        color = CLASS_COLORS.get(cls, (255, 180, 120))
        
        draw_ellipse(frame, (x1, y1, x2, y2), color, track_id)
        
        if track_id in speed_info:
            draw_speed_overlay(frame, track_id, (x1, y1, x2, y2), 
                             speed_info[track_id], color)
    
    # Draw balls
    for ball in ball_detections:
        draw_triangle_for_ball(frame, ball['bbox'], CLASS_COLORS[0])
    
    # Frame counter
    overlay_text = f"Frame: {frame_idx}/{total_frames}"
    cv2.rectangle(frame, (10, 10), (400, 50), (0, 0, 0), -1)
    cv2.putText(frame, overlay_text, (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
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
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        legend_y += 30
    
    # Draw panels
    frame = draw_statistics_panel(frame, speed_estimator, track_class_map)
    frame = draw_camera_movement_info(frame, current_camera_movement)
    
    out.write(frame)
    
    frame_display = cv2.resize(frame, DISPLAY_SIZE)
    cv2.imshow("Advanced Player Tracking", frame_display)
    
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break
    
    if frame_idx % 100 == 0:
        print(f"Processing frame {frame_idx}/{total_frames}")
    
    frame_idx += 1

cap.release()
out.release()
cv2.destroyAllWindows()

# Export statistics
speed_estimator.export_stats_to_csv(STATS_CSV_PATH, track_class_map)

print(f"\n✅ Processing complete!")
print(f"📹 Output video: {OUTPUT_VIDEO_PATH}")
print(f"📊 Statistics CSV: {STATS_CSV_PATH}")
print(f"\nClass Distribution:")
class_counts = {}
for cls_id, cls_name in [(0, "Ball"), (1, "Goalkeeper"), (2, "Player"), (3, "Referee")]:
    if cls_id == 0:
        print(f"  {cls_name}: Detected (no tracking)")
    else:
        count = list(track_class_map.values()).count(cls_id)
        class_counts[cls_name] = count
        print(f"  {cls_name}: {count} tracks")

# Speed summary
print(f"\n⚽ ADVANCED SPRINT SPEED SUMMARY:")
speed_summary = []
for track_id in sorted(speed_estimator.player_speeds.keys()):
    stats = speed_estimator.get_player_stats(track_id)
    if stats and track_id in track_class_map:
        class_id = track_class_map[track_id]
        class_names = {1: "GK", 2: "Player", 3: "Ref"}
        class_name = class_names.get(class_id, "Unknown")
        speed_summary.append({
            'id': track_id,
            'class': class_name,
            'max_speed': stats['max_speed_kmh'],
            'distance': stats['total_distance_m']
        })

speed_summary.sort(key=lambda x: x['max_speed'], reverse=True)
for i, player in enumerate(speed_summary[:10], 1):
    print(f"  {i}. ID {player['id']} ({player['class']}): "
          f"Max {player['max_speed']:.1f} km/h, "
          f"Distance {player['distance']:.1f}m")