"""
Dribbling Effectiveness Analyzer
Detects, tracks, and analyzes dribble events per player
"""

import math
from typing import Dict, List, Optional, Tuple
from collections import defaultdict


class DribbleEvent:
    """Represents a single dribble event"""
    
    def __init__(self, player_id: int, start_frame: int, team_id: int):
        self.player_id = player_id
        self.start_frame = start_frame
        self.end_frame = start_frame
        self.team_id = team_id
        
        self.positions: List[Tuple[float, float]] = []  # (x, y) in meters
        self.frames = []
        self.distance_m = 0.0
        self.is_successful = False
        self.is_progressive = False
        self.opponents_beaten = 0
        self.resulted_in_shot = False
        self.resulted_in_pass = False
        self.possession_lost_to_opponent = False
        self.possession_lost_to_teammate = False
    
    def add_position(self, frame_idx: int, pos: Tuple[float, float]):
        """Add a frame's position during the dribble"""
        self.frames.append(frame_idx)
        self.positions.append(pos)
        self.end_frame = frame_idx
        
        # Calculate distance incrementally
        if len(self.positions) > 1:
            prev_pos = self.positions[-2]
            curr_pos = self.positions[-1]
            dist = math.sqrt((curr_pos[0] - prev_pos[0]) ** 2 + (curr_pos[1] - prev_pos[1]) ** 2)
            self.distance_m += dist
    
    def finalize(self):
        """Mark dribble as complete and determine success"""
        # A dribble is successful if:
        # 1. It covered distance > 0.5m (to avoid noise)
        # 2. It ended with possession retained OR resulted in shot/pass to teammate
        if self.distance_m > 0.5:
            self.is_successful = (
                not self.possession_lost_to_opponent 
                and (self.resulted_in_pass or self.resulted_in_shot or not self.possession_lost_to_teammate)
            )
    
    def get_duration_frames(self) -> int:
        return self.end_frame - self.start_frame


