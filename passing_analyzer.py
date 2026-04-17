from typing import Dict, List, Optional, Tuple
from collections import defaultdict

class PassEvent:
    def __init__(self, passer_id: int, passer_team: int, frame_idx: int):
        self.passer_id = passer_id
        self.passer_team = passer_team
        self.frame_idx = frame_idx
        
        self.receiver_id: Optional[int] = None
        self.receiver_team: Optional[int] = None
        self.end_frame: Optional[int] = None
        
        self.is_completed = False
        self.is_intercepted = False
        
        # Metadata for DB compatibility (metrics disabled by user request)
        self.distance_m = 0.0
        self.is_progressive = False
        self.origin_pos: Optional[Tuple[float, float]] = None
        self.x_target: Optional[float] = None
        self.y_target: Optional[float] = None
        self.trajectory: List[Tuple[float, float]] = []

class PassingAnalyzer:
    def __init__(self, fps: int, field_length_m: float = 105.0, class_map: Optional[Dict[int, int]] = None):
        self.fps = max(1, int(fps))
        self.class_map = class_map
        self.min_possession_frames = int(max(1, self.fps * 0.2)) # require 0.2s of clear possession
        self.max_pass_duration_frames = int(self.fps * 5.0) # max 5 seconds for a pass to arrive
        
    def analyze_tracks(self, tracks: Dict) -> Dict:
        """
        Analyzes the tracks dictionary to identify and count passes using possession-based logic.
        Expects tracks[group][frame_idx][track_id] = {'has_ball': bool, 'team_id': int, ...}
        """
        pass_events: List[PassEvent] = []
        
        # Track possession state
        current_possessor_id = None
        current_team_id = None
        possession_frames = 0
        
        team_possession_frames = {0: 0, 1: 0}
        
        active_pass: Optional[PassEvent] = None
        
        # Collect sorted frame indices from players + goalkeepers
        frame_indices: List[int] = sorted(
            set().union(
                tracks.get("players", {}).keys(),
                tracks.get("goalkeepers", {}).keys(),
            )
        )
        
        if not frame_indices:
            return self._empty_stats()
            
        for frame_idx in frame_indices:
            # Find who has the ball in this frame
            frame_possessor = None
            frame_team = None
            
            for group in ("players", "goalkeepers"):
                group_data = tracks.get(group, {}).get(frame_idx, {})
                for track_id, info in group_data.items():
                    if info.get("has_ball", False):
                        frame_possessor = track_id
                        frame_team = info.get("team_id")
                        if frame_team is None and self.class_map:
                            frame_team = self.class_map.get(track_id)
                        break
                if frame_possessor is not None:
                    break
                    
            if frame_possessor is not None:
                if frame_possessor == current_possessor_id:
                    possession_frames += 1
                    
                    # If someone receives a pass, they must hold it for a few frames to count as a completed reception
                    if active_pass is not None and possession_frames >= self.min_possession_frames:
                        active_pass.receiver_id = current_possessor_id
                        active_pass.receiver_team = current_team_id
                        active_pass.end_frame = frame_idx
                        
                        if current_team_id == active_pass.passer_team:
                            if current_possessor_id != active_pass.passer_id:
                                active_pass.is_completed = True
                                pass_events.append(active_pass)
                                active_pass = None
                            else:
                                # Same player got it back (dribble or fumble), cancel pass
                                active_pass = None
                        else:
                            # Opposing team got it
                            active_pass.is_intercepted = True
                            pass_events.append(active_pass)
                            active_pass = None
                else:
                    # New possessor!
                    current_possessor_id = frame_possessor
                    current_team_id = frame_team
                    possession_frames = 1
                    
            else:
                # Ball is free
                if current_possessor_id is not None and possession_frames >= self.min_possession_frames:
                    # A pass (or shot/clearance) has been initiated
                    active_pass = PassEvent(
                        passer_id=current_possessor_id,
                        passer_team=current_team_id,
                        frame_idx=frame_idx
                    )
                
                current_possessor_id = None
                current_team_id = None
                possession_frames = 0
                
            # Track overall possession for the frame
            if current_team_id is not None and current_team_id in team_possession_frames:
                team_possession_frames[current_team_id] += 1
                
            # Timeout active pass if it's been floating too long
            if active_pass is not None and (frame_idx - active_pass.frame_idx) > self.max_pass_duration_frames:
                # Pass failed/went out of bounds
                active_pass = None
                
        return self._compile_stats(pass_events, team_possession_frames)
        
    def _compile_stats(self, pass_events: List[PassEvent], team_possession_frames: Dict[int, int]) -> Dict:
        player_stats = defaultdict(lambda: {
            "passes_attempted": 0, 
            "passes_completed": 0,
            "pass_accuracy": 0.0,
            "avg_pass_distance_m": 0.0,
            "progressive_passes": 0
        })
        team_stats = defaultdict(lambda: {
            "total_passes": 0, 
            "completed_passes": 0, 
            "interceptions": 0,
            "pass_accuracy": 0.0,
            "total_pass_distance_m": 0.0,
            "progressive_passes": 0,
            "avg_pass_distance_m": 0.0
        })
        
        total_frames = sum(team_possession_frames.values())
        possession_stats = {}
        for tid, frames in team_possession_frames.items():
            pct = (frames / total_frames * 100) if total_frames > 0 else 0.0
            possession_stats[tid] = {"frames": frames, "percentage": pct}
        
        for p in pass_events:
            if p.passer_id is not None and p.passer_team is not None:
                player_stats[p.passer_id]["passes_attempted"] += 1
                team_stats[p.passer_team]["total_passes"] += 1
                
                if p.is_completed:
                    player_stats[p.passer_id]["passes_completed"] += 1
                    team_stats[p.passer_team]["completed_passes"] += 1
                elif p.is_intercepted:
                    # The team that threw it lost it, but the team that caught it intercepted it
                    if p.receiver_team is not None:
                        team_stats[p.receiver_team]["interceptions"] += 1
                        
        # Calc accuracies
        for stats in player_stats.values():
            if stats["passes_attempted"] > 0:
                stats["pass_accuracy"] = (stats["passes_completed"] / stats["passes_attempted"] * 100)
            
        for stats in team_stats.values():
            if stats["total_passes"] > 0:
                stats["pass_accuracy"] = (stats["completed_passes"] / stats["total_passes"] * 100)
            
        return {
            "pass_events": pass_events,
            "player_passing_stats": dict(player_stats),
            "team_passing_stats": dict(team_stats),
            "possession_stats": possession_stats
        }
        
    def _empty_stats(self) -> Dict:
        return {
            "pass_events": [],
            "player_passing_stats": {},
            "team_passing_stats": {},
            "possession_stats": {}
        }
