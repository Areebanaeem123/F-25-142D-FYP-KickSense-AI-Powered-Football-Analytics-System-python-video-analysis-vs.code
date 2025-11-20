import os, numpy as np
from sklearn.cluster import KMeans
from PIL import Image
from transformers import AutoModel, AutoProcessor
import torch

# Load model
device = "cuda"
processor = AutoProcessor.from_pretrained("google/siglip-base-patch16-224", use_fast = True)
model = AutoModel.from_pretrained("google/siglip-base-patch16-224").to(device)
model.eval()

# Path to crops
ROOT = "auto_samples"
embeddings = []
files = []

# Compute embeddings
for fname in os.listdir(ROOT):
    if not fname.endswith(".jpg"): 
        continue
    path = os.path.join(ROOT, fname)
    img = Image.open(path).convert("RGB")

    # Pass a dummy text input
    inputs = processor(images=img, text=[""], return_tensors="pt").to(device)
    with torch.no_grad():
        emb = model(**inputs).image_embeds[0].cpu().numpy()

    # Normalize
    emb = emb / np.linalg.norm(emb)
    embeddings.append(emb)
    files.append(path)

embeddings = np.array(embeddings)

# Cluster into 2 teams
kmeans = KMeans(n_clusters=2).fit(embeddings)
labels = kmeans.labels_

# Save clustered results
for file, label in zip(files, labels):
    dest = f"clustered/team{label}"
    os.makedirs(dest, exist_ok=True)
    os.system(f"cp '{file}' '{dest}/'")
    print(labels)
