# final file ( run this file to run the inference with tracking and visualization)
# this file consist of module 1 implementation
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
import cv2
import csv
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
# === MODEL & TRACKER ===
model = YOLO("/home/labuser/Downloads/weights/best.pt")
tracker = DeepSort(max_age=20, n_init=3, nn_budget=100, max_cosine_distance=0.3)   # SINGLE TRACKER
# === CLASS COLORS (Prettier Palette) ===
CLASS_COLORS = {
    0: (120, 200, 50),     # Pastel Green  (Ball)
    1: (200, 120, 255),    # Soft Violet  (Goalkeeper)
    2: (255, 180, 120),    # Coral Peach  (Player)
    3: (150, 150, 255)     # Baby Blue    (Referee)
}
# === VIDEO PATH ===
cap = cv2.VideoCapture("/home/labuser/Desktop/KickSense/input_videos/match.mp4")
# === CSV SETUP ===
csv_path = "player_xy_coordinates.csv"
if not os.path.exists(csv_path):
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["frame", "track_id", "class", "x_center", "y_center"])
##################################
# UTILITY FUNCTIONS
##################################
def get_center_of_bbox(bbox):
    x1, y1, x2, y2 = bbox
    return int((x1 + x2) / 2), int((y1 + y2) / 2)
def get_bbox_width(bbox):
    return int(bbox[2] - bbox[0])
def crop_player(frame, bbox):
    x1, y1, x2, y2 = map(int, bbox)
    h, w = frame.shape[:2]
    x1, x2 = max(0, x1), min(w, x2)
    y1, y2 = max(0, y1), min(h, y2)
    if x2 <= x1 or y2 <= y1:
        return None
    return frame[y1:y2, x1:x2]
def draw_ellipse(frame, bbox, color, track_id=None):
    try:
        y2 = int(bbox[3])
        x_center, _ = get_center_of_bbox(bbox)
        width = max(1, get_bbox_width(bbox))
        # Draw ellipse shape
        cv2.ellipse(frame, (x_center, y2), (int(width), int(0.35 * width)),
                    0, -45, 235, color, 2)
        # ID Label under ellipse
        if track_id is not None:
            rect_w, rect_h = 40, 20
            x1r, x2r = x_center - rect_w // 2, x_center + rect_w // 2
            y1r, y2r = (y2 - rect_h // 2) + 15, (y2 + rect_h // 2) + 15
            cv2.rectangle(frame, (x1r, y1r), (x2r, y2r), color, cv2.FILLED)
            cv2.putText(frame, str(track_id), (x1r + 12, y1r + 15),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    except Exception as e:
        print(f"⚠️ draw_ellipse error: {e}")
    return frame
def draw_legend(frame, team_colors=None):
    try:
        frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(frame_pil)
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf", 24)
            text_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf", 18)
        except:
            title_font, text_font = ImageFont.load_default(), ImageFont.load_default()
        lx, ly = 20, 20
        lw = 220
        lh = 160
        overlay = frame.copy()
        cv2.rectangle(overlay, (lx, ly), (lx + lw, ly + lh), (0, 100, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
        frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(frame_pil)
        draw.rectangle([(lx, ly), (lx + lw, ly + lh)], outline=(200, 200, 200), width=2)
        draw.text((lx + 10, ly + 5), "Legend", font=title_font, fill=(0, 0, 0))
        items = [("Ball", CLASS_COLORS[0]), ("Goalkeeper", CLASS_COLORS[1]),("Player", CLASS_COLORS[2]), ("Referee", CLASS_COLORS[3])]
        y_offset = ly + 50
        spacing = 28
        frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
        for label, color in items:
            cv2.circle(frame, (lx + 20, y_offset), 8, color, -1)
            cv2.circle(frame, (lx + 20, y_offset), 8, (0, 0, 0), 1)
            frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            draw = ImageDraw.Draw(frame_pil)
            draw.text((lx + 40, y_offset - 8), label, font=text_font, fill=(0, 0, 0))
            frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
            y_offset += spacing
        return frame
    except Exception as e:
        print(f"⚠️ draw_legend error: {e}")
        return frame
##########
# MAIN LOOP
###########
frame_idx = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    # YOLO Inference
    results = model.predict(frame, conf=0.4, iou=0.5, device="cuda", verbose=False)[0]
    # Collect ALL detections for ONE tracker
    detections = []
    classes = {}
    for box in getattr(results, "boxes", []):
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        w, h = x2 - x1, y2 - y1
        detections.append([[x1, y1, w, h], conf, str(cls)])
        classes[str(cls)] = cls
    # Update tracker once
    tracks = tracker.update_tracks(detections, frame=frame)
    for t in tracks:
        if not t.is_confirmed():
            continue
        x1, y1, x2, y2 = map(int, t.to_ltrb())
        track_id = t.track_id
        try:
            cls = int(t.det_class)
        except:
            cls = 2  # fallback if class missing
        x_center = int((x1 + x2) / 2)
        y_center = int((y1 + y2) / 2)
        # Write to CSV
        with open(csv_path, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([frame_idx, track_id, cls, x_center, y_center])
        # Draw ellipse overlay
        draw_ellipse(frame, (x1, y1, x2, y2), CLASS_COLORS.get(cls, (255, 255, 255)), track_id)
    # Add legend
    frame = draw_legend(frame)
    # Resize for display
    frame = cv2.resize(frame, (900, 600))
    cv2.imshow("Tracking", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break
    frame_idx += 1
cap.release()
cv2.destroyAllWindows()
