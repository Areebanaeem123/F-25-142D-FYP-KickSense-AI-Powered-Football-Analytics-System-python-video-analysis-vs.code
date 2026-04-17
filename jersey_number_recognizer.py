"""
Jersey Number Recognition Module for KickSense
================================================
Uses PaddleOCR on torso crops + temporal majority voting per track.
Follows the same pattern as SiglipTeamClassifier:
  - process_crop() called per-frame inside the tracking loop
  - Accumulates predictions per stable_id
  - Temporal voting produces a final jersey number per track
"""

import re
import numpy as np
import cv2
from typing import Dict, Optional, Tuple, List
from collections import defaultdict

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    print("[JerseyOCR] ⚠️ paddleocr not installed. "
          "Install with: pip install paddleocr paddlepaddle-gpu")


# Re-use the torso crop helper already present in team_classifier.py
def _torso_crop(frame: np.ndarray, bbox: Tuple[int, int, int, int],
                padding: int = 4) -> Optional[np.ndarray]:
    """
    Crop upper-torso region (top 60 %) to focus on jersey number.
    Identical to the function in team_classifier.py.
    """
    x1, y1, x2, y2 = map(int, bbox)
    h, w = frame.shape[:2]
    x1, y1 = max(0, x1 - padding), max(0, y1 - padding)
    x2, y2 = min(w - 1, x2 + padding), min(h - 1, y2 + padding)
    if x2 <= x1 or y2 <= y1:
        return None
    torso_height = int((y2 - y1) * 0.6)
    y2_torso = y1 + torso_height
    crop = frame[y1:y2_torso, x1:x2]
    if crop.size == 0:
        return None
    return crop


_DIGIT_RE = re.compile(r"^\d{1,2}$")


