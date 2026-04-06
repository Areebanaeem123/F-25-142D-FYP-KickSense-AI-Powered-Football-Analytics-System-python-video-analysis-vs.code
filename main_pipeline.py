"""
Main script for football player tracking system
Uses MANUAL keyframe homography for real-world speed & distance estimation
+ Team Cohesion Analysis
+ Dribbling Effectiveness Analysis
+ Foul Risk Estimation
"""

import cv2
import numpy as np
import os
from datetime import datetime, timedelta, timezone

from tracking_processor_optimized import OptimizedTrackingProcessor
from video_renderer import VideoRenderer

from speed_and_distance_estimator import (
    KeyframeHomography,
    apply_homography_to_tracks,
    SpeedAndDistance_Estimator
)
from foul_risk_estimator import FoulRiskEstimator
from dribbling_analyzer import DribblingAnalyzer
from shooting_analyzer import ShootingAnalyzer
from substitution_recommender import SubstitutionRecommender
from lineup_assigner import LineupAssigner
from db_connect import KicksenseDB


# ============================================================
# CONFIGURATION
# ============================================================

VIDEO_PATH = "/home/areeba/Desktop/real.mp4"
MODEL_PATH = "/home/areeba/Downloads/weights/best.pt"

OUTPUT_VIDEO_PATH = "video_results/advanced_player_tracking_output.mp4"
STATS_CSV_PATH = "video_results/player_stats_advanced.csv"

DISPLAY_SIZE = (900, 600)
SPRINT_THRESHOLD_MS = 7.0  # ~25.2 km/h

# ============================================================
# LINEUP CONFIGURATION
# Set to None to disable lineup constraints for a team.
# Fill in actual jersey numbers from the match lineup.
# ============================================================
TEAM_A_LINEUP = None  # e.g. [1, 2, 4, 5, 7, 8, 10, 11, 14, 17, 23]
TEAM_B_LINEUP = None  # e.g. [1, 3, 5, 6, 8, 9, 11, 14, 19, 21, 27]

# Optional: Map jersey numbers to player names for each team.
# team_id -> {jersey_number: "Player Name"}
PLAYER_NAMES: dict = {
    # 0: {10: "Lionel Messi", 7: "Cristiano Ronaldo", ...},
    # 1: {9: "Robert Lewandowski", ...},
}


def load_db_config():
    """Load TimescaleDB config from environment with local defaults."""
    return {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "dbname": os.getenv("DB_NAME", "kicksense"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "password123"),
    }


