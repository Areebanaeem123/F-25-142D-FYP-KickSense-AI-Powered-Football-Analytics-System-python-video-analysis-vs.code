import math
from typing import Dict, Tuple, Optional


def _euclidean_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def assign_ball_to_players(
    tracks: Dict,
    frame_idx: int,
    max_distance_pixels: float = 65.0,
    include_refs: bool = False,
) -> Optional[int]:
    """
    Assign the ball to the nearest player (or goalkeeper) for a given frame.

    Args:
        tracks: shared tracking dictionary (same structure used in main_pipeline).
        frame_idx: frame number to process.
        max_distance_pixels: threshold in pixels to accept an assignment.
        include_refs: if True, allow referees to be assigned (default False).

    Returns:
        The track_id of the assigned player, or None if no assignment was made.
    """
    if "ball" not in tracks or frame_idx not in tracks["ball"]:
        return None

    ball_info = tracks["ball"][frame_idx].get("ball")
    if not ball_info:
        return None

    # Prefer camera-adjusted position if available
    ball_pos = ball_info.get("position_adjusted") or ball_info.get("position")
    if not ball_pos:
        return None

    candidate_groups = ["goalkeepers", "players"]
    if include_refs:
        candidate_groups.append("referees")

    best_candidate = None
    best_distance = float("inf")

    for group in candidate_groups:
        if group not in tracks or frame_idx not in tracks[group]:
            continue

        for track_id, track_info in tracks[group][frame_idx].items():
            player_pos = track_info.get("position_adjusted") or track_info.get("position")
            if not player_pos:
                continue

            dist = _euclidean_distance(ball_pos, player_pos)
            if dist < best_distance:
                best_distance = dist
                best_candidate = (group, track_id)

    if best_candidate and best_distance <= max_distance_pixels:
        group, track_id = best_candidate
        tracks[group][frame_idx][track_id]["has_ball"] = True
        ball_info["assigned_track_id"] = track_id
        ball_info["assigned_group"] = group
        ball_info["assigned_distance"] = best_distance
        return track_id

    return None

