#!/usr/bin/env python3
import os
import cv2
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from team_classifier import TeamClassifier

# === CONFIGURATION ===
MODEL_PATH = "/home/labuser/Downloads/weights/best.pt"
VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/tayyab_vid.mp4"
OUTPUT_VIDEO = "styled_output_with_teams.mp4"
CONF_THRESHOLD = 0.4
SHOW_WINDOW = True
ENABLE_TEAM_CLASSIFICATION = True  # Toggle team classification on/off
TEAM_ASSIGNMENT_FRAMES = [5, 10, 15, 20, 25, 30, 35, 40]
DEVICE = 'cuda' if os.system('nvidia-smi') == 0 else 'cpu'
# ======================

# Define class colors (BGR)
CLASS_COLORS = {
    0: (0, 0, 0),        # Ball
    1: (255, 0, 0),      # Goalkeeper
    2: (0, 225, 0),      # Player
    3: (0, 255, 255),    # Referee
}
CLASS_NAMES = {0: "Ball", 1: "Goalkeeper", 2: "Player", 3: "Referee"}

# === UTILITY FUNCTIONS ===
def get_center_of_bbox(bbox):
    x1, y1, x2, y2 = bbox
    return int((x1 + x2) / 2), int((y1 + y2) / 2)

def get_bbox_width(bbox):
    return int(bbox[2] - bbox[0])

def get_foot_position(bbox):
    x_center, _ = get_center_of_bbox(bbox)
    return (x_center, int(bbox[3]))

def crop_player(frame, bbox):
    x1, y1, x2, y2 = map(int, bbox)
    h, w = frame.shape[:2]
    x1, x2 = max(0, x1), min(w, x2)
    y1, y2 = max(0, y1), min(h, y2)
    return frame[y1:y2, x1:x2]