def persist_results_to_db(tracks, player_stats, foul_risk_map, dribbling_data,
                          shooting_data, fps, total_frames, match_id=1,
                          jersey_recognizer=None, lineup_assigner=None):

    """
    Persist frame-level tracking rows + aggregated player stats + dribbling stats to TimescaleDB.
    CSV export is still kept as primary validation output.
    """
    db = KicksenseDB(load_db_config())
    if not db.conn:
        print("⚠️ Skipping DB write: TimescaleDB connection unavailable.")
        return

    try:
        db.ensure_tables()
        db.clear_match_data(match_id=match_id)

        start_ts = datetime.now(timezone.utc)
        safe_fps = max(1, int(fps))

        for frame_idx in range(total_frames):
            timestamp = start_ts + timedelta(seconds=frame_idx / safe_fps)
            detections = []

            for object_name in ("players", "goalkeepers"):
                frame_data = tracks.get(object_name, {}).get(frame_idx, {})
                for track_id, info in frame_data.items():
                    pos = info.get("position_transformed")
                    if pos is None:
                        continue

                    x_coord = float(pos[0])
                    y_coord = float(pos[1])
                    team_id = info.get("team_id")

                    speed_kmh = float(info.get("speed") or 0.0)
                    speed_ms = speed_kmh / 3.6
                    is_sprinting = speed_ms >= SPRINT_THRESHOLD_MS

                    detections.append((
                        int(track_id),
                        team_id,
                        x_coord,
                        y_coord,
                        speed_ms,
                        is_sprinting,
                    ))

            if detections:
                db.add_frame_data(timestamp, detections, match_id=match_id)

        db.flush()
        db.upsert_player_stats(player_stats, foul_risk_map=foul_risk_map, match_id=match_id)
        db.upsert_dribbling_stats(dribbling_data, match_id=match_id)
        db.upsert_shooting_stats(shooting_data, fps=safe_fps, match_id=match_id)

        # Persist jersey number assignments
        if jersey_recognizer is not None:
            assignments = jersey_recognizer.get_all_assignments()
            names = lineup_assigner.get_all_names() if lineup_assigner else {}
            db.upsert_jersey_numbers(
                assignments=assignments,
                player_names=names,
                match_id=match_id,
            )

        print("✅ TimescaleDB updated with tracking_data, player_match_stats, "
              "dribbling, shooting, and jersey number stats")

    finally:
        db.close()

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
    jersey_recognizer = results.get("jersey_recognizer")

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

    print("🎯 Analyzing dribbling effectiveness...")
    dribbling_analyzer = DribblingAnalyzer(fps=fps)
    dribbling_data = dribbling_analyzer.analyze_tracks(tracks)
    
    # Print dribbling summary
    print(f"📊 Dribbles detected: {len(dribbling_data['dribble_events'])}")
    for team_id, stats in dribbling_data.get("team_dribbling_stats", {}).items():
        print(f"   Team {team_id}: {stats['total_dribbles']} attempts, "
              f"{stats['success_rate']:.1f}% success rate")

    print("🚀 Analyzing shooting statistics...")
    shooting_analyzer = ShootingAnalyzer(fps=fps)
    shooting_data = shooting_analyzer.analyze_tracks(tracks)
    print(f"📊 Shots detected: {len(shooting_data['shot_events'])}")


    player_stats = speed_estimator.export_stats_to_csv(
        tracks,
        STATS_CSV_PATH,
        stable_class_map,
        foul_risk_map=foul_risk_map
    )

    # --------------------------------------------------------
    # STEP 5: JERSEY NUMBER RECOGNITION (Post-processing)
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 5: Jersey Number Assignment")
    print("-" * 70)

    lineup_assigner = None
    if jersey_recognizer is not None:
        # Print OCR stats before lineup constraints
        ocr_stats = jersey_recognizer.get_prediction_stats()
        ocr_assigned = sum(1 for s in ocr_stats.values() if s["assigned"] is not None)
        print(f"🔢 OCR recognised {ocr_assigned}/{len(ocr_stats)} tracks before lineup constraints")

        # Apply lineup constraints if configured
        if TEAM_A_LINEUP is not None or TEAM_B_LINEUP is not None:
            lineup_assigner = LineupAssigner(
                team_a_numbers=TEAM_A_LINEUP,
                team_b_numbers=TEAM_B_LINEUP,
                player_names=PLAYER_NAMES,
            )
            lineup_assigner.assign(jersey_recognizer, tracks, stable_class_map)
            print("✅ Lineup constraints applied")
        else:
            print("ℹ️  No lineup configured — using OCR results only")

        # Inject final jersey numbers into player_stats for DB persistence
        all_assignments = jersey_recognizer.get_all_assignments()
        all_names = lineup_assigner.get_all_names() if lineup_assigner else {}
        for item in player_stats:
            tid = int(item["track_id"])
            jn = all_assignments.get(tid)
            if jn is not None:
                item["jersey_number"] = jn
                item["player_name"] = all_names.get(tid, "")

        # Backfill jersey_number into tracks dict for rendering
        for obj_name in ("players", "goalkeepers"):
            for fdata in tracks.get(obj_name, {}).values():
                for sid, info in fdata.items():
                    jn = all_assignments.get(sid)
                    if jn is not None:
                        info["jersey_number"] = jn

        # Print summary
        final_count = len(all_assignments)
        print(f"✅ Final jersey assignments: {final_count} players identified")
        for sid, num in sorted(all_assignments.items()):
            name = all_names.get(sid, "")
            name_str = f" ({name})" if name else ""
            print(f"   Track {sid} → #{num}{name_str}")
    else:
        print("⚠️  Jersey recognizer not available — skipping")

    print("📝 Calculating substitution recommendations...")
    sub_recommender = SubstitutionRecommender()
    sub_recommendations = sub_recommender.recommend(foul_risk_map)
    
    # Inject sub_priority into player_stats for persistence
    for item in player_stats:
        tid = int(item["track_id"])
        item["sub_priority"] = sub_recommendations.get(tid, 0.0)

    print(f"✅ Player statistics saved ({len(player_stats)} tracks)")
    print("🗄️ Persisting analytics to TimescaleDB...")
    persist_results_to_db(
        tracks=tracks,
        player_stats=player_stats,
        foul_risk_map=foul_risk_map,
        dribbling_data=dribbling_data,
        shooting_data=shooting_data,
        fps=fps,
        total_frames=total_frames,
        match_id=1,
        jersey_recognizer=jersey_recognizer,
        lineup_assigner=lineup_assigner,
    )


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