class JerseyNumberRecognizer:
    """
    Recognises jersey numbers from player bounding-box crops.

    Lifecycle (mirrors SiglipTeamClassifier):
        1. Created once in OptimizedTrackingProcessor.__init__
        2. process_crop() called per-player per-frame
        3. get_jersey_number() returns the temporally-voted result
        4. finalize() runs a final voting pass after tracking completes
    """

    def __init__(
        self,
        recognition_interval: int = 5,
        min_crop_height: int = 40,
        min_crop_width: int = 20,
        ocr_confidence_threshold: float = 0.35,
        voting_min_agreement: float = 0.35,
        voting_min_votes: int = 3,
        use_gpu: bool = True,
    ):
        """
        Args:
            recognition_interval: Run OCR every N frames (like team_classification_interval).
            min_crop_height: Skip crops shorter than this (too small to read).
            min_crop_width: Skip crops narrower than this.
            ocr_confidence_threshold: Minimum PaddleOCR confidence to accept a reading.
            voting_min_agreement: Fraction of votes the winner needs to be accepted.
            voting_min_votes: Minimum total votes before producing a result.
            use_gpu: Whether PaddleOCR should use GPU.
        """
        self.recognition_interval = recognition_interval
        self.min_crop_height = min_crop_height
        self.min_crop_width = min_crop_width
        self.ocr_confidence_threshold = ocr_confidence_threshold
        self.voting_min_agreement = voting_min_agreement
        self.voting_min_votes = voting_min_votes

        # Per-track accumulators  stable_id -> [(number, confidence), ...]
        self.track_predictions: Dict[int, List[Tuple[int, float]]] = defaultdict(list)
        # Final assignments  stable_id -> jersey number
        self.track_assignment: Dict[int, Optional[int]] = {}

        # Initialise PaddleOCR (once)
        if PADDLEOCR_AVAILABLE:
            print("[JerseyOCR] Initialising PaddleOCR engine...")
            self.ocr = PaddleOCR(
                use_angle_cls=True,
                lang="en",
                show_log=False,
                use_gpu=use_gpu,
                # Optimise for short digit strings
                det_db_thresh=0.3,
                rec_algorithm="SVTR_LCNet",
            )
            print("[JerseyOCR] ✅ PaddleOCR ready.")
        else:
            self.ocr = None

    # ------------------------------------------------------------------
    # Public API (called from tracking loop)
    # ------------------------------------------------------------------

    def process_crop(
        self,
        frame: np.ndarray,
        bbox: Tuple[int, int, int, int],
        stable_id: int,
        frame_idx: int,
    ) -> Optional[int]:
        """
        Called per-player per-frame inside OptimizedTrackingProcessor.process_video().
        Returns the current best-guess jersey number (or None).
        """
        if self.ocr is None:
            return None

        # Interval gating (same pattern as team_classification_interval)
        if frame_idx % self.recognition_interval != 0:
            return self.track_assignment.get(stable_id)

        # Crop torso
        crop = _torso_crop(frame, bbox)
        if crop is None:
            return self.track_assignment.get(stable_id)
        ch, cw = crop.shape[:2]
        if ch < self.min_crop_height or cw < self.min_crop_width:
            return self.track_assignment.get(stable_id)

        # Pre-process: upscale small crops for better OCR
        scale = 1.0
        if ch < 80:
            scale = 80.0 / ch
            crop = cv2.resize(
                crop, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC
            )

        # Run PaddleOCR
        try:
            results = self.ocr.ocr(crop, cls=True)
        except Exception:
            return self.track_assignment.get(stable_id)

        # Parse results — extract digit-only strings
        if results and results[0]:
            for line in results[0]:
                text, conf = line[1]  # (text, confidence)
                text = text.strip()
                # Only accept 1- or 2-digit numbers
                if _DIGIT_RE.match(text) and conf >= self.ocr_confidence_threshold:
                    number = int(text)
                    if 1 <= number <= 99:
                        self.track_predictions[stable_id].append((number, float(conf)))

        # Run temporal voting with current accumulated data
        self._vote(stable_id)

        return self.track_assignment.get(stable_id)

    def get_jersey_number(self, stable_id: int) -> Optional[int]:
        """Return the current jersey number assignment for a track."""
        return self.track_assignment.get(stable_id)

    def finalize(self):
        """
        Run final voting pass for all tracks after video processing completes.
        Called from main_pipeline.py before DB persistence.
        """
        for stable_id in list(self.track_predictions.keys()):
            self._vote(stable_id)

    def get_all_assignments(self) -> Dict[int, int]:
        """Return the full stable_id -> jersey_number map."""
        return dict(self.track_assignment)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _vote(self, stable_id: int):
        """
        Confidence-weighted majority voting over all predictions for a track.
        """
        preds = self.track_predictions.get(stable_id, [])
        if len(preds) < self.voting_min_votes:
            return

        # Build weighted histogram
        histogram: Dict[int, float] = defaultdict(float)
        for number, conf in preds:
            histogram[number] += conf

        total_weight = sum(histogram.values())
        if total_weight == 0:
            return

        # Pick the winner
        winner = max(histogram, key=histogram.get)
        winner_weight = histogram[winner]
        agreement = winner_weight / total_weight

        if agreement >= self.voting_min_agreement:
            self.track_assignment[stable_id] = winner

    def set_assignment(self, stable_id: int, number: int):
        """Force-set a jersey number (used by LineupAssigner post-processing)."""
        self.track_assignment[stable_id] = number

    def get_prediction_stats(self) -> Dict[int, dict]:
        """
        Return diagnostic info for each track.
        Useful for debugging / FYP evaluation.
        """
        stats = {}
        for sid, preds in self.track_predictions.items():
            if not preds:
                continue
            histogram: Dict[int, float] = defaultdict(float)
            count: Dict[int, int] = defaultdict(int)
            for num, conf in preds:
                histogram[num] += conf
                count[num] += 1

            total_weight = sum(histogram.values())
            winner = max(histogram, key=histogram.get) if histogram else None

            stats[sid] = {
                "total_predictions": len(preds),
                "unique_numbers_seen": len(histogram),
                "winner": winner,
                "winner_votes": count.get(winner, 0),
                "winner_weight_pct": (histogram.get(winner, 0) / total_weight * 100)
                if total_weight > 0
                else 0,
                "assigned": self.track_assignment.get(sid),
                "histogram": dict(histogram),
            }
        return stats
