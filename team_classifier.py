<<<<<<< HEAD
=======
# this file will work on bteam classification using siglip
# TeamClassifier.py
import torch
import numpy as np
from transformers import AutoProcessor, AutoModel
from PIL import Image
device = "cuda"

# Load SigLIP
processor = AutoProcessor.from_pretrained("google/siglip-base-patch16-224")
model = AutoModel.from_pretrained("google/siglip-base-patch16-224").to(device)
model.eval()

# Store reference embeddings

TEAM_REFERENCES = {}   # Filled automatically
def compute_embedding(crop):
    """Convert cropped player image to SigLIP embedding."""
    if crop is None or crop.size == 0:
        return None
    img = Image.fromarray(crop)
    inputs = processor(images=img, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
        emb = outputs.image_embeds[0].cpu().numpy()
    return emb

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def register_reference(team_name, crop):
    """Manually add reference crop for a team."""
    emb = compute_embedding(crop)
    if emb is not None:
        TEAM_REFERENCES[team_name] = emb
        print(f"📌 Added reference for {team_name}")

def classify_team(crop):
    """Assign team based on closest reference embedding."""
    if crop is None or len(TEAM_REFERENCES) == 0:
        return "Unknown"
    emb = compute_embedding(crop)
    scores = {team: cosine_sim(emb, ref) for team, ref in TEAM_REFERENCES.items()}
    return max(scores, key=scores.get)
>>>>>>> 586ebbcde353429d39d46853e6ad2678de87974a
