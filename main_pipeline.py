import cv2
import torch
from PIL import Image
import numpy as np
from Tracking import load_model, create_tracker, draw_ellipse, CLASS_COLORS
from transformers import AutoProcessor, AutoModel

# ------------------------------
# CONFIG
# ------------------------------
VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/tayyab_vid.mp4"
DISPLAY_SIZE = (900, 600)
SKIP_FRAMES = 5  # process every 5th frame for speed
CLASSIFY_EVERY_N_FRAMES = 10  # classify each track every N frames

# ------------------------------
# LOAD TRACKING MODEL
# ------------------------------
model = load_model("/home/labuser/Downloads/weights/best.pt")
tracker = create_tracker()

# ------------------------------
# LOAD SigLIP MODEL
# ------------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
siglip_model = AutoModel.from_pretrained("google/siglip-so400m-patch14-384").to(device)
siglip_processor = AutoProcessor.from_pretrained("google/siglip-so400m-patch14-384", use_fast=True)
team_texts = ["team in yellow", "team in white", "referee in black"]

# ------------------------------
# VIDEO CAPTURE
# ------------------------------
cap = cv2.VideoCapture(VIDEO_PATH)
frame_idx = 0

# Dictionary to store last classification for each track_id
track_class_cache = {}

while True:
    ret, frame = cap.read()
    if not ret:
        break

    if frame_idx % SKIP_FRAMES != 0:
        frame_idx += 1
        continue

    # Resize smaller for faster inference
    frame_small = cv2.resize(frame, (640, 360))

    # --------------------------
    # YOLO MODEL INFERENCE
    # --------------------------
    with torch.no_grad():
        results = model.predict(frame_small, conf=0.4, iou=0.5, device="cuda", half=True, verbose=False)[0]

    # Collect detections
    detections = []
    for box in getattr(results, "boxes", []):
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        x1 = int(x1 * frame.shape[1] / 640)
        x2 = int(x2 * frame.shape[1] / 640)
        y1 = int(y1 * frame.shape[0] / 360)
        y2 = int(y2 * frame.shape[0] / 360)
        detections.append([[x1, y1, x2-x1, y2-y1], float(box.conf[0]), str(int(box.cls[0]))])

    # --------------------------
    # UPDATE TRACKER
    # --------------------------
    tracks = tracker.update_tracks(detections, frame=frame)
    player_crops = []
    player_track_ids = []

    for t in tracks:
        if not t.is_confirmed():
            continue

        x1, y1, x2, y2 = map(int, t.to_ltrb())
        track_id = t.track_id

        # Decide if we need to classify this player
        classify_now = (track_id not in track_class_cache) or (frame_idx % CLASSIFY_EVERY_N_FRAMES == 0)

        if classify_now:
            player_crop = frame[y1:y2, x1:x2]
            if player_crop.size == 0:
                continue
            player_pil = Image.fromarray(cv2.cvtColor(player_crop, cv2.COLOR_BGR2RGB)).resize((384, 384))
            player_crops.append(player_pil)
            player_track_ids.append(track_id)

    # --------------------------
    # CLASSIFY PLAYER CROPS IN BATCH
    # --------------------------
    if len(player_crops) > 0:
        inputs = siglip_processor(text=team_texts, images=player_crops, padding="max_length", return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = siglip_model(**inputs)
        probs = torch.sigmoid(outputs.logits_per_image)
        class_indices = probs.argmax(dim=1).cpu().numpy()

        for track_id, class_idx in zip(player_track_ids, class_indices):
            track_class_cache[track_id] = class_idx

    # --------------------------
    # DRAW TRACKS WITH TEAM LABELS
    # --------------------------
    for t in tracks:
        if not t.is_confirmed():
            continue

        x1, y1, x2, y2 = map(int, t.to_ltrb())
        track_id = t.track_id
        class_idx = track_class_cache.get(track_id, 0)
        team_label = team_texts[class_idx]

        # Color mapping
        color = (0, 255, 255) if class_idx == 0 else (255, 255, 255)  # yellow or white
        if class_idx == 2:
            color = (0, 0, 0)  # referee in black

        draw_ellipse(frame, (x1, y1, x2, y2), color, track_id)
        cv2.putText(frame, f"{team_label} {track_id}", (x1, y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    # --------------------------
    # DISPLAY FRAME
    # --------------------------
    frame_display = cv2.resize(frame, DISPLAY_SIZE)
    cv2.imshow("Optimized Tracking + Team Classification", frame_display)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

    frame_idx += 1

cap.release()
cv2.destroyAllWindows()
