from ultralytics import YOLO
#this is the file whcih trains the model
# Load model
model = YOLO("yolov8m.pt")  # or yolov8m.pt
# Train
model.train(
    data="/home/labuser/Desktop/KickSense/data.yaml",
    epochs=100,          # adjust as needed
    imgsz=640,          # image size
    batch=16,           # batch size (depends on your GPU)
    device=0            # 0 for first GPU, or 'cpu' if none
)
