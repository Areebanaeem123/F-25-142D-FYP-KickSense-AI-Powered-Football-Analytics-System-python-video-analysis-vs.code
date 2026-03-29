import cv2
import os
import numpy as np

def test_codec(codec_name, filename):
    print(f"Testing codec: {codec_name}...")
    try:
        fourcc = cv2.VideoWriter_fourcc(*codec_name)
        out = cv2.VideoWriter(filename, fourcc, 30.0, (640, 480))
        if out.isOpened():
            # Write 5 frames to ensure it's not just a dummy open
            for _ in range(5):
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                out.write(frame)
            out.release()
            size = os.path.getsize(filename)
            if size > 1000: # Some threshold to ensure data is there
                print(f"Result for {codec_name}: SUCCESS (Size: {size} bytes)")
                os.remove(filename)
                return True
            else:
                print(f"Result for {codec_name}: FAILED (File too small: {size} bytes)")
                os.remove(filename)
                return False
        else:
            print(f"Result for {codec_name}: FAILED (Could not open VideoWriter)")
            return False
    except Exception as e:
        print(f"Error testing {codec_name}: {e}")
        return False

print("--- OpenCV Advanced Codec Diagnostic ---")
test_codec('avc1', 'test_avc1.mp4')
test_codec('H264', 'test_h264.mp4')
test_codec('hev1', 'test_hev1.mp4')
test_codec('hvc1', 'test_hvc1.mp4')
test_codec('mp4v', 'test_mp4v.mp4')
print("--- End Diagnostic ---")
