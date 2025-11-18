from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
import cv2
import csv
import os
# === MODEL & TRACKER ===
model = YOLO("/home/labuser/Downloads/weights/best.pt")
trackers = {i: DeepSort(max_age=30, n_init=3, nn_budget=100) for i in range(4)}
# === CLASS COLORS (BGR) ===
CLASS_COLORS = {
    0: (0, 255, 0),        # Green
    1: (255, 0, 0),        # Blue
    2: (0, 255, 255),        # Red
    3: (0, 0, 255)    # Yellow
}
# === VIDEO ===
cap = cv2.VideoCapture("/home/labuser/Desktop/KickSense/input_videos/tayyab_vid.mp4")

# === CSV SETUP ===
csv_path = "player_xy_coordinates.csv"
# Create file with headers if not exists
if not os.path.exists(csv_path):
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["frame", "track_id", "class", "x_center", "y_center"])

frame_idx = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # YOLO inference
    results = model.predict(frame, conf=0.4, iou=0.5, device="cuda", verbose=False)[0]

    # Dict of detections grouped by class
    det_list = {0: [], 1: [], 2: [], 3: []}

    for box in getattr(results, "boxes", []):
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        w, h = x2 - x1, y2 - y1

        # Add detection for each class
        det_list[cls].append([[x1, y1, w, h], conf, str(cls)])

    # Update each class tracker
    for cls, tracker in trackers.items():
        tracks = tracker.update_tracks(det_list[cls], frame=frame)

        for t in tracks:
            if not t.is_confirmed():
                continue

            x1, y1, x2, y2 = map(int, t.to_ltrb())
            track_id = t.track_id
            # Calculate center
            x_center = int((x1 + x2) / 2)
            y_center = int((y1 + y2) / 2)

            # Write to CSV
            with open(csv_path, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([frame_idx, track_id, cls, x_center, y_center])

            # === DRAWING WITH CLASS COLORS ===
            color = CLASS_COLORS.get(cls, (255, 255, 255))  # default white

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"ID:{track_id}",
                        (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        color,
                        2)

    # Resize window
    frame = cv2.resize(frame, (900, 600))

    cv2.imshow("Tracking", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

    frame_idx += 1

cap.release()
cv2.destroyAllWindows()
