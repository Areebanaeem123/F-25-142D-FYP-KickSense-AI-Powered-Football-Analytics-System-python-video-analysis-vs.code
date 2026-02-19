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
        # contact_segments: {(id1, id2): [list of consecutive frame_indices]}
        active_contacts = {} # (id1, id2) -> {start_frame, peak_score, contact_count}
        finished_events = [] # list of {participants: (id1, id2), peak_score}
        
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
                    if pos is None: continue
                    
                    team_id = info.get("team_id")
                    speed = float(info.get("speed") or 0.0)
                    has_ball = bool(info.get("has_ball"))
                    frames_seen[track_id] = frames_seen.get(track_id, 0) + 1

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
                        "id": track_id, "team": team_id, "pos": pos,
                        "speed": speed, "accel": accel, "ball_close": ball_close or has_ball,
                    })

            # Check contacts in this frame
            current_frame_contacts = set()
            for i in range(len(frame_players)):
                for j in range(i + 1, len(frame_players)):
                    p1, p2 = frame_players[i], frame_players[j]
                    if p1["team"] is None or p2["team"] is None or p1["team"] == p2["team"]:
                        continue

                    d = self._dist(p1["pos"], p2["pos"])
                    if d <= self.contact_distance_m:
                        pair = tuple(sorted((p1["id"], p2["id"])))
                        current_frame_contacts.add(pair)
                        
                        # Calculate instantaneous score for this frame
                        proximity = max(0.0, 1.0 - (d / self.contact_distance_m))
                        impact = min(1.0, max(p1["speed"], p2["speed"]) / self.speed_ref_kmh)
                        
                        # Calculate closing speed (bonus impact)
                        # (Not fully accurate without vectors, but max speed is a good proxy)
                        
                        decel_mag = max(0.0, max(-p1["accel"], -p2["accel"]))
                        decel = min(1.0, decel_mag / self.decel_ref_kmh_per_s)

                        frame_score = 0.4 * proximity + 0.4 * impact + 0.2 * decel
                        if p1["ball_close"] or p2["ball_close"]:
                            frame_score *= 1.2

                        if pair not in active_contacts:
                            active_contacts[pair] = {"peak_score": frame_score, "count": 1}
                        else:
                            active_contacts[pair]["peak_score"] = max(active_contacts[pair]["peak_score"], frame_score)
                            active_contacts[pair]["count"] += 1

            # Handle finished contacts
            for pair in list(active_contacts.keys()):
                if pair not in current_frame_contacts:
                    event = active_contacts.pop(pair)
                    # Only record events that lasted more than a few frames to filter jitter
                    if event["count"] > 2:
                        finished_events.append({"pair": pair, "score": event["peak_score"]})

        # Finalize any remaining active contacts
        for pair, event in active_contacts.items():
            if event["count"] > 2:
                finished_events.append({"pair": pair, "score": event["peak_score"]})

        # Aggregate per player
        player_peaks = {}
        player_contact_count = {}
        for ev in finished_events:
            p1, p2 = ev["pair"]
            player_peaks[p1] = max(player_peaks.get(p1, 0.0), ev["score"])
            player_peaks[p2] = max(player_peaks.get(p2, 0.0), ev["score"])
            player_contact_count[p1] = player_contact_count.get(p1, 0) + 1
            player_contact_count[p2] = player_contact_count.get(p2, 0) + 1

        foul_map = {}
        # Iterate through players seen to ensure all are in the map
        for track_id in frames_seen:
            peak = player_peaks.get(track_id, 0.0)
            # Soft normalization: a score of 0.8+ is basically a red card level impact
            risk = min(1.0, peak / 0.8) 

            yellow = min(1.0, max(0.0, (risk - 0.4) / 0.4))
            red = min(1.0, max(0.0, (risk - 0.75) / 0.25))

            if risk >= 0.8:
                card = "Red"
            elif risk >= 0.5:
                card = "Yellow"
            else:
                card = "None"

            foul_map[track_id] = {
                "foul_risk": risk,
                "yellow_likelihood": yellow,
                "red_likelihood": red,
                "card_prediction": card,
                "contact_events": player_contact_count.get(track_id, 0),
                "frames_seen": frames_seen[track_id],
            }

        return foul_map
