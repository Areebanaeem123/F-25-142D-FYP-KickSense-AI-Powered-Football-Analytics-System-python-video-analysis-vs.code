import cv2
import numpy as np
import os
import csv

class SpeedAndDistance_Estimator():
    def __init__(self, fps=30, frame_window=5):
        self.frame_window = frame_window
        self.frame_rate = fps

    def _measure_distance(self, p1, p2):
        """Euclidean distance in meters"""
        return ((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)**0.5

    def smooth_positions(self, tracks):
        """
        Apply a Moving Average Filter to all trajectories to remove noise/jitter.
        Must be run BEFORE calculating speed.
        """
        for object_name, object_tracks in tracks.items():
            if object_name == "ball" or object_name == "referees":
                continue

            # 1. Extract raw trajectories per player
            # Format: {track_id: [ [frame_num, x, y], ... ]}
            trajectory_data = {}
            
            # --- FIX: Iterate over dictionary items, not enumerate() ---
            for frame_num, frame_data in object_tracks.items():
                for track_id, track_info in frame_data.items():
                    if "position_transformed" not in track_info or track_info["position_transformed"] is None:
                        continue
                        
                    if track_id not in trajectory_data:
                        trajectory_data[track_id] = []
                    
                    pos = track_info["position_transformed"]
                    trajectory_data[track_id].append([frame_num, pos[0], pos[1]])

            # 2. Smooth and Write Back
            for track_id, positions in trajectory_data.items():
                if len(positions) < 5: continue # Need minimum data to smooth
                
                positions_np = np.array(positions)
                
                # Apply Moving Average (Window size 5) on X and Y columns
                window_size = 5
                kernel = np.ones(window_size) / window_size
                
                # 'same' mode keeps array size same
                positions_np[:, 1] = np.convolve(positions_np[:, 1], kernel, mode='same') # Smooth X
                positions_np[:, 2] = np.convolve(positions_np[:, 2], kernel, mode='same') # Smooth Y

                # 3. Update the original 'tracks' dictionary with smoothed values
                for row in positions_np:
                    f_num, sm_x, sm_y = int(row[0]), row[1], row[2]
                    # Ensure the frame exists in the dict before writing
                    if f_num in tracks[object_name] and track_id in tracks[object_name][f_num]:
                        tracks[object_name][f_num][track_id]['position_transformed'] = [sm_x, sm_y]

    def add_speed_and_distance_to_tracks(self, tracks):
        """
        Calculate speed/distance using the (now smoothed) real-world coordinates.
        """
        total_distance = {}
        
        for object_name, object_tracks in tracks.items():
            if object_name == "ball" or object_name == "referees":
                continue
            
            # Get sorted frame numbers to iterate chronologically
            frame_nums = sorted(list(object_tracks.keys()))
            number_of_frames = len(frame_nums)
            
            # --- FIX: Iterate using the sorted frame keys ---
            for i in range(0, number_of_frames, self.frame_window):
                current_frame_idx = frame_nums[i]
                
                # Determine the index of the comparison frame
                last_i = min(i + self.frame_window, number_of_frames - 1)
                last_frame_idx = frame_nums[last_i]
                
                for track_id, _ in object_tracks[current_frame_idx].items():
                    # Check if player exists in the future frame
                    if track_id not in object_tracks[last_frame_idx]:
                        continue
                    
                    start_position = object_tracks[current_frame_idx][track_id].get('position_transformed')
                    end_position = object_tracks[last_frame_idx][track_id].get('position_transformed')
                    
                    if start_position is None or end_position is None:
                        continue
                    
                    distance_covered = self._measure_distance(start_position, end_position)
                    
                    # Calculate real time elapsed between these specific frames
                    time_elapsed = (last_frame_idx - current_frame_idx) / self.frame_rate
                    
                    if time_elapsed == 0: continue
                    
                    speed_meters_per_second = distance_covered / time_elapsed
                    speed_km_per_hour = speed_meters_per_second * 3.6
                    
                    # Sanity Check: Cap speed at 40 km/h
                    if speed_km_per_hour > 40:
                        speed_km_per_hour = 0
                        distance_covered = 0
                    
                    if object_name not in total_distance: total_distance[object_name] = {}
                    if track_id not in total_distance[object_name]: total_distance[object_name][track_id] = 0
                    total_distance[object_name][track_id] += distance_covered
                    
                    # Tag all frames in this batch with the calculated stats
                    for j in range(i, last_i):
                        batch_frame_idx = frame_nums[j]
                        if track_id in tracks[object_name][batch_frame_idx]:
                            tracks[object_name][batch_frame_idx][track_id]['speed'] = speed_km_per_hour
                            tracks[object_name][batch_frame_idx][track_id]['distance'] = total_distance[object_name][track_id]

    def export_stats_to_csv(self, tracks, output_path, track_class_map=None):
        """Export player statistics to CSV"""
        # ... (Your existing export code works fine, but keeping it here for completeness)
        class_names = {0: "Ball", 1: "Goalkeeper", 2: "Player", 3: "Referee"}
        player_stats = []
        
        for object_name, object_tracks in tracks.items():
            if object_name == "ball" or object_name == "referees":
                continue
            
            # Get unique track IDs
            track_ids = set()
            for frame_idx, frame_tracks in object_tracks.items():
                track_ids.update(frame_tracks.keys())
            
            for track_id in track_ids:
                max_speed = 0
                total_distance = 0
                speed_sum = 0
                speed_count = 0
                
                for frame_idx, frame_tracks in object_tracks.items():
                    if track_id in frame_tracks:
                        track_info = frame_tracks[track_id]
                        if 'speed' in track_info:
                            s = track_info['speed']
                            max_speed = max(max_speed, s)
                            speed_sum += s
                            speed_count += 1
                        if 'distance' in track_info:
                            total_distance = max(total_distance, track_info['distance'])
                
                if speed_count > 0:
                    avg_speed = speed_sum / speed_count
                    class_id = track_class_map.get(track_id, 2) if track_class_map else 2
                    
                    player_stats.append({
                        'track_id': track_id,
                        'class': class_names.get(class_id, "Unknown"),
                        'max_speed_kmh': max_speed,
                        'avg_speed_kmh': avg_speed,
                        'total_distance_m': total_distance,
                        'sprint_count': 0 # Simplified
                    })
        
        # Write to CSV
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Track_ID', 'Class', 'Max_Speed_kmh', 'Avg_Speed_kmh', 'Total_Distance_m'])
            for stats in player_stats:
                writer.writerow([
                    stats['track_id'], stats['class'], 
                    f"{stats['max_speed_kmh']:.2f}", 
                    f"{stats['avg_speed_kmh']:.2f}", 
                    f"{stats['total_distance_m']:.2f}"
                ])
        return player_stats