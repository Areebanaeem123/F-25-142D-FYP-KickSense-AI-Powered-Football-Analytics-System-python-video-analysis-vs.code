import numpy as np
from scipy.spatial import ConvexHull
import cv2

class CohesionAnalyzer:
    def __init__(self, standard_field_width=68, standard_field_length=105):
        """
        Initialize cohesion analyzer
        
        Args:
            standard_field_width: Football field width in meters (default 68m)
            standard_field_length: Football field length in meters (default 105m)
        """
        self.field_width = standard_field_width
        self.field_length = standard_field_length
        self.standard_field_area = standard_field_width * standard_field_length
    
    def calculate_convex_hull_area(self, player_positions):
        """
        Calculate area enclosed by team's convex hull
        
        Args:
            player_positions: List of (x, y) positions in meters
        
        Returns:
            area: Convex hull area in square meters
        """
        if len(player_positions) < 3:
            return None  # Need at least 3 points for convex hull
        
        try:
            positions_array = np.array(player_positions)
            hull = ConvexHull(positions_array)
            return hull.volume  # In 2D, volume = area
        except Exception as e:
            print(f"Convex hull error: {e}")
            return None
    
    def calculate_avg_inter_player_distance(self, player_positions):
        """
        Calculate average distance between all pairs of players
        
        Args:
            player_positions: List of (x, y) positions in meters
        
        Returns:
            avg_distance: Average inter-player distance in meters
        """
        if len(player_positions) < 2:
            return None
        
        distances = []
        positions_array = np.array(player_positions)
        
        for i in range(len(positions_array)):
            for j in range(i + 1, len(positions_array)):
                dist = np.linalg.norm(positions_array[i] - positions_array[j])
                distances.append(dist)
        
        return np.mean(distances) if distances else None
    
    def calculate_cohesion_index(self, player_positions):
        """
        Calculate cohesion index (0-100 scale)
        
        Args:
            player_positions: List of (x, y) positions in meters
        
        Returns:
            cohesion_dict: {
                'cohesion_index': float,
                'convex_hull_area': float,
                'avg_distance': float,
                'num_players': int
            }
        """
        if len(player_positions) < 3:
            return None
        
        # Calculate metrics
        hull_area = self.calculate_convex_hull_area(player_positions)
        avg_distance = self.calculate_avg_inter_player_distance(player_positions)
        
        if hull_area is None or avg_distance is None:
            return None
        
        # Normalize metrics
        # Area score: Inverse of hull area (smaller area = higher score)
        area_score = (1 / hull_area) * 1000 if hull_area > 0 else 0
        
        # Distance score: Inverse of avg distance (shorter distance = higher score)
        distance_score = (10 / avg_distance) * 100 if avg_distance > 0 else 0
        
        # Combined cohesion index (0-100 scale)
        cohesion_index = min((area_score + distance_score) / 2, 100)
        
        return {
            'cohesion_index': round(cohesion_index, 2),
            'convex_hull_area': round(hull_area, 2),
            'avg_distance': round(avg_distance, 2),
            'num_players': len(player_positions)
        }
    
    def analyze_match_cohesion(self, tracks, track_to_team, sample_interval=5):
        """
        Analyze cohesion throughout entire match
        
        Args:
            tracks: Your existing tracking data structure
            track_to_team: Mapping of track_id to team (0 or 1)
            sample_interval: Calculate cohesion every N frames
        
        Returns:
            cohesion_timeline: {
                'team_0': [(frame, cohesion_score), ...],
                'team_1': [(frame, cohesion_score), ...]
            }
        """
        cohesion_timeline = {'team_0': [], 'team_1': []}
        
        # Get all frame indices
        frame_indices = sorted(tracks['players'].keys())
        
        for frame_idx in frame_indices[::sample_interval]:
            frame_tracks = tracks['players'][frame_idx]
            
            # Separate players by team
            team_0_positions = []
            team_1_positions = []
            
            for track_id, track_info in frame_tracks.items():
                if track_id not in track_to_team:
                    continue
                
                team = track_to_team[track_id]
                position = track_info.get('position_transformed')
                
                if position is None:
                    continue
                
                if team == 0:
                    team_0_positions.append(position)
                else:
                    team_1_positions.append(position)
            
            # Calculate cohesion for each team
            if len(team_0_positions) >= 3:
                cohesion_0 = self.calculate_cohesion_index(team_0_positions)
                if cohesion_0:
                    cohesion_timeline['team_0'].append(
                        (frame_idx, cohesion_0['cohesion_index'])
                    )
            
            if len(team_1_positions) >= 3:
                cohesion_1 = self.calculate_cohesion_index(team_1_positions)
                if cohesion_1:
                    cohesion_timeline['team_1'].append(
                        (frame_idx, cohesion_1['cohesion_index'])
                    )
        
        return cohesion_timeline
    
    def visualize_cohesion(self, frame, player_positions, cohesion_score, team_color):
        """
        Draw convex hull and cohesion score on frame
        
        Args:
            frame: Video frame (numpy array)
            player_positions: List of (x, y) in PIXELS (not meters!)
            cohesion_score: Cohesion index value
            team_color: BGR color tuple for visualization
        
        Returns:
            frame: Annotated frame
        """
        if len(player_positions) < 3:
            return frame
        
        try:
            # Convert to numpy array
            positions = np.array(player_positions, dtype=np.int32)
            
            # Calculate convex hull
            hull = ConvexHull(positions)
            hull_points = positions[hull.vertices]
            
            # Draw convex hull polygon
            cv2.polylines(frame, [hull_points], isClosed=True, 
                         color=team_color, thickness=3)
            
            # Fill with semi-transparent overlay
            overlay = frame.copy()
            cv2.fillPoly(overlay, [hull_points], color=team_color)
            cv2.addWeighted(overlay, 0.2, frame, 0.8, 0, frame)
            
            # Display cohesion score
            text = f"Cohesion: {cohesion_score:.1f}"
            centroid = np.mean(hull_points, axis=0).astype(int)
            cv2.putText(frame, text, tuple(centroid), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, team_color, 3)
            
        except Exception as e:
            print(f"Visualization error: {e}")
        
        return frame