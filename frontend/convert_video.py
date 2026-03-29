import cv2
import os
import sys

# Paths
INPUT_VIDEO = "public/video.mp4"
# We'll save as a temp file and then rename
OUTPUT_VIDEO = "public/video_fixed.mp4"

def convert_video():
    print(f"--- Video Conversion Utility ---")
    
    # Check if input exists
    input_path = os.path.join("frontend", INPUT_VIDEO)
    if not os.path.exists(input_path):
        # Maybe we are already in the frontend folder?
        input_path = INPUT_VIDEO
        if not os.path.exists(input_path):
            print(f"❌ Could not find {INPUT_VIDEO}. Make sure you are in the 'frontend' directory.")
            return

    print(f"📦 Opening {input_path}...")
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"❌ Error: Could not open video file.")
        return

    # Metadata
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"📊 Info: {width}x{height} @ {fps} FPS, Total Frames: {total_frames}")

    # Output writer (H.264)
    print(f"🎬 Initializing H.264 encoder (avc1)...")
    output_path = os.path.join(os.path.dirname(input_path), "video_fixed.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    if not out.isOpened():
        print(f"❌ Error: Could not initialize H.264 encoder. Re-running with mp4v (not web compatible)...")
        # Fallback just to see
        return

    print(f"🚀 Converting... (please wait)")
    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        out.write(frame)
        count += 1
        if count % 100 == 0:
            print(f"   Processed {count}/{total_frames} frames ({int((count/total_frames)*100)}%)", end='\r')

    cap.release()
    out.release()
    print(f"\n✅ Conversion successful! Saved to: {output_path}")
    print(f"💡 You can now rename 'video_fixed.mp4' to 'video.mp4' in your public folder.")

if __name__ == "__main__":
    convert_video()