def draw_ellipse(frame, bbox, color, track_id=None):
    y2 = int(bbox[3])
    x_center, _ = get_center_of_bbox(bbox)
    width = get_bbox_width(bbox)
    cv2.ellipse(
        frame,
        center=(x_center, y2),
        axes=(int(width), int(0.35 * width)),
        angle=0.0,
        startAngle=-45,
        endAngle=235,
        color=color,
        thickness=2,
        lineType=cv2.LINE_4
    )

    if track_id is not None:
        rectangle_width = 40
        rectangle_height = 20
        x1_rect = x_center - rectangle_width // 2
        x2_rect = x_center + rectangle_width // 2
        y1_rect = (y2 - rectangle_height // 2) + 15
        y2_rect = (y2 + rectangle_height // 2) + 15

        cv2.rectangle(frame, (int(x1_rect), int(y1_rect)), (int(x2_rect), int(y2_rect)), color, cv2.FILLED)
        x1_text = x1_rect + 12
        track_id_int = int(track_id) if isinstance(track_id, str) else track_id
        if track_id_int > 99:
            x1_text -= 10
        cv2.putText(frame, f"{track_id}", (int(x1_text), int(y1_rect + 15)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    return frame

def draw_triangle(frame, bbox, color):
    y = int(bbox[1])
    x, _ = get_center_of_bbox(bbox)
    triangle_points = np.array([[x, y], [x - 10, y - 20], [x + 10, y - 20]])
    cv2.drawContours(frame, [triangle_points], 0, color, cv2.FILLED)
    cv2.drawContours(frame, [triangle_points], 0, (255, 255, 255), 2)
    return frame

def draw_legend(frame, team_colors=None):
    frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(frame_pil)
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf", 24)
        text_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf", 18)
    except:
        try:
            title_font = ImageFont.truetype("C:/Windows/Fonts/timesbd.ttf", 24)
            text_font = ImageFont.truetype("C:/Windows/Fonts/times.ttf", 18)
        except:
            title_font = ImageFont.load_default()
            text_font = ImageFont.load_default()

    legend_x, legend_y = 20, 20
    legend_width = 220
    legend_height = 200 if team_colors else 140
    overlay = frame.copy()
    cv2.rectangle(overlay, (legend_x, legend_y),
                  (legend_x + legend_width, legend_y + legend_height),
                  (0, 100, 0), -1)
    alpha = 0.99
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
    frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(frame_pil)
    draw.rectangle([(legend_x, legend_y), (legend_x + legend_width, legend_y + legend_height)],
                   outline=(200, 200, 200), width=2)
    draw.text((legend_x + 10, legend_y + 5), "Legend", font=title_font, fill=(0, 0, 0))
    y_offset = legend_y + 50
    item_spacing = 25
    legend_items = [("Ball", CLASS_COLORS[0]), ("Referee", CLASS_COLORS[3])]
    if team_colors:
        legend_items.extend([
            ("Team 1", team_colors.get(1, (255, 0, 0))),
            ("Team 2", team_colors.get(2, (0, 0, 255)))
        ])
    else:
        legend_items.extend([
            ("Goalkeeper", CLASS_COLORS[1]),
            ("Player", CLASS_COLORS[2])
        ])
    frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
    for label, color in legend_items:
        cv2.circle(frame, (legend_x + 20, y_offset), 8, color, -1)
        cv2.circle(frame, (legend_x + 20, y_offset), 8, (0, 0, 0), 1)
        frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(frame_pil)
        draw.text((legend_x + 40, y_offset - 8), label, font=text_font, fill=(0, 0, 0))
        frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
        y_offset += item_spacing
    return frame

def collect_player_crops(cap, model, frame_numbers):
    all_crops = []
    original_pos = cap.get(cv2.CAP_PROP_POS_FRAMES)
    print(f"\n🎬 Collecting player crops from {len(frame_numbers)} frames...")
    for frame_num in frame_numbers:
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        if not ret:
            continue
        results = model.predict(frame, conf=CONF_THRESHOLD, iou=0.5, verbose=False)
        detections = results[0]
        for box in detections.boxes:
            cls_id = int(box.cls[0])
            if cls_id in [1, 2]:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                crop = crop_player(frame, [x1, y1, x2, y2])
                if crop.shape[0] > 0 and crop.shape[1] > 0:
                    all_crops.append(crop)
    cap.set(cv2.CAP_PROP_POS_FRAMES, original_pos)
    print(f"✅ Collected {len(all_crops)} player crops")
    return all_crops

def process_detections_with_tracking(frame, detections, trackers, team_classifier=None,
                                     team_assignments=None, team_colors=None):
    detection_list = {0: [], 1: [], 2: [], 3: []}
    for box in detections.boxes:
        conf = float(box.conf[0])
        if conf < CONF_THRESHOLD:
            continue
        cls_id = int(box.cls[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        if cls_id == 0:
            frame = draw_triangle(frame, [x1, y1, x2, y2], CLASS_COLORS[0])
        else:
            w, h = x2 - x1, y2 - y1
            detection_list[cls_id].append(([x1, y1, w, h], conf, str(cls_id)))
    for cls_id in [1, 2, 3]:
        if len(detection_list[cls_id]) > 0:
            tracks = trackers[cls_id].update_tracks(detection_list[cls_id], frame=frame)
            for track in tracks:
                if not track.is_confirmed():
                    continue
                track_id = track.track_id
                x1, y1, x2, y2 = map(int, track.to_ltrb())
                bbox = [x1, y1, x2, y2]
                if cls_id in [1, 2] and team_assignments and track_id in team_assignments:
                    team_id = team_assignments[track_id]
                    color = team_colors.get(team_id, CLASS_COLORS[cls_id])
                else:
                    color = CLASS_COLORS.get(cls_id, (255, 255, 255))
                frame = draw_ellipse(frame, bbox, color, track_id)
    return frame

# === MAIN FUNCTION ===
def main():
    print(f"🚀 Loading model from: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print(f"🎥 Opening video: {VIDEO_PATH}")
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print("❌ Error opening video file.")
        return
    fps = cap.get(cv2.CAP_PROP_FPS)
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # === TEAM CLASSIFICATION ===
    team_classifier = None
    team_assignments = {}
    team_colors_bgr = None
    if ENABLE_TEAM_CLASSIFICATION:
        print("\n⚽ Initializing Team Classification...")
        player_crops = collect_player_crops(cap, model, TEAM_ASSIGNMENT_FRAMES)
        if len(player_crops) >= 10:
            team_classifier = TeamClassifier(device=DEVICE, batch_size=16)
            team_classifier.fit(player_crops)
            predictions = team_classifier.predict(player_crops)
            team_colors_bgr = team_classifier.get_team_colors(player_crops, predictions)
            print("✅ Team classification complete!")
            print(f"   Team 1 color: {team_colors_bgr.get(1, 'N/A')}")
            print(f"   Team 2 color: {team_colors_bgr.get(2, 'N/A')}")
        else:
            print(f"⚠️ Not enough player samples ({len(player_crops)}) for team classification.")
            print("   Proceeding without team colors...")
    else:
        print("\n⚽ Team classification disabled")

    # === INITIALIZE TRACKERS ===
    print("\n🔍 Initializing DeepSORT trackers...")
    trackers = {i: DeepSort(max_age=30, n_init=3, nn_budget=100) for i in range(4)}

    # === SETUP OUTPUT VIDEO ===
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, fps, (w, h))
    if not out.isOpened():
        print("❌ Error: Could not open output video writer")
        cap.release()
        return

    print("*********************************************************")
    print(f"\n📸 Processing {frame_count} frames at {fps:.2f} FPS...")
    print("   Press 'q' to stop early\n")
    print("***********************************************************")

    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    frame_idx = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"\n📹 Reached end of video at frame {frame_idx}")
                break

            results = model.predict(frame, conf=CONF_THRESHOLD, iou=0.5, verbose=False)
            detections = results[0]

            frame = process_detections_with_tracking(
                frame, detections, trackers,
                team_classifier=team_classifier,
                team_assignments=team_assignments,
                team_colors=team_colors_bgr
            )

            frame = draw_legend(frame, team_colors_bgr)
            out.write(frame)

            if SHOW_WINDOW:
                cv2.imshow("KickSense - Player Tracking", frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("🛑 Stopped by user.")
                    break

            frame_idx += 1
            if frame_idx % 50 == 0:
                print(f"Processed {frame_idx}/{frame_count} frames...")

    except Exception as e:
        print(f"\n❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cap.release()
        out.release()
        cv2.destroyAllWindows()

    print(f"\n✅ Inference complete!")
    print(f"📂 Output saved at: {OUTPUT_VIDEO}")
    print(f"📊 Total frames processed: {frame_idx}")
    print(f"🎯 Team classification {'enabled' if ENABLE_TEAM_CLASSIFICATION else 'disabled'}")

if __name__ == "__main__":
    main()
