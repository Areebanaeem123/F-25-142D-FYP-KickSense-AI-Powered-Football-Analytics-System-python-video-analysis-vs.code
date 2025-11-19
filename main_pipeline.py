# this is the main runner file that will integrate all modules
# main_pipeline.py
import cv2
from Tracking import load_model, create_tracker, draw_ellipse, draw_legend, init_csv, write_csv, CLASS_COLORS
# === CONFIG ===
VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/match.mp4"
MODEL_PATH = "/home/labuser/Downloads/weights/best.pt"
CSV_PATH = "player_xy_coordinates.csv"
DISPLAY_SIZE = (900, 600)
# === LOAD MODEL AND TRACKER ===
model = load_model(MODEL_PATH)
tracker = create_tracker()
# === INIT CSV ===
init_csv(CSV_PATH)
# === OPEN VIDEO ===
cap = cv2.VideoCapture(VIDEO_PATH)
frame_idx = 0
while True:
    ret, frame = cap.read()
    if not ret:
        print("🎬 End of video reached.")
        break
    # YOLO Inference
    results = model.predict(frame, conf=0.4, iou=0.5, device="cuda", verbose=False)[0]
    # Collect detections
    detections = []
    for box in getattr(results, "boxes", []):
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        w, h = x2 - x1, y2 - y1
        detections.append([[x1, y1, w, h], conf, str(cls)])
    # Update tracker
    tracks = tracker.update_tracks(detections, frame=frame)
    for t in tracks:
        if not t.is_confirmed():
            continue
        x1, y1, x2, y2 = map(int, t.to_ltrb())
        track_id = t.track_id
        try:
            cls = int(t.det_class)
        except:
            cls = 2
        x_center = int((x1 + x2) / 2)
        y_center = int((y1 + y2) / 2)
        # Write CSV
        write_csv(CSV_PATH, frame_idx, track_id, cls, x_center, y_center)
        # Draw ellipse
        draw_ellipse(frame, (x1, y1, x2, y2), CLASS_COLORS.get(cls, (255, 255, 255)), track_id)
    # Draw legend
    frame = draw_legend(frame)
    # Resize for display
    frame = cv2.resize(frame, DISPLAY_SIZE)
    cv2.imshow("Tracking - Press 'q' to quit", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        print("🛑 User requested exit.")
        break
    frame_idx += 1
cap.release()
cv2.destroyAllWindows()
print(f"✅ Done! {frame_idx} frames processed.")
