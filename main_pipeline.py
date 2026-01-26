"""
Main script for football player tracking system
Uses keyframe homography for real-world speed & distance estimation
"""

from tracking_processor_optimized import OptimizedTrackingProcessor
from video_renderer import VideoRenderer

from speed_and_distance_estimator import (
    KeyframeHomography,
    apply_homography_to_tracks,
    SpeedAndDistance_Estimator
)

# ============================================================
# CONFIGURATION
# ============================================================

VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/working_video.mp4"
MODEL_PATH = "/home/labuser/Downloads/weights/best.pt"

OUTPUT_VIDEO_PATH = "video_results/advanced_player_tracking_output.mp4"
STATS_CSV_PATH = "video_results/player_stats_advanced.csv"

DISPLAY_SIZE = (900, 600)

# ============================================================
# MAIN PIPELINE
# ============================================================

def main():
    print("=" * 70)
    print("🎯 Football Player Tracking System (REAL-WORLD METRICS)")
    print("=" * 70)
    print("📐 Mode: Keyframe Homography + Interpolation")
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
    camera_movement = results["camera_movement"]

    fps = results["fps"]
    width = results["width"]
    height = results["height"]
    total_frames = results["total_frames"]

    # --------------------------------------------------------
    # STEP 2: HOMOGRAPHY SETUP
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 2: Homography Calibration")
    print("-" * 70)

    homography = KeyframeHomography()

    homography.add_keyframe(
        frame_idx=120,
        image_points=[
            [640, 360],  # left
            [820, 360],  # right
            [730, 450],  # bottom
            [730, 270],  # top
        ]
    )

    homography.add_keyframe(
        frame_idx=600,
        image_points=[
            [620, 370],
            [840, 360],
            [740, 470],
            [740, 260],
        ]
    )

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
    # STEP 4: VIDEO RENDERING
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 4: Video Rendering")
    print("-" * 70)

    renderer = VideoRenderer(
        video_path=VIDEO_PATH,
        output_path=OUTPUT_VIDEO_PATH,
        display_size=DISPLAY_SIZE
    )

    renderer.render_video(
        tracks=tracks,
        track_class_map=track_class_map,
        camera_movement_per_frame=camera_movement,
        fps=fps,
        width=width,
        height=height,
        total_frames=total_frames
    )

    # --------------------------------------------------------
    # STEP 5: SPEED & DISTANCE ESTIMATION
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 5: Speed & Distance Estimation")
    print("-" * 70)

    speed_estimator = SpeedAndDistance_Estimator(
        fps=fps,
        frame_window=5
    )

    speed_estimator.smooth_positions(tracks)
    speed_estimator.add_speed_and_distance_to_tracks(tracks)

    player_stats = speed_estimator.export_stats_to_csv(
        tracks,
        STATS_CSV_PATH,
        track_class_map
    )

    print(f"✅ Player statistics saved ({len(player_stats)} tracks)")

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
