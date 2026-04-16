import numpy as np
from scipy.spatial import ConvexHull
import collections

class FormationAnalyzer:
    """
    A simple analyzer for team formations and cohesion using pitch coordinates.
    Bins players into vertical zones and calculates convex hull area for spread analysis.
    """
    def __init__(self, pitch_length=105, pitch_width=68):
        self.pitch_length = pitch_length
        self.pitch_width = pitch_width
        self.formation_history = collections.defaultdict(list)
        self.cohesion_history = collections.defaultdict(list)

    def analyze_tracks(self, tracks):
        """
        Process all tracks to extract per-team formation and cohesion stats.
        """
        team_stats = collections.defaultdict(lambda: {"formations": [], "areas": [], "player_counts": []})

        # Group data by frame and team
        for frame_idx, frame_data in tracks.get('players', {}).items():
            teams_in_frame = collections.defaultdict(list)
            for track_id, info in frame_data.items():
                pos = info.get('position_transformed')
                team_id = info.get('team_id')
                if pos is not None and team_id is not None:
                    teams_in_frame[team_id].append(pos)
            
            # Analyze each team in this frame
            for team_id, positions in teams_in_frame.items():
                if len(positions) < 3:
                    continue
                
                # 1. Detect Formation (Simple Binning)
                formation = self._get_formation_binned(positions)
                team_stats[team_id]["formations"].append(formation)
                
                # 2. Calculate Area (Convex Hull)
                try:
                    points = np.array(positions)
                    hull = ConvexHull(points)
                    area = hull.area # Note: In 2D, hull.area is perimeter, hull.volume is area
                    team_stats[team_id]["areas"].append(hull.volume) 
                    team_stats[team_id]["player_counts"].append(len(positions))
                except Exception:
                    pass

        return self._summarize(team_stats)

    def _get_formation_binned(self, positions):
        """
        Divide pitch into 3 zones and count players:
        Defense: < 35m | Midfield: 35m-70m | Attack: > 70m
        """
        defense = 0
        midfield = 0
        attack = 0
        
        for p in positions:
            y = p[1] # Vertical axis (pitch length)
            if y < 35:
                defense += 1
            elif y < 70:
                midfield += 1
            else:
                attack += 1
        
        return f"{defense}-{midfield}-{attack}"

    def _summarize(self, team_stats):
        """
        Aggregate per-frame stats into a final text summary.
        """
        summary = {}
        for team_id, data in team_stats.items():
            if not data["formations"]:
                continue
            
            # Most common formation
            common_formation = collections.Counter(data["formations"]).most_common(1)[0][0]
            
            # Average Area per Player
            avg_area = np.mean(data["areas"])
            avg_players = np.mean(data["player_counts"])
            area_per_player = avg_area / avg_players if avg_players > 0 else 0
            
            # Cohesion Heuristic
            if area_per_player < 50:
                status = "Very Compact (Defensive)"
            elif area_per_player < 150:
                status = "Balanced / Standard"
            else:
                status = "Very Spread (Stretched)"
            
            summary[team_id] = {
                "formation": common_formation,
                "status": status,
                "avg_area": avg_area,
                "area_per_player": area_per_player
            }
        
        return summary

    def print_analysis(self, summary):
        """Prints a user-friendly text summary of the analysis."""
        print("\n" + "="*50)
        print("TEAM FORMATION & COHESION ANALYSIS")
        print("="*50)
        if not summary:
            print("No teams detected for analysis.")
        for team_id, stats in summary.items():
            print(f"Team {team_id + 1}:")
            print(f"  - Detected Formation: {stats['formation']}")
            print(f"  - Tactical Cohesion: {stats['status']}")
            print(f"  - Occupied Area:      {stats['avg_area']:.1f} m²")
            print(f"  - Spread Index:       {stats['area_per_player']:.1f} m²/player")
            print("-" * 30)
        print("="*50 + "\n")
