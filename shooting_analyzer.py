"""
Shooting Statistics Analyzer
Detects shots based on ball velocity spikes and predicts accuracy/outcomes.
"""

import math
import numpy as np
from typing import Dict, List, Optional, Tuple

class ShotEvent:
    """Represents a single shooting event"""
    def __init__(self, player_id: int, team_id: int, frame_idx: int, origin_pos: Tuple[float, float]):
        self.player_id = player_id
        self.team_id = team_id
        self.frame_idx = frame_idx
        self.origin_pos = origin_pos # (x, y) in meters
        
        self.max_velocity_ms = 0.0
        self.distance_to_goal_m = 0.0
        self.angle_to_goal_deg = 0.0
        self.xg = 0.0
        self.is_on_target = False
        self.is_goal = False
        self.trajectory: List[Tuple[float, float]] = [origin_pos]

class ShootingAnalyzer:
    """
    Analyzes ball tracking data to identify shots.
    
    Strategies:
    - Detect 'Velocity Spikes' (> 15 m/s) following player possession.
    - Project trajectory to check if it intersects the 7.32m goalmouth.
    - Classify as On-Target, Off-Target, or Goal.
    """
    
    def __init__(self, fps: int, field_length_m: float = 105.0, field_width_m: float = 68.0):
        self.fps = max(1, int(fps))
        self.field_length = field_length_m
        self.field_width = field_width_m
        
        # Goal positions (center of goalmouth)
        self.goal_centers = {
            0: (self.field_length / 2, 0.0),  # Team 0 attacks Right Goal (+)
            1: (-self.field_length / 2, 0.0)  # Team 1 attacks Left Goal (-)
        }
        self.goal_width = 7.32
        
        # Thresholds
        self.shot_velocity_threshold = 12.0 # m/s (approx 43 km/h minimum for a shot)
        self.possession_buffer = 5 # frames to look back for last holder
        
        self.shot_events: List[ShotEvent] = []

    def analyze_tracks(self, tracks: Dict) -> Dict:
        """
        Scan tracks for shooting events.
        """
        self.shot_events = []
        player_stats = {}
        
        frame_indices = sorted(tracks.get("players", {}).keys())
        if not frame_indices:
            return {"shot_events": [], "player_shooting_stats": {}}

        # 1. Identify ball velocity and holder history
        ball_history = self._get_ball_history(tracks, frame_indices)
        
        # 2. Detect spikes and attribute to last holder
        for i in range(1, len(frame_indices)):
            curr_frame = frame_indices[i]
            prev_frame = frame_indices[i-1]
            
            curr_ball = ball_history.get(curr_frame)
            prev_ball = ball_history.get(prev_frame)
            
            if not curr_ball or not prev_ball or not curr_ball['pos'] or not prev_ball['pos']:
                continue
                
            # Calculate instantaneous velocity
            dist = math.sqrt((curr_ball['pos'][0] - prev_ball['pos'][0])**2 + 
                             (curr_ball['pos'][1] - prev_ball['pos'][1])**2)
            velocity = dist * self.fps
            
            # If spike detected and ball was not just held
            if velocity > self.shot_velocity_threshold and not curr_ball['held']:
                # Look back for last holder
                last_holder = self._find_last_holder(ball_history, curr_frame)
                if last_holder:
                    player_id, team_id = last_holder
                    
                    # Prevent multiple events for the same shot (cooldown)
                    if self._is_new_shot(player_id, curr_frame):
                        shot = self._process_shot(player_id, team_id, curr_frame, curr_ball['pos'], ball_history, frame_indices, i)
                        shot.max_velocity_ms = max(shot.max_velocity_ms, velocity)
                        self.shot_events.append(shot)
        
        # 3. Aggregate stats
        player_stats = self._aggregate_player_stats()
        
        return {
            "shot_events": self.shot_events,
            "player_shooting_stats": player_stats
        }

    def _get_ball_history(self, tracks: Dict, frame_indices: List[int]) -> Dict:
        history = {}
        for f in frame_indices:
            ball_info = {"pos": None, "held": False, "holder": None, "team": None}
            for group in ("players", "goalkeepers"):
                frame_data = tracks.get(group, {}).get(f, {})
                for tid, info in frame_data.items():
                    if info.get("has_ball"):
                        ball_info["held"] = True
                        ball_info["holder"] = tid
                        ball_info["team"] = info.get("team_id")
                        ball_info["pos"] = info.get("position_transformed")
                        break
            # Fallback to pure ball track if available (though pipeline uses 'has_ball' on players)
            if not ball_info["pos"]:
                 # Search for ball object if separate
                 pass
            history[f] = ball_info
        return history

    def _find_last_holder(self, history: Dict, current_frame: int) -> Optional[Tuple[int, int]]:
        for f in range(current_frame - 1, current_frame - self.possession_buffer - 1, -1):
            if f in history and history[f]['held']:
                return history[f]['holder'], history[f]['team']
        return None

    def _is_new_shot(self, player_id: int, frame_idx: int) -> bool:
        for shot in self.shot_events:
            if shot.player_id == player_id and abs(shot.frame_idx - frame_idx) < self.fps * 2:
                return False
        return True

    def _process_shot(self, player_id: int, team_id: int, frame_idx: int, origin: Tuple[float, float], history: Dict, frame_indices: List[int], start_idx: int) -> ShotEvent:
        shot = ShotEvent(player_id, team_id, frame_idx, origin)
        
        # Goal target
        target_center = self.goal_centers.get(team_id, (0,0))
        
        # Distance and Angle
        dx = target_center[0] - origin[0]
        dy = target_center[1] - origin[1]
        shot.distance_to_goal_m = math.sqrt(dx**2 + dy**2)
        shot.angle_to_goal_deg = math.degrees(math.atan2(abs(dy), abs(dx)))
        
        # Calculate xG (Expected Goals)
        # Based on angle subtended by the 7.32m goalmouth
        # v1: vector to top post, v2: vector to bottom post
        v1 = (target_center[0] - origin[0], (self.goal_width / 2) - origin[1])
        v2 = (target_center[0] - origin[0], (-self.goal_width / 2) - origin[1])
        
        mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
        mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
        dot = v1[0]*v2[0] + v1[1]*v2[1]
        
        # Subtended angle in radians
        theta = math.acos(max(-1.0, min(1.0, dot / (mag1 * mag2 + 1e-6))))
        
        # Simple heuristic: xG proportional to subtended angle, adjusted for distance
        # A 0.3 rad (~17 deg) shot from 10m center is roughly 0.15-0.20 xG
        shot.xg = min(0.95, max(0.01, (theta / math.pi) * 2.0 * math.exp(-0.02 * shot.distance_to_goal_m)))
        
        # Simple trajectory prediction (Linear)
        # We look at the next few frames to get a stable direction
        next_frames = frame_indices[start_idx : start_idx + 5]
        path = [origin]
        for nf in next_frames:
            if nf in history and history[nf]['pos']:
                path.append(history[nf]['pos'])
        
        if len(path) >= 2:
            # Vector from start to end of sampled path
            vx = path[-1][0] - path[0][0]
            vy = path[-1][1] - path[0][1]
            
            # Check intersection with goal line (x = field_length/2 or -field_length/2)
            goal_x = target_center[0]
            if vx != 0:
                t = (goal_x - origin[0]) / vx
                if t > 0: # Moving toward goal
                    intersect_y = origin[1] + t * vy
                    if abs(intersect_y - target_center[1]) < self.goal_width / 2:
                        shot.is_on_target = True
                        # Simple Goal detection proxy: if it gets very close to center
                        if abs(intersect_y - target_center[1]) < 1.0 and shot.distance_to_goal_m < 25.0:
                             # Guestimate: consider it a goal if it's dead-center and within range
                             shot.is_goal = True
                             
        return shot

    def _aggregate_player_stats(self) -> Dict:
        stats = {}
        for shot in self.shot_events:
            if shot.player_id not in stats:
                stats[shot.player_id] = {
                    "shots_total": 0,
                    "shots_on_target": 0,
                    "goals": 0,
                    "max_power": 0.0,
                    "distances": [],
                    "team_id": shot.team_id
                }
            s = stats[shot.player_id]
            s["shots_total"] += 1
            if shot.is_on_target:
                s["shots_on_target"] += 1
            if shot.is_goal:
                s["goals"] += 1
            s["max_power"] = max(s["max_power"], shot.max_velocity_ms)
            s["distances"].append(shot.distance_to_goal_m)
            
        # Final formatting
        for pid in stats:
            s = stats[pid]
            s["shot_accuracy"] = (s["shots_on_target"] / s["shots_total"] * 100) if s["shots_total"] > 0 else 0
            s["avg_shot_distance"] = sum(s["distances"]) / len(s["distances"]) if s["distances"] else 0
            
        return stats
