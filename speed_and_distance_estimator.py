import cv2
import numpy as np
import os
import csv

# ============================================================
# 📐 CONSTANTS – REAL WORLD CENTER CIRCLE (meters)
# ============================================================

CENTER_CIRCLE_RADIUS = 9.15  # meters

REAL_WORLD_POINTS = np.array([
    [-CENTER_CIRCLE_RADIUS,  0.0],   # left
    [ CENTER_CIRCLE_RADIUS,  0.0],   # right
    [ 0.0, -CENTER_CIRCLE_RADIUS],   # bottom
    [ 0.0,  CENTER_CIRCLE_RADIUS],   # top
], dtype=np.float32)


# ============================================================
# 🧱 STEP 1: KEYFRAME HOMOGRAPHY MANAGER
# ============================================================

class KeyframeHomography:
    """
    Handles:
    - Storing homography matrices at keyframes
    - Interpolating homographies between frames
    - Transforming pixel points → real-world meters
    """

    def __init__(self):
        self.keyframes = {}  # frame_idx -> 3x3 homography matrix

    def add_keyframe(self, frame_idx, image_points):
        """
        image_points: list of 4 pixel points
        Order MUST be: [left, right, bottom, top]
        """
        image_points = np.array(image_points, dtype=np.float32)

        H, _ = cv2.findHomography(image_points, REAL_WORLD_POINTS)
        self.keyframes[frame_idx] = H

    def get_homography(self, frame_idx):
        keys = sorted(self.keyframes.keys())

        if frame_idx <= keys[0]:
            return self.keyframes[keys[0]]

        if frame_idx >= keys[-1]:
            return self.keyframes[keys[-1]]

        for i in range(len(keys) - 1):
            f1, f2 = keys[i], keys[i + 1]
            if f1 <= frame_idx <= f2:
                alpha = (frame_idx - f1) / (f2 - f1)
                return (1 - alpha) * self.keyframes[f1] + alpha * self.keyframes[f2]

    def transform_point(self, point, frame_idx):
        """
        Convert pixel [x, y] → real-world [X, Y] in meters
        """
        H = self.get_homography(frame_idx)
        p = np.array([[point[0], point[1], 1.0]])
        mapped = H @ p.T
        mapped /= mapped[2]
        return [mapped[0][0], mapped[1][0]]


# ============================================================
# 🧩 STEP 2: APPLY HOMOGRAPHY TO TRACKS
# ============================================================

def apply_homography_to_tracks(tracks, homography_manager):
    """
    Adds 'position_transformed' (meters) to each track
    """
    for object_name, object_tracks in tracks.items():
        if object_name in ["ball", "referees"]:
            continue

        for frame_idx, frame_data in object_tracks.items():
            for track_id, track_info in frame_data.items():
                if "position" not in track_info:
                    continue

                pixel_pos = track_info["position"]  # [x, y]
                real_pos = homography_manager.transform_point(pixel_pos, frame_idx)
                track_info["position_transformed"] = real_pos


# ============================================================
# 🧮 STEP 3: SPEED & DISTANCE ESTIMATOR
# ============================================================

