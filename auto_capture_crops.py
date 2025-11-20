import cv2
import os
from ultralytics import YOLO
from Tracking import load_model
VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/tayyab_vid.mp4"
SAVE_DIR = "auto_samples"
os.makedirs(SAVE_DIR, exist_ok=True)

model = load_model("/home/labuser/Downloads/weights/best.pt")

cap = cv2.VideoCapture(VIDEO_PATH)
frame_id = 0
MAX_FRAMES = 150  # process first 150 frames, adjust as needed

while cap.isOpened() and frame_id < MAX_FRAMES:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)[0]
    for i, box in enumerate(results.boxes.xyxy):
        x1, y1, x2, y2 = map(int, box.tolist())

        crop = frame[y1:y2, x1:x2]
        filename = f"{SAVE_DIR}/frame{frame_id:04d}_det{i:02d}.jpg"
        cv2.imwrite(filename, crop)

    frame_id += 1

cap.release()
print("Done! Crops saved in", SAVE_DIR)
