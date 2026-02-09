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

from cohesion_analyzer import CohesionAnalyzer  # NEW IMPORT

# ============================================================
# CONFIGURATION
# ============================================================

VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/working_video.mp4"
MODEL_PATH = "/home/labuser/Downloads/weights/best.pt"

OUTPUT_VIDEO_PATH = "video_results/advanced_player_tracking_output.mp4"
STATS_CSV_PATH = "video_results/player_stats_advanced.csv"
COHESION_CSV_PATH = "video_results/cohesion_timeline.csv"  # NEW OUTPUT

DISPLAY_SIZE = (900, 600)

# ============================================================
# 🖱️ MANUAL POINT SELECTION TOOL
# ============================================================

def select_circle_points(video_path, frame_idx):
    cap = cv2.VideoCapture(video_path)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
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

    print("\n🎯 Select points for FIRST keyframe")
    points1 = select_circle_points(VIDEO_PATH, frame_idx=120)
    homography.add_keyframe(120, points1)

    print("\n🎯 Select points for SECOND keyframe")
    points2 = select_circle_points(VIDEO_PATH, frame_idx=600)
    homography.add_keyframe(600, points2)

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

    player_stats = speed_estimator.export_stats_to_csv(
        tracks,
        STATS_CSV_PATH,
        track_class_map
    )

    print(f"✅ Player statistics saved ({len(player_stats)} tracks)")

    # --------------------------------------------------------
    # STEP 5: TEAM COHESION ANALYSIS (NEW!)
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 5: Team Cohesion Analysis")
    print("-" * 70)

    # Get team assignments (you need to have track_to_team mapping)
    # If you have SigLIP team classification, load it here
    # For now, I'll assume you have a way to get team assignments
    
    # TODO: Replace this with your actual team assignment logic
    # This is a placeholder - you need to adapt based on how you store team data
    try:
        # Try to load team assignments from your tracking processor
        track_to_team = results.get("track_to_team", {})
        
        if not track_to_team:
            print("⚠️ No team assignments found. Skipping cohesion analysis.")
            print("   Run team classification first to enable cohesion analysis.")
        else:
            # Initialize cohesion analyzer
            cohesion_analyzer = CohesionAnalyzer(
                standard_field_width=68,
                standard_field_length=105
            )
            
            # Analyze cohesion throughout match
            print("📊 Calculating team cohesion indices...")
            cohesion_timeline = cohesion_analyzer.analyze_match_cohesion(
                tracks=tracks,
                track_to_team=track_to_team,
                sample_interval=25  # Every 1 second at 25 fps
            )
            
            # Calculate average cohesion per team
            team_0_cohesions = [c for _, c in cohesion_timeline['team_0']]
            team_1_cohesions = [c for _, c in cohesion_timeline['team_1']]
            
            if team_0_cohesions:
                avg_cohesion_0 = np.mean(team_0_cohesions)
                max_cohesion_0 = np.max(team_0_cohesions)
                min_cohesion_0 = np.min(team_0_cohesions)
                print(f"\n📈 Team 0 Cohesion:")
                print(f"   Average: {avg_cohesion_0:.2f}/100")
                print(f"   Max: {max_cohesion_0:.2f}/100")
                print(f"   Min: {min_cohesion_0:.2f}/100")
            
            if team_1_cohesions:
                avg_cohesion_1 = np.mean(team_1_cohesions)
                max_cohesion_1 = np.max(team_1_cohesions)
                min_cohesion_1 = np.min(team_1_cohesions)
                print(f"\n📈 Team 1 Cohesion:")
                print(f"   Average: {avg_cohesion_1:.2f}/100")
                print(f"   Max: {max_cohesion_1:.2f}/100")
                print(f"   Min: {min_cohesion_1:.2f}/100")
            
            # Export cohesion timeline to CSV
            print(f"\n💾 Exporting cohesion data to {COHESION_CSV_PATH}...")
            import csv
            with open(COHESION_CSV_PATH, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['Frame', 'Time_Seconds', 'Team', 'Cohesion_Index', 
                               'Convex_Hull_Area_m2', 'Avg_Distance_m'])
                
                for frame, cohesion_score in cohesion_timeline['team_0']:
                    time_sec = frame / fps
                    # Get detailed metrics for this frame
                    frame_tracks = tracks['players'].get(frame, {})
                    team_0_positions = [
                        info['position_transformed'] 
                        for tid, info in frame_tracks.items() 
                        if track_to_team.get(tid) == 0 and info.get('position_transformed')
                    ]
                    if len(team_0_positions) >= 3:
                        details = cohesion_analyzer.calculate_cohesion_index(team_0_positions)
                        if details:
                            writer.writerow([
                                frame, round(time_sec, 2), 'Team_0', 
                                cohesion_score, 
                                details['convex_hull_area'],
                                details['avg_distance']
                            ])
                
                for frame, cohesion_score in cohesion_timeline['team_1']:
                    time_sec = frame / fps
                    frame_tracks = tracks['players'].get(frame, {})
                    team_1_positions = [
                        info['position_transformed'] 
                        for tid, info in frame_tracks.items() 
                        if track_to_team.get(tid) == 1 and info.get('position_transformed')
                    ]
                    if len(team_1_positions) >= 3:
                        details = cohesion_analyzer.calculate_cohesion_index(team_1_positions)
                        if details:
                            writer.writerow([
                                frame, round(time_sec, 2), 'Team_1', 
                                cohesion_score,
                                details['convex_hull_area'],
                                details['avg_distance']
                            ])
            
            print(f"✅ Cohesion timeline exported to {COHESION_CSV_PATH}")
            
            # Determine which team is more cohesive
            if team_0_cohesions and team_1_cohesions:
                print("\n" + "=" * 70)
                if avg_cohesion_0 > avg_cohesion_1:
                    diff = avg_cohesion_0 - avg_cohesion_1
                    print(f"🏆 Team 0 is more cohesive (+{diff:.2f} points)")
                    print("   → Better tactical organization and compactness")
                elif avg_cohesion_1 > avg_cohesion_0:
                    diff = avg_cohesion_1 - avg_cohesion_0
                    print(f"🏆 Team 1 is more cohesive (+{diff:.2f} points)")
                    print("   → Better tactical organization and compactness")
                else:
                    print("⚖️ Both teams show equal cohesion")
                print("=" * 70)
                
    except Exception as e:
        print(f"⚠️ Cohesion analysis failed: {e}")
        print("   Continuing without cohesion metrics...")

    # --------------------------------------------------------
    # STEP 6: VIDEO RENDERING
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
        track_class_map=track_class_map,
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
    print(f"📊 Cohesion CSV: {COHESION_CSV_PATH}")
    print("=" * 70)


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()