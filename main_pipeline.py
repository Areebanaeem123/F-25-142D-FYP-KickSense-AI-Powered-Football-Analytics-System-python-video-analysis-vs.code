import cv2, torch
from Tracking import load_model, create_tracker, draw_ellipse, CLASS_COLORS, write_csv
from team_classifier import classify_team

VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/tayyab_vid.mp4"
DISPLAY_SIZE = (900, 600)

model = load_model("/home/labuser/Downloads/weights/best.pt")
tracker = create_tracker()

cap = cv2.VideoCapture(VIDEO_PATH)
frame_idx = 0
SKIP_FRAMES = 1  # process every frame; increase to 2-3 to speed up

while True:
    ret, frame = cap.read()
    if not ret:
        break

    if frame_idx % SKIP_FRAMES != 0:
        frame_idx += 1
        continue

    # Resize smaller for faster inference
    frame_small = cv2.resize(frame, (640, 360))

    # GPU inference with no_grad and half precision
    with torch.no_grad():
        results = model.predict(frame_small, conf=0.4, iou=0.5, device="cuda", half=True, verbose=False)[0]

    # Collect detections
    detections = []
    for box in getattr(results, "boxes", []):
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        # Scale coordinates to original frame
        x1 = int(x1 * frame.shape[1] / 640)
        x2 = int(x2 * frame.shape[1] / 640)
        y1 = int(y1 * frame.shape[0] / 360)
        y2 = int(y2 * frame.shape[0] / 360)
        detections.append([[x1, y1, x2-x1, y2-y1], conf, str(cls)])

    # Update tracker
    tracks = tracker.update_tracks(detections, frame=frame)
    for t in tracks:
        if not t.is_confirmed(): continue
        x1, y1, x2, y2 = map(int, t.to_ltrb())
        track_id = t.track_id
        #crop players
        crop= frame[y1:y2, x1:x2]
        team = classify_team(crop)   
        #predict teams using siglip
        print(f"player ID: {track_id}, Team: {team}")
        try: cls = int(t.det_class)
        except: cls = 2
        draw_ellipse(frame, (x1, y1, x2, y2), CLASS_COLORS.get(cls,(255,255,255)), track_id)

    # Show frame
    frame_display = cv2.resize(frame, DISPLAY_SIZE)
    cv2.imshow("Tracking - Press 'q' to quit", frame_display)
    if cv2.waitKey(1) & 0xFF == ord("q"): break

    frame_idx += 1

cap.release()
cv2.destroyAllWindows()
