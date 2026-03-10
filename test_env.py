#!/usr/bin/env python
"""Quick environment test"""
import sys
print(f"Python: {sys.version}")

try:
    import numpy as np
    print(f"✅ numpy {np.__version__}")
except Exception as e:
    print(f"❌ numpy: {e}")

try:
    from deep_sort_realtime.deepsort_tracker import DeepSort
    print(f"✅ deep_sort_realtime")
except Exception as e:
    print(f"❌ deep_sort_realtime: {e}")

try:
    from ultralytics import YOLO
    print(f"✅ ultralytics")
except Exception as e:
    print(f"❌ ultralytics: {e}")

try:
    import cv2
    print(f"✅ cv2 {cv2.__version__}")
except Exception as e:
    print(f"❌ cv2: {e}")

print("\n✅ Environment test complete!")
