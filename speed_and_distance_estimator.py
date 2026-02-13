import cv2
import numpy as np
import os
import csv
from scipy.signal import savgol_filter

# ============================================================
# 📐 REAL WORLD CENTER CIRCLE POINTS (meters)
# ============================================================
CENTER_CIRCLE_RADIUS = 9.15  # meters

REAL_WORLD_POINTS = np.array([
    [-CENTER_CIRCLE_RADIUS,  0.0],   # left
    [ CENTER_CIRCLE_RADIUS,  0.0],   # right
    [ 0.0, -CENTER_CIRCLE_RADIUS],   # bottom
    [ 0.0,  CENTER_CIRCLE_RADIUS],   # top
], dtype=np.float32)

# ============================================================
# 🖱️ MANUAL POINT SELECTION TOOL
# ============================================================

def select_circle_points(video_path, frame_idx):
    """
    Lets user manually click 4 points on the center circle.
    Order to click: 1) LEFT, 2) RIGHT, 3) BOTTOM, 4) TOP
    """
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
            cv2.putText(display, str(i+1), tuple(p), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255), 2)

        if len(points) < 4:
            cv2.putText(display, instructions[len(points)], (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,255), 2)
        else:
            cv2.putText(display, "Press ENTER to confirm", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

        cv2.imshow("Select Center Circle Points", display)
        key = cv2.waitKey(1)

        if key == 13 and len(points) == 4:  # ENTER key
            break

    cv2.destroyAllWindows()
    return points

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
        image_points: list of 4 pixel points [left, right, bottom, top]
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
# 🧩 STEP 2: APPLY HOMOGRAPHY TO TRACKS (Corrected for FEET)
# ============================================================

def apply_homography_to_tracks(tracks, homography_manager):
    """
    Adds 'position_transformed' (meters) to each track.
    Using Bottom-Center (Feet) logic to fix perspective error.
    """
    for object_name, object_tracks in tracks.items():
        if object_name in ["ball", "referees"]:
            continue

        for frame_idx, frame_data in object_tracks.items():
            for track_id, track_info in frame_data.items():
                
                # FIX 1: Use Feet Position (Bottom of BBox)
                # Assuming 'bbox' is [x1, y1, x2, y2]
                if "bbox" in track_info:
                    bbox = track_info["bbox"]
                    x_center = (bbox[0] + bbox[2]) / 2
                    y_bottom = bbox[3] 
                    pixel_pos = [x_center, y_bottom]
                else:
                    # Fallback if no bbox (unlikely for object trackers)
                    pixel_pos = track_info.get("position")

                if pixel_pos is None:
                    continue

                real_pos = homography_manager.transform_point(pixel_pos, frame_idx)
                track_info["position_transformed"] = real_pos


# ============================================================
# 🧮 STEP 3: SPEED & DISTANCE ESTIMATOR (Corrected Logic)
# ============================================================

class SpeedAndDistance_Estimator:
    def __init__(self, fps=30, frame_window=5):
        self.frame_window = frame_window
        self.frame_rate = fps

    def _measure_distance(self, p1, p2):
        """Euclidean distance in meters"""
        return ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5

    # --------------------------------------------------------
    # ✨ Smoothing (UPGRADED: HEAVIER SMOOTHING)
    # --------------------------------------------------------

    def smooth_positions(self, tracks):
        for object_name, object_tracks in tracks.items():
            if object_name in ["ball", "referees"]:
                continue

            # 1. Collect all position data per track_id
            trajectory_data = {}
            for frame_num, frame_data in object_tracks.items():
                for track_id, track_info in frame_data.items():
                    pos = track_info.get("position_transformed")
                    if pos is None:
                        continue

                    trajectory_data.setdefault(track_id, {"frames": [], "x": [], "y": []})
                    trajectory_data[track_id]["frames"].append(frame_num)
                    trajectory_data[track_id]["x"].append(pos[0])
                    trajectory_data[track_id]["y"].append(pos[1])

            # 2. Apply Savitzky-Golay Filter to each track
            for tid, data in trajectory_data.items():
                if len(data["frames"]) < 7: # Need minimal data for filter
                    continue

                # --- UPGRADE: Increased window length for smoother curves ---
                # Was 25, now 45. (Roughly 1.5 seconds at 30fps)
                # This squashes high-frequency noise/jitter effectively.
                window_length = min(45, len(data["frames"]))
                if window_length % 2 == 0:
                    window_length -= 1
                
                poly_order = 2 

                # Stronger smoothing on X and Y
                smooth_x = savgol_filter(data["x"], window_length, poly_order)
                smooth_y = savgol_filter(data["y"], window_length, poly_order)

                # 3. Write smoothed data back to tracks
                for i, frame_num in enumerate(data["frames"]):
                    if frame_num in object_tracks and tid in object_tracks[frame_num]:
                        object_tracks[frame_num][tid]["position_transformed"] = [smooth_x[i], smooth_y[i]]

    # --------------------------------------------------------
    # 🚀 Speed & Distance (UPGRADED: STRICTER THRESHOLDS)
    # --------------------------------------------------------

    def add_speed_and_distance_to_tracks(self, tracks):
        total_distance = {}
        
        # --- UPGRADE: Stricter limits to match real-world data ---
        MIN_SPEED_THRESH = 2.5  # Ignore slow shuffling (< 2.5 km/h)
        MAX_SPEED_THRESH = 35.0 # Strict cap at Elite Sprint speed (~35 km/h)

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

                    # --- NOISE FILTERING ---
                    # If speed is superhuman (jitter), kill it.
                    if speed_kmh > MAX_SPEED_THRESH: 
                        speed_kmh = 0
                        dist = 0
                    
                    # If speed is tiny (vibration), kill it.
                    if speed_kmh < MIN_SPEED_THRESH:
                        speed_kmh = 0
                        dist = 0 
                    # -----------------------

                    total_distance.setdefault(object_name, {})
                    total_distance[object_name].setdefault(track_id, 0)
                    total_distance[object_name][track_id] += dist

                    for j in range(i, min(i + self.frame_window, len(frame_nums))):
                        f = frame_nums[j]
                        if track_id in object_tracks[f]:
                            object_tracks[f][track_id]["speed"] = speed_kmh
                            object_tracks[f][track_id]["distance"] = total_distance[object_name][track_id]

    # --------------------------------------------------------
    # 📤 CSV Export (Filtered)
    # --------------------------------------------------------
    def export_stats_to_csv(self, tracks, output_path, track_class_map=None, foul_risk_map=None):
        """
        Export player statistics to CSV.
        FILTERS out 'ghost' tracks that have < 5m total distance.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        class_names = {0: "Ball", 1: "Goalkeeper", 2: "Player", 3: "Referee"}
        player_stats = []

        # 1. Define Filter Thresholds
        MIN_DISTANCE_THRESH = 5.0  # Meters. Ignore tracks shorter than this.
        
        for object_name, object_tracks in tracks.items():
            if object_name in ["ball", "referees"]:
                continue

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

                # --- FILTERING STEP ---
                # If the "player" moved less than 5 meters in the whole clip, 
                # it's likely a detection glitch or a fragment. Skip it.
                if total_distance < MIN_DISTANCE_THRESH:
                    continue
                # ----------------------

                class_id = track_class_map.get(tid, 2) if track_class_map else 2
                class_name = class_names.get(class_id, "Unknown")

                player_stats.append({
                    "track_id": tid,
                    "class": class_name,
                    "max_speed_kmh": max(speeds) if speeds else 0.0,
                    "avg_speed_kmh": sum(speeds)/len(speeds) if speeds else 0.0,
                    "total_distance_m": total_distance
                })

        # Sort by ID for cleaner reading
        player_stats.sort(key=lambda x: x['track_id'])

        with open(output_path, "w", newline="") as f:
            writer = csv.writer(f)
            header = ["Track_ID", "Class", "Max_Speed_kmh", "Avg_Speed_kmh", "Total_Distance_m"]
            if foul_risk_map is not None:
                header += ["Foul_Risk", "Yellow_Likelihood", "Red_Likelihood", "Card_Prediction", "Contact_Events"]
            writer.writerow(header)
            for stats in player_stats:
                row = [
                    stats["track_id"],
                    stats["class"],
                    f"{stats['max_speed_kmh']:.2f}",
                    f"{stats['avg_speed_kmh']:.2f}",
                    f"{stats['total_distance_m']:.2f}",
                ]
                if foul_risk_map is not None:
                    foul = foul_risk_map.get(stats["track_id"])
                    row += [
                        f"{foul['foul_risk']:.2f}" if foul else "",
                        f"{foul['yellow_likelihood']:.2f}" if foul else "",
                        f"{foul['red_likelihood']:.2f}" if foul else "",
                        f"{foul['card_prediction']}" if foul else "",
                        f"{foul['contact_events']}" if foul else "",
                    ]
                writer.writerow(row)

        print(f"✅ Player statistics saved ({len(player_stats)} valid tracks)")
        return player_stats
