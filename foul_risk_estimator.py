import math
from typing import Dict, Optional


class FoulRiskEstimator:
    """
    Rule-based foul risk estimation using proximity, speed, and deceleration.
    Produces per-player foul risk (0-1) and card likelihoods.
    """

    def __init__(
        self,
        fps: int,
        contact_distance_m: float = 1.2,
        ball_distance_m: float = 2.0,
        speed_ref_kmh: float = 25.0,
        decel_ref_kmh_per_s: float = 6.0,
        risk_scale: float = 6.0,
    ):
        self.fps = max(1, int(fps))
        self.contact_distance_m = contact_distance_m
        self.ball_distance_m = ball_distance_m
        self.speed_ref_kmh = speed_ref_kmh
        self.decel_ref_kmh_per_s = decel_ref_kmh_per_s
        self.risk_scale = risk_scale

    @staticmethod
    def _dist(p1, p2) -> float:
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    def estimate(self, tracks: Dict) -> Dict[int, Dict[str, object]]:
        """
        Returns a map:
        { track_id: { foul_risk, yellow_likelihood, red_likelihood,
                      card_prediction, contact_events } }
        """
        scores = {}
        contact_events = {}
        frames_seen = {}
        prev_speed = {}

        # Build a unified list of frame indices
        frame_indices = set()
        for group in ("players", "goalkeepers"):
            for frame_idx in tracks.get(group, {}):
                frame_indices.add(frame_idx)
        frame_indices = sorted(frame_indices)
        for frame_idx in frame_indices:
            frame_players = []

            ball_pos = None
            ball_frame = tracks.get("ball", {}).get(frame_idx, {}).get("ball")
            if ball_frame:
                ball_pos = ball_frame.get("position_transformed")

            for group in ("players", "goalkeepers"):
                frame_data = tracks.get(group, {}).get(frame_idx, {})
                for track_id, info in frame_data.items():
                    pos = info.get("position_transformed")
                    if pos is None:
                        continue
                    team_id = info.get("team_id")
                    speed = float(info.get("speed") or 0.0)
                    has_ball = bool(info.get("has_ball"))

                    frames_seen[track_id] = frames_seen.get(track_id, 0) + 1

                    # Compute acceleration (km/h per second)
                    prev = prev_speed.get(track_id)
                    accel = 0.0
                    if prev is not None:
                        accel = (speed - prev) * self.fps
                    prev_speed[track_id] = speed

                    ball_close = False
                    if ball_pos is not None:
                        if self._dist(pos, ball_pos) <= self.ball_distance_m:
                            ball_close = True

                    frame_players.append({
                        "id": track_id,
                        "team": team_id,
                        "pos": pos,
                        "speed": speed,
                        "accel": accel,
                        "ball_close": ball_close or has_ball,
                    })

            # Pairwise contact checks (opponents only)
            for i in range(len(frame_players)):
                for j in range(i + 1, len(frame_players)):
                    p1 = frame_players[i]
                    p2 = frame_players[j]

                    if p1["team"] is None or p2["team"] is None:
                        continue
                    if p1["team"] == p2["team"]:
                        continue

                    d = self._dist(p1["pos"], p2["pos"])
                    if d > self.contact_distance_m:
                        continue

                    proximity = max(0.0, 1.0 - (d / self.contact_distance_m))
                    impact = min(1.0, max(p1["speed"], p2["speed"]) / self.speed_ref_kmh)
                    decel_mag = max(0.0, max(-p1["accel"], -p2["accel"]))
                    decel = min(1.0, decel_mag / self.decel_ref_kmh_per_s)

                    event_score = 0.5 * proximity + 0.3 * impact + 0.2 * decel
                    if p1["ball_close"] or p2["ball_close"]:
                        event_score *= 1.2

                    # Assign higher share to faster player
                    if p1["speed"] >= p2["speed"]:
                        w1, w2 = 0.7, 0.3
                    else:
                        w1, w2 = 0.3, 0.7

                    scores[p1["id"]] = scores.get(p1["id"], 0.0) + event_score * w1
                    scores[p2["id"]] = scores.get(p2["id"], 0.0) + event_score * w2

                    contact_events[p1["id"]] = contact_events.get(p1["id"], 0) + 1
                    contact_events[p2["id"]] = contact_events.get(p2["id"], 0) + 1

        foul_map = {}
        for track_id, total_score in scores.items():
            # Normalize to 0-1 range with a soft scale
            risk = min(1.0, total_score / max(self.risk_scale, 1e-6))

            yellow = min(1.0, max(0.0, (risk - 0.3) / 0.5))
            red = min(1.0, max(0.0, (risk - 0.7) / 0.3))

            if risk >= 0.7:
                card = "Red"
            elif risk >= 0.4:
                card = "Yellow"
            else:
                card = "None"

            foul_map[track_id] = {
                "foul_risk": risk,
                "yellow_likelihood": yellow,
                "red_likelihood": red,
                "card_prediction": card,
                "contact_events": contact_events.get(track_id, 0),
                "frames_seen": frames_seen.get(track_id, 0),
            }

        return foul_map
