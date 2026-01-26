import numpy as np
from typing import Dict, Optional, Tuple, List
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import cv2
import torch
from transformers import AutoProcessor, SiglipModel
def _torso_crop(frame: np.ndarray, bbox: Tuple[int, int, int, int], padding: int = 4) -> Optional[np.ndarray]:
    """
    Crop upper-torso region to focus on jersey colors and reduce grass/shorts noise.
    Takes top ~60% of the bbox height with small padding.
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
class TeamClassifier:
    """
    Lightweight team assignment using jersey color clustering.
    Collects color features over warmup frames, then clusters into K teams.
    """
    def __init__(self, k: int = 2, warmup_frames: int = 80, min_samples: int = 30, random_state: int = 42):
        self.k = k
        self.warmup_frames = warmup_frames
        self.min_samples = min_samples
        self.features = []
        self.track_ids = []
        self.kmeans: Optional[KMeans] = None
        self.track_team: Dict[int, int] = {}
        self.frame_count = 0

    def add_sample(self, frame: np.ndarray, bbox: Tuple[int, int, int, int], track_id: int):
        """Add a jersey color sample for a track."""
        self.frame_count += 1
        feat = _crop_and_feature(frame, bbox)
        if feat is None:
            return
        self.features.append(feat)
        self.track_ids.append(track_id)
        if self.kmeans is None and len(self.features) >= self.min_samples and self.frame_count >= self.warmup_frames:
            self._fit()
    def _fit(self):
        self.kmeans = KMeans(n_clusters=self.k, random_state=42, n_init="auto")
        self.kmeans.fit(np.array(self.features))
        # Assign historical samples
        labels = self.kmeans.labels_
        for track_id, lbl in zip(self.track_ids, labels):
            if track_id not in self.track_team:
                self.track_team[track_id] = int(lbl)

    def predict(self, frame: np.ndarray, bbox: Tuple[int, int, int, int], track_id: int) -> Optional[int]:
        """Predict team id for a single bbox; updates map."""
        if self.kmeans is None:
            return self.track_team.get(track_id)

        feat = _crop_and_feature(frame, bbox)
        if feat is None:
            return self.track_team.get(track_id)

        lbl = int(self.kmeans.predict([feat])[0])
        self.track_team[track_id] = lbl
        return lbl

    def get_team(self, track_id: int) -> Optional[int]:
        return self.track_team.get(track_id)

    def cluster_ready(self) -> bool:
        return self.kmeans is not None


class SiglipTeamClassifier:
    """
    Team assignment using SigLIP image embeddings + PCA + KMeans.
    - Warmup: collect embeddings for some frames/samples
    - Reduce dimensionality with PCA for speed/stability
    - Cluster into k teams using KMeans
    """

    def __init__(
        self,
        model_name: str = "google/siglip-base-patch16-224",
        k: int = 2,
        warmup_frames: int = 25,
        min_samples: int = 16,
        pca_components: int = 40,
        random_state: int = 42,
        device: Optional[str] = None,
    ):
        self.k = k
        self.warmup_frames = warmup_frames
        self.min_samples = min_samples
        self.pca_components = pca_components
        self.random_state = random_state
        self.features = []
        self.track_ids = []
        self.track_history: Dict[int, List[int]] = {}
        self.kmeans: Optional[KMeans] = None
        self.pca: Optional[PCA] = None
        self.track_team: Dict[int, int] = {}
        self.frame_count = 0

        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[Team/SigLIP] Loading model '{model_name}' on {self.device}...")
        self.processor = AutoProcessor.from_pretrained(model_name, use_fast=True)
        self.model = SiglipModel.from_pretrained(model_name).to(self.device)
        self.model.eval()
        print("[Team/SigLIP] Model ready.")

    def _prepare_input(self, crop: np.ndarray):
        rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        return self.processor(images=rgb, return_tensors="pt").to(self.device)

    def _extract_embedding(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
        crop = _torso_crop(frame, bbox, padding=4)
        if crop is None:
            return None
        inputs = self._prepare_input(crop)
        with torch.no_grad():
            out = self.model.get_image_features(**inputs)
        emb = out.cpu().numpy().flatten()
        # L2 normalize for cosine-like separation
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        return emb

    def add_sample(self, frame: np.ndarray, bbox: Tuple[int, int, int, int], track_id: int):
        self.frame_count += 1
        emb = self._extract_embedding(frame, bbox)
        if emb is None:
            return
        # KMeans expects float64; enforce dtype to avoid buffer mismatch errors
        emb = emb.astype(np.float64, copy=False)
        self.features.append(emb)
        self.track_ids.append(track_id)

        if self.kmeans is None and len(self.features) >= self.min_samples and self.frame_count >= self.warmup_frames:
            self._fit()

    def _fit(self):
        # Enforce float64 for sklearn compatibility
        feats = np.array(self.features, dtype=np.float64)
        n_components = min(self.pca_components, feats.shape[0], feats.shape[1])
        print(f"[Team/SigLIP] Fitting PCA with {n_components} components on {feats.shape[0]} samples...")
        self.pca = PCA(n_components=n_components, random_state=self.random_state)
        reduced = self.pca.fit_transform(feats)
        print(f"[Team/SigLIP] Fitting KMeans (k={self.k})...")
        self.kmeans = KMeans(n_clusters=self.k, random_state=self.random_state, n_init="auto")
        self.kmeans.fit(reduced)
        labels = self.kmeans.labels_
        for track_id, lbl in zip(self.track_ids, labels):
            if track_id not in self.track_team:
                self.track_team[track_id] = int(lbl)
        print("[Team/SigLIP] Clustering ready.")

    def predict(self, frame: np.ndarray, bbox: Tuple[int, int, int, int], track_id: int, smooth_window: int = 8) -> Optional[int]:
        if self.kmeans is None or self.pca is None:
            return self.track_team.get(track_id)

        emb = self._extract_embedding(frame, bbox)
        if emb is None:
            return self.track_team.get(track_id)

        # Keep float64 through the pipeline to avoid dtype mismatch in sklearn
        emb = emb.astype(np.float64, copy=False)
        reduced = self.pca.transform([emb]).astype(np.float64, copy=False)
        lbl = int(self.kmeans.predict(reduced)[0])

        # Temporal smoothing via majority vote over recent assignments
        hist = self.track_history.setdefault(track_id, [])
        hist.append(lbl)
        if len(hist) > smooth_window:
            hist.pop(0)
        counts = np.bincount(np.array(hist), minlength=self.k)
        smoothed = int(np.argmax(counts))

        self.track_team[track_id] = smoothed
        return smoothed

    def get_team(self, track_id: int) -> Optional[int]:
        return self.track_team.get(track_id)

    def cluster_ready(self) -> bool:
        return self.kmeans is not None

