#!/usr/bin/env python3
"""
Team Classifier Module
Uses SiglipVisionModel for feature extraction, UMAP for dimensionality reduction,
and KMeans for clustering to classify players into teams.
"""

from typing import Generator, Iterable, List, TypeVar
import numpy as np
import supervision as sv
import torch
import umap
from sklearn.cluster import KMeans
from tqdm import tqdm
from transformers import AutoProcessor, SiglipVisionModel

V = TypeVar("V")
SIGLIP_MODEL_PATH = 'google/siglip-base-patch16-224'


def create_batches(
    sequence: Iterable[V], batch_size: int
) -> Generator[List[V], None, None]:
    """
    Generate batches from a sequence with a specified batch size.
    
    Args:
        sequence (Iterable[V]): The input sequence to be batched.
        batch_size (int): The size of each batch.
    
    Yields:
        Generator[List[V], None, None]: A generator yielding batches of the input sequence.
    """
    batch_size = max(batch_size, 1)
    current_batch = []
    for element in sequence:
        if len(current_batch) == batch_size:
            yield current_batch
            current_batch = []
        current_batch.append(element)
    if current_batch:
        yield current_batch


class TeamClassifier:
    """
    A classifier that uses a pre-trained SiglipVisionModel for feature extraction,
    UMAP for dimensionality reduction, and KMeans for clustering.
    """
    
    def __init__(self, device: str = 'cpu', batch_size: int = 32):
        """
        Initialize the TeamClassifier with device and batch size.
        
        Args:
            device (str): The device to run the model on ('cpu' or 'cuda').
            batch_size (int): The batch size for processing images.
        """
        self.device = device
        self.batch_size = batch_size
        
        print(f"🤖 Loading SiglipVisionModel on {device}...")
        self.features_model = SiglipVisionModel.from_pretrained(
            SIGLIP_MODEL_PATH).to(device)
        self.processor = AutoProcessor.from_pretrained(SIGLIP_MODEL_PATH)
        
        self.reducer = umap.UMAP(n_components=3, random_state=42)
        self.cluster_model = KMeans(n_clusters=2, random_state=42)
        
        print("✅ TeamClassifier initialized successfully")
    
    def extract_features(self, crops: List[np.ndarray]) -> np.ndarray:
        """
        Extract features from a list of image crops using the pre-trained SiglipVisionModel.
        
        Args:
            crops (List[np.ndarray]): List of image crops.
        
        Returns:
            np.ndarray: Extracted features as a numpy array.
        """
        if len(crops) == 0:
            return np.array([])
        
        # Convert crops to PIL images
        crops = [sv.cv2_to_pillow(crop) for crop in crops]
        batches = create_batches(crops, self.batch_size)
        
        data = []
        with torch.no_grad():
            for batch in tqdm(batches, desc='Extracting embeddings'):
                inputs = self.processor(
                    images=batch, return_tensors="pt").to(self.device)
                outputs = self.features_model(**inputs)
                embeddings = torch.mean(outputs.last_hidden_state, dim=1).cpu().numpy()
                data.append(embeddings)
        
        return np.concatenate(data)
    
    def fit(self, crops: List[np.ndarray]) -> None:
        """
        Fit the classifier model on a list of image crops.
        
        Args:
            crops (List[np.ndarray]): List of image crops.
        """
        print(f"🎯 Fitting team classifier on {len(crops)} player crops...")
        data = self.extract_features(crops)
        
        print("📊 Reducing dimensionality with UMAP...")
        projections = self.reducer.fit_transform(data)
        
        print("🎨 Clustering players into 2 teams with KMeans...")
        self.cluster_model.fit(projections)
        
        print("✅ Team classifier fitted successfully")
    
    def predict(self, crops: List[np.ndarray]) -> np.ndarray:
        """
        Predict the cluster labels for a list of image crops.
        
        Args:
            crops (List[np.ndarray]): List of image crops.
        
        Returns:
            np.ndarray: Predicted cluster labels (0 or 1).
        """
        if len(crops) == 0:
            return np.array([])
        
        data = self.extract_features(crops)
        projections = self.reducer.transform(data)
        return self.cluster_model.predict(projections)
    
    def get_team_colors(self, crops: List[np.ndarray], predictions: np.ndarray) -> dict:
        """
        Extract average colors for each team from the crops.
        
        Args:
            crops (List[np.ndarray]): List of image crops.
            predictions (np.ndarray): Team predictions (0 or 1).
        
        Returns:
            dict: Dictionary mapping team ID (1 or 2) to BGR color tuple.
        """
        team_colors = {}
        
        for team_id in [0, 1]:
            team_mask = predictions == team_id
            if not team_mask.any():
                continue
            
            team_crops = [crops[i] for i in range(len(crops)) if team_mask[i]]
            
            # Calculate average color for this team
            avg_colors = []
            for crop in team_crops:
                # Use center region of crop to avoid background
                h, w = crop.shape[:2]
                center_crop = crop[h//4:3*h//4, w//4:3*w//4]
                avg_color = np.mean(center_crop, axis=(0, 1))
                avg_colors.append(avg_color)
            
            # Average across all crops
            team_color_bgr = tuple(map(int, np.mean(avg_colors, axis=0)))
            team_colors[team_id + 1] = team_color_bgr  # Map 0,1 to 1,2
        
        return team_colors