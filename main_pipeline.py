"""
Main script for football player tracking system
Uses MANUAL keyframe homography for real-world speed & distance estimation
+ Team Cohesion Analysis
"""

import cv2
import numpy as np

from tracking_processor_optimized import OptimizedTrackingProcessor
from video_renderer import VideoRenderer

from speed_and_distance_estimator import (
    KeyframeHomography,
    apply_homography_to_tracks,
    SpeedAndDistance_Estimator
)
from foul_risk_estimator import FoulRiskEstimator

# ============================================================
# CONFIGURATION
# ============================================================

VIDEO_PATH = "/home/areeba/Desktop/real.mp4"
MODEL_PATH = "/home/areeba/Downloads/weights/best.pt"

OUTPUT_VIDEO_PATH = "video_results/advanced_player_tracking_output.mp4"
STATS_CSV_PATH = "video_results/player_stats_advanced.csv"

DISPLAY_SIZE = (900, 600)

# ============================================================
# 🖱️ MANUAL POINT SELECTION TOOL
# ============================================================

def select_circle_points(video_path, frame_idx):
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        raise ValueError("❌ Could not read video metadata for homography selection")

    safe_frame_idx = max(0, min(int(frame_idx), total_frames - 1))
    cap.set(cv2.CAP_PROP_POS_FRAMES, safe_frame_idx)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        raise ValueError("❌ Could not read frame for homography selection")

    points = []

    def mouse_callback(event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN and len(points) < 4:
            points.append([x, y])
            print(f"Point {len(points)} selected: ({x}, {y})")

    instructions = [
        "Click LEFT edge of center circle",
        "Click RIGHT edge of center circle",
        "Click BOTTOM edge of center circle",
        "Click TOP edge of center circle",
    ]

    cv2.namedWindow("Select Center Circle Points")
    cv2.setMouseCallback("Select Center Circle Points", mouse_callback)

    while True:
        display = frame.copy()

        for i, p in enumerate(points):
            cv2.circle(display, tuple(p), 6, (0, 255, 0), -1)
            cv2.putText(display, str(i+1), tuple(p),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255), 2)

        if len(points) < 4:
            cv2.putText(display, instructions[len(points)], (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,255), 2)
        else:
            cv2.putText(display, "Press ENTER to confirm", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

        cv2.imshow("Select Center Circle Points", display)
        key = cv2.waitKey(1)

        if key == 13 and len(points) == 4:
            break

    cv2.destroyAllWindows()
    return points


def choose_homography_keyframes(total_frames):
    """
    Choose two valid keyframes within the video duration.
    Uses 30% and 80% of timeline to capture perspective changes.
    """
    if total_frames <= 1:
        return 0, 0

    last_idx = total_frames - 1
    first = int(0.30 * last_idx)
    second = int(0.80 * last_idx)

    if second <= first:
        second = min(last_idx, first + 1)

    return first, second


# ============================================================
# MAIN PIPELINE
# ============================================================

def main():
    print("=" * 70)
    print("🎯 Football Player Tracking System (REAL-WORLD METRICS)")
    print("=" * 70)
    print("📐 Mode: Manual Keyframe Homography")
    print("⚽ Field reference: Center Circle (radius = 9.15m)")
    print()

    # --------------------------------------------------------
    # STEP 1: VIDEO PROCESSING & TRACKING
    # --------------------------------------------------------

    print("STEP 1: Video Processing & Tracking")
    print("-" * 70)

    processor = OptimizedTrackingProcessor(
        video_path=VIDEO_PATH,
        model_path=MODEL_PATH,
        pixels_per_meter=None
    )

    processor.process_video()
    processor.post_process()
    results = processor.get_results()

    tracks = results["tracks"]
    track_class_map = results["track_class_map"]
    stable_class_map = results.get("stable_class_map", track_class_map)
    camera_movement = results["camera_movement"]

    fps = results["fps"]
    width = results["width"]
    height = results["height"]
    total_frames = results["total_frames"]

    # --------------------------------------------------------
    # STEP 2: MANUAL HOMOGRAPHY CALIBRATION
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 2: Manual Homography Calibration")
    print("-" * 70)

    homography = KeyframeHomography()

    keyframe_1, keyframe_2 = choose_homography_keyframes(total_frames)
    print(f"🎞️ Auto-selected homography frames: {keyframe_1}, {keyframe_2}")

    print("\n🎯 Select points for FIRST keyframe")
    points1 = select_circle_points(VIDEO_PATH, frame_idx=keyframe_1)
    homography.add_keyframe(keyframe_1, points1)

    print("\n🎯 Select points for SECOND keyframe")
    points2 = select_circle_points(VIDEO_PATH, frame_idx=keyframe_2)
    homography.add_keyframe(keyframe_2, points2)

    print(f"✅ Added {len(homography.keyframes)} homography keyframes")

    # --------------------------------------------------------
    # STEP 3: PIXEL → REAL-WORLD TRANSFORMATION
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 3: Pixel → Meter Transformation")
    print("-" * 70)

    apply_homography_to_tracks(tracks, homography)
    print("✅ Player coordinates mapped to meters")

    # --------------------------------------------------------
    # STEP 4: SPEED & DISTANCE ESTIMATION
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 4: Speed & Distance Estimation")
    print("-" * 70)

    speed_estimator = SpeedAndDistance_Estimator(fps=fps, frame_window=5)

    speed_estimator.smooth_positions(tracks)
    speed_estimator.add_speed_and_distance_to_tracks(tracks)

    print("🟨 Estimating foul/card likelihoods...")
    foul_estimator = FoulRiskEstimator(fps=fps)
    foul_risk_map = foul_estimator.estimate(tracks)

    player_stats = speed_estimator.export_stats_to_csv(
        tracks,
        STATS_CSV_PATH,
        stable_class_map,
        foul_risk_map=foul_risk_map
    )

    print(f"✅ Player statistics saved ({len(player_stats)} tracks)")

    # --------------------------------------------------------
    # STEP 5: VIDEO RENDERING
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 6: Video Rendering")
    print("-" * 70)

    renderer = VideoRenderer(
        video_path=VIDEO_PATH,
        output_path=OUTPUT_VIDEO_PATH,
        display_size=DISPLAY_SIZE
    )

    renderer.render_video(
        tracks=tracks,
        track_class_map=stable_class_map,
        camera_movement_per_frame=camera_movement,
        fps=fps,
        width=width,
        height=height,
        total_frames=total_frames
    )

    # --------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("✅ PROCESSING COMPLETE")
    print("=" * 70)
    print(f"📹 Output video: {OUTPUT_VIDEO_PATH}")
    print(f"📊 Statistics CSV: {STATS_CSV_PATH}")
    print("=" * 70)


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()
