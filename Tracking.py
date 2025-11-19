# Tracker.py
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import csv
import os
# === CLASS COLORS ===
CLASS_COLORS = {
    0: (120, 200, 50),    # Ball
    1: (200, 120, 255),   # Goalkeeper
    2: (255, 180, 120),   # Player
    3: (150, 150, 255)    # Referee
}
# === YOLO MODEL LOADER ===
def load_model(model_path):
    return YOLO(model_path)
# === DEEPSORT TRACKER ===
def create_tracker(max_age=20, n_init=3, nn_budget=100, max_cosine_distance=0.3):
    return DeepSort(max_age=max_age, n_init=n_init, nn_budget=nn_budget, max_cosine_distance=max_cosine_distance)
# === UTILITY FUNCTIONS ===
def get_center_of_bbox(bbox):
    x1, y1, x2, y2 = bbox
    return int((x1 + x2) / 2), int((y1 + y2) / 2)
def get_bbox_width(bbox):
    return int(bbox[2] - bbox[0])
def draw_ellipse(frame, bbox, color, track_id=None):
    try:
        y2 = int(bbox[3])
        x_center, _ = get_center_of_bbox(bbox)
        width = max(1, get_bbox_width(bbox))
        cv2.ellipse(frame, (x_center, y2), (int(width), int(0.35 * width)),
                    0, -45, 235, color, 2)
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
def draw_legend(frame):
    try:
        frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(frame_pil)
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf", 24)
            text_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf", 18)
        except:
            title_font, text_font = ImageFont.load_default(), ImageFont.load_default()
        lx, ly = 20, 20
        lw, lh = 220, 160
        overlay = frame.copy()
        cv2.rectangle(overlay, (lx, ly), (lx + lw, ly + lh), (0, 100, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
        frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(frame_pil)
        draw.rectangle([(lx, ly), (lx + lw, ly + lh)], outline=(200, 200, 200), width=2)
        draw.text((lx + 10, ly + 5), "Legend", font=title_font, fill=(0, 0, 0))
        items = [("Ball", CLASS_COLORS[0]), ("Goalkeeper", CLASS_COLORS[1]),
                 ("Player", CLASS_COLORS[2]), ("Referee", CLASS_COLORS[3])]
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
# === CSV UTILITY ===
def init_csv(csv_path):
    if not os.path.exists(csv_path):
        with open(csv_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["frame", "track_id", "class", "x_center", "y_center"])
def write_csv(csv_path, frame_idx, track_id, cls, x_center, y_center):
    with open(csv_path, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([frame_idx, track_id, cls, x_center, y_center])