class SpeedAndDistance_Estimator:
    def __init__(self, fps=30, frame_window=5):
        self.frame_window = frame_window
        self.frame_rate = fps

    def _measure_distance(self, p1, p2):
        """Euclidean distance in meters"""
        return ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5

    # --------------------------------------------------------
    # ✨ Smoothing
    # --------------------------------------------------------

    def smooth_positions(self, tracks):
        for object_name, object_tracks in tracks.items():
            if object_name in ["ball", "referees"]:
                continue

            trajectory_data = {}

            for frame_num, frame_data in object_tracks.items():
                for track_id, track_info in frame_data.items():
                    pos = track_info.get("position_transformed")
                    if pos is None:
                        continue

                    trajectory_data.setdefault(track_id, [])
                    trajectory_data[track_id].append([frame_num, pos[0], pos[1]])

            for track_id, positions in trajectory_data.items():
                if len(positions) < 5:
                    continue

                positions_np = np.array(positions)
                kernel = np.ones(5) / 5

                positions_np[:, 1] = np.convolve(positions_np[:, 1], kernel, mode="same")
                positions_np[:, 2] = np.convolve(positions_np[:, 2], kernel, mode="same")

                for row in positions_np:
                    f, x, y = int(row[0]), row[1], row[2]
                    if f in object_tracks and track_id in object_tracks[f]:
                        object_tracks[f][track_id]["position_transformed"] = [x, y]

    # --------------------------------------------------------
    # 🚀 Speed & Distance
    # --------------------------------------------------------

    def add_speed_and_distance_to_tracks(self, tracks):
        total_distance = {}

        for object_name, object_tracks in tracks.items():
            if object_name in ["ball", "referees"]:
                continue

            frame_nums = sorted(object_tracks.keys())

            for i in range(0, len(frame_nums), self.frame_window):
                f_start = frame_nums[i]
                f_end = frame_nums[min(i + self.frame_window, len(frame_nums) - 1)]

                for track_id in object_tracks[f_start]:
                    if track_id not in object_tracks[f_end]:
                        continue

                    p1 = object_tracks[f_start][track_id].get("position_transformed")
                    p2 = object_tracks[f_end][track_id].get("position_transformed")

                    if p1 is None or p2 is None:
                        continue

                    dist = self._measure_distance(p1, p2)
                    time = (f_end - f_start) / self.frame_rate
                    if time == 0:
                        continue

                    speed_kmh = (dist / time) * 3.6

                    if speed_kmh > 40:  # sanity cap
                        speed_kmh = 0
                        dist = 0

                    total_distance.setdefault(object_name, {})
                    total_distance[object_name].setdefault(track_id, 0)
                    total_distance[object_name][track_id] += dist

                    for j in range(i, min(i + self.frame_window, len(frame_nums))):
                        f = frame_nums[j]
                        if track_id in object_tracks[f]:
                            object_tracks[f][track_id]["speed"] = speed_kmh
                            object_tracks[f][track_id]["distance"] = total_distance[object_name][track_id]

    # --------------------------------------------------------
    # 📤 CSV Export
    # --------------------------------------------------------
    def export_stats_to_csv(self, tracks, output_path, track_class_map=None):
        """
        Export player statistics to CSV.
        Includes all tracked players, even if speed/distance is zero.
        """
        import os
        import csv

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        class_names = {0: "Ball", 1: "Goalkeeper", 2: "Player", 3: "Referee"}
        player_stats = []

        for object_name, object_tracks in tracks.items():
            if object_name in ["ball", "referees"]:
                continue

            # Collect all unique track IDs
            track_ids = set()
            for frame_data in object_tracks.values():
                track_ids.update(frame_data.keys())

            for tid in track_ids:
                speeds = []
                total_distance = 0

                for frame_data in object_tracks.values():
                    if tid in frame_data:
                        track_info = frame_data[tid]
                        if "speed" in track_info:
                            speeds.append(track_info["speed"])
                        if "distance" in track_info:
                            total_distance = max(total_distance, track_info["distance"])

                # Determine player class
                class_id = track_class_map.get(tid, 2) if track_class_map else 2
                class_name = class_names.get(class_id, "Unknown")

                # Append stats (even if no speed)
                player_stats.append({
                    "track_id": tid,
                    "class": class_name,
                    "max_speed_kmh": max(speeds) if speeds else 0.0,
                    "avg_speed_kmh": sum(speeds)/len(speeds) if speeds else 0.0,
                    "total_distance_m": total_distance
                })

        # Write CSV
        with open(output_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Track_ID", "Class", "Max_Speed_kmh", "Avg_Speed_kmh", "Total_Distance_m"])
            for stats in player_stats:
                writer.writerow([
                    stats["track_id"],
                    stats["class"],
                    f"{stats['max_speed_kmh']:.2f}",
                    f"{stats['avg_speed_kmh']:.2f}",
                    f"{stats['total_distance_m']:.2f}"
                ])

        print(f"✅ Player statistics saved ({len(player_stats)} tracks)")

        return player_stats