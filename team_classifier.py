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


def _crop_and_feature(frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
    """Extract a simple color feature from the upper torso region."""
    crop = _torso_crop(frame, bbox, padding=4)
    if crop is None:
        return None
    # Resize to reduce noise, then average RGB color
    resized = cv2.resize(crop, (16, 16), interpolation=cv2.INTER_AREA)
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    mean_color = rgb.reshape(-1, 3).mean(axis=0)
    return mean_color


# --- Lightweight color-based classifier (procedural) ---

def create_team_classifier_state(
    k: int = 2,
    warmup_frames: int = 80,
    min_samples: int = 30,
    random_state: int = 42,
) -> Dict:
    """Create mutable state for the color-based team classifier."""
    return {
        "k": k,
        "warmup_frames": warmup_frames,
        "min_samples": min_samples,
        "features": [],
        "track_ids": [],
        "kmeans": None,
        "track_team": {},
        "frame_count": 0,
        "random_state": random_state,
    }


def _fit_team_classifier(state: Dict) -> None:
    state["kmeans"] = KMeans(
        n_clusters=state["k"],
        random_state=state["random_state"],
        n_init="auto",
    )
    state["kmeans"].fit(np.array(state["features"]))
    labels = state["kmeans"].labels_
    for track_id, lbl in zip(state["track_ids"], labels):
        if track_id not in state["track_team"]:
            state["track_team"][track_id] = int(lbl)


def add_team_sample(state: Dict, frame: np.ndarray, bbox: Tuple[int, int, int, int], track_id: int) -> None:
    """Add a jersey color sample for a track."""
    state["frame_count"] += 1
    feat = _crop_and_feature(frame, bbox)
    if feat is None:
        return
    state["features"].append(feat)
    state["track_ids"].append(track_id)
    ready_for_fit = (
        state["kmeans"] is None
        and len(state["features"]) >= state["min_samples"]
        and state["frame_count"] >= state["warmup_frames"]
    )
    if ready_for_fit:
        _fit_team_classifier(state)


def predict_team(state: Dict, frame: np.ndarray, bbox: Tuple[int, int, int, int], track_id: int) -> Optional[int]:
    """Predict team id for a single bbox and update the mapping."""
    if state["kmeans"] is None:
        return state["track_team"].get(track_id)
    feat = _crop_and_feature(frame, bbox)
    if feat is None:
        return state["track_team"].get(track_id)
    lbl = int(state["kmeans"].predict([feat])[0])
    state["track_team"][track_id] = lbl
    return lbl


def get_team(state: Dict, track_id: int) -> Optional[int]:
    return state["track_team"].get(track_id)


def team_cluster_ready(state: Dict) -> bool:
    return state["kmeans"] is not None


# --- SigLIP-based classifier (procedural) ---

def create_siglip_classifier_state(
    model_name: str = "google/siglip-base-patch16-224",
    k: int = 2,
    warmup_frames: int = 25,
    min_samples: int = 16,
    pca_components: int = 40,
    random_state: int = 42,
    device: Optional[str] = None,
) -> Dict:
    """Create mutable state for the SigLIP-based team classifier."""
    resolved_device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Team/SigLIP] Loading model '{model_name}' on {resolved_device}...")
    processor = AutoProcessor.from_pretrained(model_name, use_fast=True)
    model = SiglipModel.from_pretrained(model_name).to(resolved_device)
    model.eval()
    print("[Team/SigLIP] Model ready.")
    return {
        "k": k,
        "warmup_frames": warmup_frames,
        "min_samples": min_samples,
        "pca_components": pca_components,
        "random_state": random_state,
        "features": [],
        "track_ids": [],
        "track_history": {},
        "kmeans": None,
        "pca": None,
        "track_team": {},
        "frame_count": 0,
        "device": resolved_device,
        "processor": processor,
        "model": model,
    }


def _prepare_siglip_input(state: Dict, crop: np.ndarray):
    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    return state["processor"](images=rgb, return_tensors="pt").to(state["device"])


def _extract_siglip_embedding(state: Dict, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
    crop = _torso_crop(frame, bbox, padding=4)
    if crop is None:
        return None
    inputs = _prepare_siglip_input(state, crop)
    with torch.no_grad():
        out = state["model"].get_image_features(**inputs)
    emb = out.cpu().numpy().flatten()
    norm = np.linalg.norm(emb)
    if norm > 0:
        emb = emb / norm
    return emb


def add_siglip_sample(state: Dict, frame: np.ndarray, bbox: Tuple[int, int, int, int], track_id: int) -> None:
    state["frame_count"] += 1
    emb = _extract_siglip_embedding(state, frame, bbox)
    if emb is None:
        return
    emb = emb.astype(np.float64, copy=False)
    state["features"].append(emb)
    state["track_ids"].append(track_id)
    ready_for_fit = (
        state["kmeans"] is None
        and len(state["features"]) >= state["min_samples"]
        and state["frame_count"] >= state["warmup_frames"]
    )
    if ready_for_fit:
        _fit_siglip_classifier(state)


def _fit_siglip_classifier(state: Dict) -> None:
    feats = np.array(state["features"], dtype=np.float64)
    n_components = min(state["pca_components"], feats.shape[0], feats.shape[1])
    print(f"[Team/SigLIP] Fitting PCA with {n_components} components on {feats.shape[0]} samples...")
    state["pca"] = PCA(n_components=n_components, random_state=state["random_state"])
    reduced = state["pca"].fit_transform(feats)
    print(f"[Team/SigLIP] Fitting KMeans (k={state['k']})...")
    state["kmeans"] = KMeans(n_clusters=state["k"], random_state=state["random_state"], n_init="auto")
    state["kmeans"].fit(reduced)
    labels = state["kmeans"].labels_
    for track_id, lbl in zip(state["track_ids"], labels):
        if track_id not in state["track_team"]:
            state["track_team"][track_id] = int(lbl)
    print("[Team/SigLIP] Clustering ready.")


def predict_siglip_team(
    state: Dict,
    frame: np.ndarray,
    bbox: Tuple[int, int, int, int],
    track_id: int,
    smooth_window: int = 8,
) -> Optional[int]:
    if state["kmeans"] is None or state["pca"] is None:
        return state["track_team"].get(track_id)
    emb = _extract_siglip_embedding(state, frame, bbox)
    if emb is None:
        return state["track_team"].get(track_id)
    emb = emb.astype(np.float64, copy=False)
    reduced = state["pca"].transform([emb]).astype(np.float64, copy=False)
    lbl = int(state["kmeans"].predict(reduced)[0])
    hist = state["track_history"].setdefault(track_id, [])
    hist.append(lbl)
    if len(hist) > smooth_window:
        hist.pop(0)
    counts = np.bincount(np.array(hist), minlength=state["k"])
    smoothed = int(np.argmax(counts))
    state["track_team"][track_id] = smoothed
    return smoothed


def get_siglip_team(state: Dict, track_id: int) -> Optional[int]:
    return state["track_team"].get(track_id)


def siglip_cluster_ready(state: Dict) -> bool:
    return state["kmeans"] is not None

