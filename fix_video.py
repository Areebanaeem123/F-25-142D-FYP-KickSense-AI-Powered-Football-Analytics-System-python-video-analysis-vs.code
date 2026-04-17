import os
import subprocess
import shutil

def fix_video():
    input_path = "video_results/advanced_player_tracking_output.mp4"
    output_h264_path = "video_results/advanced_player_tracking_output_h264.mp4"
    frontend_public_path = "frontend/public/video.mp4"

    if not os.path.exists(input_path):
        print(f"❌ Input video not found: {input_path}")
        return

    print(f"🔄 Converting {input_path} to H.264 using ffmpeg...")
    
    # ffmpeg command to convert to h264
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "23",
        output_h264_path
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"✅ Conversion complete: {output_h264_path}")
        
        # Ensure frontend public directory exists
        os.makedirs(os.path.dirname(frontend_public_path), exist_ok=True)
        
        # Copy to frontend
        print(f"📋 Copying to {frontend_public_path}...")
        shutil.copy2(output_h264_path, frontend_public_path)
        print("✅ Frontend video updated!")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ ffmpeg failed: {e}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    fix_video()
