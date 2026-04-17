"""
Lineup-Constrained Jersey Number Assignment
============================================
Uses the known team roster + Hungarian algorithm to globally optimise
jersey number ↔ track_id assignments.

Usage (called from main_pipeline.py after tracking + OCR):
    assigner = LineupAssigner(
        team_a_numbers=[1, 2, 4, 5, 7, 8, 10, 11, 14, 17, 23],
        team_b_numbers=[1, 3, 5, 6, 8, 9, 11, 14, 19, 21, 27],
    )
    assigner.assign(jersey_recognizer, tracks, stable_class_map)
"""

import numpy as np
from collections import defaultdict
from typing import Dict, List, Optional, Tuple
from scipy.optimize import linear_sum_assignment


# Default roster if no lineup is provided (all valid jersey numbers 1-99)
_ALL_NUMBERS = list(range(1, 100))


class LineupAssigner:
    """
    Post-processing step that refines jersey number assignments
    using the known team lineup as a constraint.

    Workflow:
        1. Group tracks by team_id (from SigLIP team assignment)
        2. For each team, build a cost matrix from OCR vote histograms
        3. Run the Hungarian algorithm for optimal 1-to-1 assignment
        4. Write results back into the JerseyNumberRecognizer
    """

    def __init__(
        self,
        team_a_numbers: Optional[List[int]] = None,
        team_b_numbers: Optional[List[int]] = None,
        player_names: Optional[Dict[int, Dict[int, str]]] = None,
    ):
        """
        Args:
            team_a_numbers: Valid jersey numbers for team 0 (SigLIP team_id=0).
                            Pass None to skip lineup constraints for this team.
            team_b_numbers: Valid jersey numbers for team 1 (SigLIP team_id=1).
                            Pass None to skip lineup constraints for this team.
            player_names:   Optional mapping  team_id -> {jersey_number: "Player Name"}.
                            Used to resolve jersey_number -> player_name after assignment.
        """
        self.team_rosters: Dict[int, List[int]] = {}
        if team_a_numbers is not None:
            self.team_rosters[0] = sorted(team_a_numbers)
        if team_b_numbers is not None:
            self.team_rosters[1] = sorted(team_b_numbers)

        self.player_names = player_names or {}

        # Populated after assign()
        self.name_map: Dict[int, str] = {}  # stable_id -> player name

    def assign(self, jersey_recognizer, tracks: dict, stable_class_map: dict):
        """
        Run lineup-constrained assignment.

        Args:
            jersey_recognizer: JerseyNumberRecognizer instance (has track_predictions, track_assignment)
            tracks: The main tracks dict from the pipeline
            stable_class_map: stable_id -> class_id (1=GK, 2=Player, 3=Ref)
        """
        # Step 1: Determine team_id for each stable_id from tracks
        track_team_map = self._extract_team_map(tracks)

        # Step 2: Group tracks by team
        team_tracks: Dict[int, List[int]] = defaultdict(list)
        for stable_id, team_id in track_team_map.items():
            # Only assign players and goalkeepers, not referees
            cls = stable_class_map.get(stable_id, 2)
            if cls in (1, 2):  # GK or Player
                team_tracks[team_id].append(stable_id)

        # Step 3: For each team, run constrained assignment
        for team_id, stable_ids in team_tracks.items():
            roster = self.team_rosters.get(team_id)
            if roster is None:
                # No lineup constraints — keep OCR voting results as-is
                continue

            self._assign_team(
                jersey_recognizer=jersey_recognizer,
                stable_ids=stable_ids,
                valid_numbers=roster,
                team_id=team_id,
            )

        # Step 4: Resolve player names
        self._resolve_names(jersey_recognizer)

    def get_player_name(self, stable_id: int) -> Optional[str]:
        """Get player name for a track (available after assign())."""
        return self.name_map.get(stable_id)

    def get_all_names(self) -> Dict[int, str]:
        """Return the full stable_id -> player_name map."""
        return dict(self.name_map)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_team_map(tracks: dict) -> Dict[int, int]:
        """
        Walk through tracks to find the most common team_id per stable_id.
        (A track might have slightly inconsistent team_ids across frames.)
        """
        team_votes: Dict[int, Dict[int, int]] = defaultdict(lambda: defaultdict(int))

        for object_name in ("players", "goalkeepers"):
            obj_tracks = tracks.get(object_name, {})
            for frame_data in obj_tracks.values():
                for stable_id, info in frame_data.items():
                    tid = info.get("team_id")
                    if tid is not None:
                        team_votes[stable_id][tid] += 1

        result = {}
        for stable_id, votes in team_votes.items():
            result[stable_id] = max(votes, key=votes.get)
        return result

    def _assign_team(
        self,
        jersey_recognizer,
        stable_ids: List[int],
        valid_numbers: List[int],
        team_id: int,
    ):
        """
        Build cost matrix and run Hungarian algorithm for one team.
        """
        n_tracks = len(stable_ids)
        n_numbers = len(valid_numbers)

        if n_tracks == 0 or n_numbers == 0:
            return

        # Build cost matrix: cost[i][j] = -confidence that track i is number j
        # High confidence predictions → low (negative) cost → preferred by Hungarian
        cost_matrix = np.zeros((n_tracks, n_numbers), dtype=np.float64)

        for i, sid in enumerate(stable_ids):
            preds = jersey_recognizer.track_predictions.get(sid, [])
            if not preds:
                continue

            # Build a confidence histogram restricted to valid numbers
            for number, conf in preds:
                if number in valid_numbers:
                    j = valid_numbers.index(number)
                    cost_matrix[i][j] -= conf  # Negative = lower cost = preferred

        # If there are more tracks than valid numbers (shouldn't happen normally),
        # pad the cost matrix. If more numbers than tracks, Hungarian handles it.
        try:
            row_ind, col_ind = linear_sum_assignment(cost_matrix)
        except ValueError:
            return

        # Apply assignments
        for r, c in zip(row_ind, col_ind):
            sid = stable_ids[r]
            number = valid_numbers[c]
            cost = cost_matrix[r][c]

            # Only assign if there's SOME evidence (cost < 0 means we had predictions)
            # For tracks with zero predictions, keep whatever OCR voting decided
            if cost < 0:
                jersey_recognizer.set_assignment(sid, number)

        # Handle tracks that weren't assigned by Hungarian
        # (more tracks than roster slots → subs, extra detections)
        assigned_sids = {stable_ids[r] for r in row_ind if cost_matrix[r][col_ind[list(row_ind).index(r)]] < 0}
        for sid in stable_ids:
            if sid not in assigned_sids:
                # Keep the OCR voting result if it's a valid number
                current = jersey_recognizer.get_jersey_number(sid)
                if current is not None and current in valid_numbers:
                    # Check if this number was already assigned to someone else
                    currently_assigned_numbers = {
                        jersey_recognizer.get_jersey_number(s)
                        for s in assigned_sids
                    }
                    if current not in currently_assigned_numbers:
                        pass  # Keep the OCR result
                    else:
                        jersey_recognizer.track_assignment.pop(sid, None)

        print(f"[Lineup] Team {team_id}: assigned {len([r for r, c in zip(row_ind, col_ind) if cost_matrix[r][c] < 0])}"
              f"/{n_tracks} tracks to roster numbers")

    def _resolve_names(self, jersey_recognizer):
        """Map stable_id -> player_name using assignments + player_names dict."""
        self.name_map.clear()
        for sid, number in jersey_recognizer.get_all_assignments().items():
            # Check each team's name mapping
            for team_id, names in self.player_names.items():
                if number in names:
                    self.name_map[sid] = names[number]
                    break
