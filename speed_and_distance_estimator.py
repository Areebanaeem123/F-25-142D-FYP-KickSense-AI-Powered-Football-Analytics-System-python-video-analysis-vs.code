import cv2
import numpy as np
import csv

class SpeedAndDistance_Estimator():
    def __init__(self, fps=24, frame_window=5):
        self.frame_window = frame_window
        self.frame_rate = fps
    
    def add_speed_and_distance_to_tracks(self, tracks):
        """Calculate and add speed and distance to all tracks"""
        total_distance = {}
        
        for object_name, object_tracks in tracks.items():
            if object_name == "ball" or object_name == "referees":
                continue
            
            number_of_frames = len(object_tracks)
            for frame_num in range(0, number_of_frames, self.frame_window):
                last_frame = min(frame_num + self.frame_window, number_of_frames - 1)
                
                for track_id, _ in object_tracks[frame_num].items():
                    if track_id not in object_tracks[last_frame]:
                        continue
                    
                    start_position = object_tracks[frame_num][track_id]['position_transformed']
                    end_position = object_tracks[last_frame][track_id]['position_transformed']
                    
                    if start_position is None or end_position is None:
                        continue
                    
                    distance_covered = self._measure_distance(start_position, end_position)
                    time_elapsed = (last_frame - frame_num) / self.frame_rate
                    
                    # Avoid division by zero
                    if time_elapsed == 0:
                        continue
                    
                    speed_meters_per_second = distance_covered / time_elapsed
                    speed_km_per_hour = speed_meters_per_second * 3.6
                    
                    # Cap unrealistic speeds (humans can't exceed ~45 km/h)
                    if speed_km_per_hour > 45:
                        speed_km_per_hour = 0
                        distance_covered = 0  # Don't count this movement
                    
                    if object_name not in total_distance:
                        total_distance[object_name] = {}
                    
                    if track_id not in total_distance[object_name]:
                        total_distance[object_name][track_id] = 0
                    
                    total_distance[object_name][track_id] += distance_covered
                    
                    for frame_num_batch in range(frame_num, last_frame):
                        if track_id not in tracks[object_name][frame_num_batch]:
                            continue
                        tracks[object_name][frame_num_batch][track_id]['speed'] = speed_km_per_hour
                        tracks[object_name][frame_num_batch][track_id]['distance'] = total_distance[object_name][track_id]
    
    def _measure_distance(self, p1, p2):
        """Measure Euclidean distance between two points"""
        return ((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)**0.5
    
    def _get_foot_position(self, bbox):
        """Get foot position (bottom center) from bounding box"""
        x1, y1, x2, y2 = bbox
        return int((x1 + x2) / 2), int(y2)
    
    def draw_speed_and_distance(self, frames, tracks):
        """Draw speed and distance information on frames"""
        output_frames = []
        
        for frame_num, frame in enumerate(frames):
            for object_name, object_tracks in tracks.items():
                if object_name == "ball" or object_name == "referees":
                    continue
                
                for _, track_info in object_tracks[frame_num].items():
                    if "speed" in track_info:
                        speed = track_info.get('speed', None)
                        distance = track_info.get('distance', None)
                        
                        if speed is None or distance is None:
                            continue
                        
                        bbox = track_info['bbox']
                        position = self._get_foot_position(bbox)
                        position = list(position)
                        position[1] += 40
                        position = tuple(map(int, position))
                        
                        cv2.putText(
                            frame, f"{speed:.2f} km/h", position,
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2
                        )
                        cv2.putText(
                            frame, f"{distance:.2f} m",
                            (position[0], position[1] + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2
                        )
            
            output_frames.append(frame)
        
        return output_frames
    
    def export_stats_to_csv(self, tracks, output_path, track_class_map=None):
        """Export player statistics to CSV"""
        class_names = {0: "Ball", 1: "Goalkeeper", 2: "Player", 3: "Referee"}
        
        # Collect all player stats
        player_stats = []
        
        for object_name, object_tracks in tracks.items():
            if object_name == "ball" or object_name == "referees":
                continue
            
            # Get unique track IDs - object_tracks is a dict with frame_idx as key
            track_ids = set()
            for frame_idx, frame_tracks in object_tracks.items():
                if isinstance(frame_tracks, dict):
                    track_ids.update(frame_tracks.keys())
            
            for track_id in track_ids:
                max_speed = 0
                total_distance = 0
                speed_count = 0
                speed_sum = 0
                
                # Iterate through all frames for this track
                for frame_idx, frame_tracks in object_tracks.items():
                    if isinstance(frame_tracks, dict) and track_id in frame_tracks:
                        track_info = frame_tracks[track_id]
                        if 'speed' in track_info:
                            speed = track_info['speed']
                            max_speed = max(max_speed, speed)
                            speed_sum += speed
                            speed_count += 1
                        if 'distance' in track_info:
                            total_distance = max(total_distance, track_info['distance'])
                
                if speed_count > 0:
                    avg_speed = speed_sum / speed_count
                    class_id = track_class_map.get(track_id, 2) if track_class_map else 2
                    class_name = class_names.get(class_id, "Unknown")
                    
                    player_stats.append({
                        'track_id': track_id,
                        'class': class_name,
                        'max_speed_kmh': max_speed,
                        'avg_speed_kmh': avg_speed,
                        'total_distance_m': total_distance,
                        'sprint_count': sum(1 for frame_idx, frame_tracks in object_tracks.items()
                                          if isinstance(frame_tracks, dict) 
                                          and track_id in frame_tracks 
                                          and frame_tracks[track_id].get('speed', 0) > 20)
                    })
        
        # Write to CSV
        with open(output_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Track_ID', 'Class', 'Max_Speed_kmh', 'Avg_Speed_kmh',
                           'Total_Distance_m', 'Sprint_Count'])
            
            for stats in sorted(player_stats, key=lambda x: x['max_speed_kmh'], reverse=True):
                writer.writerow([
                    stats['track_id'],
                    stats['class'],
                    f"{stats['max_speed_kmh']:.2f}",
                    f"{stats['avg_speed_kmh']:.2f}",
                    f"{stats['total_distance_m']:.2f}",
                    stats['sprint_count']
                ])
        
        print(f"✅ Stats exported to: {output_path}")
        return player_stats