class DribblingAnalyzer:
    """
    Detects and analyzes dribble events from tracking data.
    
    Key metrics:
    - Dribbles attempted (per player, per team)
    - Dribbles successful (retained possession)
    - Success rate (%)
    - Progressive dribbles (toward opposition goal)
    - Distance covered while dribbling
    - Opponents beaten
    """
    
    def __init__(self, fps: int, field_width_m: float = 68.0):
        """
        Args:
            fps: frames per second
            field_width_m: field width in meters (standard ~68m)
        """
        self.fps = max(1, int(fps))
        self.field_width_m = field_width_m
        self.min_dribble_frames = 3  # minimum frames to count as dribble
        self.min_distance_m = 0.2  # minimum distance to count
        
        self.dribble_events: List[DribbleEvent] = []
        self.player_dribble_stats: Dict[int, Dict] = {}
        self.team_dribble_stats: Dict[int, Dict] = {}
    
    def analyze_tracks(self, tracks: Dict) -> Dict:
        """
        Analyze tracks to detect and evaluate dribble events.
        
        Returns:
            Dictionary with per-player and per-team dribbling statistics
        """
        # Reset state
        self.dribble_events = []
        self.player_dribble_stats = {}
        self.team_dribble_stats = {0: self._init_team_stats(), 1: self._init_team_stats()}
        
        # Collect all frames in order
        frame_indices = set()
        for group in ("players", "goalkeepers"):
            if group in tracks:
                frame_indices.update(tracks[group].keys())
        frame_indices = sorted(frame_indices)
        
        # Track current dribbles per player
        active_dribbles: Dict[int, DribbleEvent] = {}
        prev_ball_holder: Optional[int] = None
        prev_ball_holder_team: Optional[int] = None
        
        for frame_idx in frame_indices:
            # Find who has the ball this frame
            current_ball_holder = None
            current_ball_holder_team = None
            ball_pos = None
            
            for group in ("players", "goalkeepers"):
                frame_data = tracks.get(group, {}).get(frame_idx, {})
                for track_id, info in frame_data.items():
                    if info.get("has_ball"):
                        current_ball_holder = track_id
                        current_ball_holder_team = info.get("team_id")
                        pos = info.get("position_transformed")
                        if pos:
                            ball_pos = pos
                        break
            
            # Handle dribble transitions
            if current_ball_holder is not None:
                # Player has ball - could be continuing or starting dribble
                if current_ball_holder not in active_dribbles:
                    # Start new dribble
                    team_id = current_ball_holder_team if current_ball_holder_team is not None else 0
                    active_dribbles[current_ball_holder] = DribbleEvent(
                        current_ball_holder, frame_idx, team_id
                    )
                
                # Add position to current dribble
                if ball_pos:
                    active_dribbles[current_ball_holder].add_position(frame_idx, ball_pos)
            
            else:
                # Ball holder changed or lost
                # End all active dribbles
                for player_id, dribble in list(active_dribbles.items()):
                    dribble.finalize()
                    
                    # Determine dribble outcome
                    if prev_ball_holder == player_id:
                        # Same player had ball, means possession was lost
                        if prev_ball_holder_team != current_ball_holder_team:
                            dribble.possession_lost_to_opponent = True
                        else:
                            dribble.possession_lost_to_teammate = True
                    
                    # Only record if minimum duration met
                    if dribble.get_duration_frames() >= self.min_dribble_frames:
                        self.dribble_events.append(dribble)
                        self._update_player_stats(dribble)
                    
                    del active_dribbles[player_id]
            
            # Check for goal attempts (shot detection proxy)
            # If ball suddenly moves far from previous position near opponent goal
            self._check_shot_attempt_proxy(tracks, frame_idx, current_ball_holder, active_dribbles)
            
            prev_ball_holder = current_ball_holder
            prev_ball_holder_team = current_ball_holder_team
        
        # Finalize any remaining dribbles
        for player_id, dribble in active_dribbles.items():
            dribble.finalize()
            if dribble.get_duration_frames() >= self.min_dribble_frames:
                self.dribble_events.append(dribble)
                self._update_player_stats(dribble)
        
        # Calculate team-level statistics
        for player_id, stats in self.player_dribble_stats.items():
            if "team_id" in stats:
                team_id = stats["team_id"]
                self.team_dribble_stats[team_id]["total_dribbles"] += stats.get("total_dribbles", 0)
                self.team_dribble_stats[team_id]["successful_dribbles"] += stats.get("successful_dribbles", 0)
                self.team_dribble_stats[team_id]["total_distance_m"] += stats.get("distance_covered_m", 0)
                self.team_dribble_stats[team_id]["progressive_dribbles"] += stats.get("progressive_dribbles", 0)
        
        # Calculate team success rates and averages
        for team_id in self.team_dribble_stats:
            stats = self.team_dribble_stats[team_id]
            if stats["total_dribbles"] > 0:
                stats["success_rate"] = (stats["successful_dribbles"] / stats["total_dribbles"]) * 100
                stats["avg_dribble_distance_m"] = stats["total_distance_m"] / stats["total_dribbles"]
            else:
                stats["success_rate"] = 0.0
                stats["avg_dribble_distance_m"] = 0.0
        
        return {
            "player_dribbling_stats": self.player_dribble_stats,
            "team_dribbling_stats": self.team_dribble_stats,
            "dribble_events": self.dribble_events,
        }
    
    def _init_team_stats(self) -> Dict:
        return {
            "total_dribbles": 0,
            "successful_dribbles": 0,
            "success_rate": 0.0,
            "total_distance_m": 0.0,
            "progressive_dribbles": 0,
            "avg_dribble_distance_m": 0.0,
        }
    
    def _update_player_stats(self, dribble: DribbleEvent):
        """Update player statistics with a completed dribble event"""
        player_id = dribble.player_id
        
        if player_id not in self.player_dribble_stats:
            self.player_dribble_stats[player_id] = {
                "player_id": player_id,
                "team_id": dribble.team_id,
                "total_dribbles": 0,
                "successful_dribbles": 0,
                "success_rate": 0.0,
                "distance_covered_m": 0.0,
                "progressive_dribbles": 0,
                "avg_dribble_distance_m": 0.0,
                "avg_dribble_duration_s": 0.0,
                "total_dribble_time_s": 0.0,
                "opponents_beaten": 0,
            }
        
        stats = self.player_dribble_stats[player_id]
        stats["total_dribbles"] += 1
        
        if dribble.is_successful:
            stats["successful_dribbles"] += 1
        
        stats["distance_covered_m"] += dribble.distance_m
        
        if dribble.is_progressive:
            stats["progressive_dribbles"] += 1
        
        stats["opponents_beaten"] += dribble.opponents_beaten
        
        duration_s = dribble.get_duration_frames() / self.fps
        stats["total_dribble_time_s"] += duration_s
        
        # Recalculate averages
        if stats["total_dribbles"] > 0:
            stats["success_rate"] = (stats["successful_dribbles"] / stats["total_dribbles"]) * 100
            stats["avg_dribble_distance_m"] = stats["distance_covered_m"] / stats["total_dribbles"]
            stats["avg_dribble_duration_s"] = stats["total_dribble_time_s"] / stats["total_dribbles"]
    
    def _check_shot_attempt_proxy(
        self,
        tracks: Dict,
        frame_idx: int,
        current_ball_holder: Optional[int],
        active_dribbles: Dict[int, DribbleEvent]
    ):
        """
        Check if ball holder is attempting a shot.
        This is a proxy - once shooting_analyzer is implemented, use that.
        """
        if current_ball_holder not in active_dribbles:
            return
        
        ball_pos = None
        for group in ("players", "goalkeepers"):
            frame_data = tracks.get(group, {}).get(frame_idx, {})
            if current_ball_holder in frame_data:
                ball_pos = frame_data[current_ball_holder].get("position_transformed")
                break
        
        if ball_pos is None:
            return
        
        # Check if near opponent goal (last 16.5m of field, roughly)
        # Assuming field is -width/2 to +width/2
        if ball_pos[0] > (self.field_width_m / 2 - 16.5):
            active_dribbles[current_ball_holder].resulted_in_shot = True
    
    def get_player_dribbling_stats(self, player_id: int) -> Optional[Dict]:
        """Get dribbling stats for a specific player"""
        return self.player_dribble_stats.get(player_id)
    
    def get_team_dribbling_stats(self, team_id: int) -> Optional[Dict]:
        """Get team-level dribbling statistics"""
        return self.team_dribble_stats.get(team_id)
    
    def get_top_dribblers(self, team_id: int, limit: int = 5) -> List[Dict]:
        """Get top dribblers by success rate for a team"""
        team_players = [
            stats for stats in self.player_dribble_stats.values()
            if stats.get("team_id") == team_id and stats.get("total_dribbles", 0) > 0
        ]
        # Sort by success rate, then by total dribbles
        team_players.sort(
            key=lambda x: (x.get("success_rate", 0), x.get("total_dribbles", 0)),
            reverse=True
        )
        return team_players[:limit]
    
    def get_dribble_timeline(self, player_id: int) -> List[Dict]:
        """Get timeline of all dribbles for a player"""
        player_dribbles = [d for d in self.dribble_events if d.player_id == player_id]
        return [
            {
                "start_frame": d.start_frame,
                "end_frame": d.end_frame,
                "distance_m": d.distance_m,
                "successful": d.is_successful,
                "progressive": d.is_progressive,
                "opponents_beaten": d.opponents_beaten,
            }
            for d in player_dribbles
        ]
