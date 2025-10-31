#!/usr/bin/env python3
import os
from pathlib import Path
from collections import Counter
import matplotlib.pyplot as plt
import yaml

# === CONFIGURATION ===
DATASET_DIR = Path("merged_dataset2")
SPLITS = ["train", "val", "test"]
DATA_YAML = DATASET_DIR / "data.yaml"  # Path to YOLO dataset YAML
# =====================

def load_class_names():
    """Load class names from data.yaml if available."""
    if DATA_YAML.exists():
        with open(DATA_YAML, "r") as f:
            data = yaml.safe_load(f)
            if "names" in data:
                return data["names"]
    return None

def count_classes(label_dir):
    """Count class frequencies in all label files in a directory."""
    class_counter = Counter()
    total_labels = 0

    for lbl_file in label_dir.glob("*.txt"):
        with open(lbl_file, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) > 0:
                    cls = int(parts[0])
                    class_counter[cls] += 1
                    total_labels += 1
    return class_counter, total_labels

def analyze_split(split):
    lbl_dir = DATASET_DIR / split / "labels"
    files = list(lbl_dir.glob("*.txt"))
    if not files:
        print(f"⚠️ No label files found in {lbl_dir}")
        return Counter(), 0

    class_counts, total_labels = count_classes(lbl_dir)
    print(f"\n=== {split.upper()} SPLIT ===")
    print(f"📁 Label files: {len(files)}")
    print(f"🏷️  Total annotations: {total_labels}")
    for cls, count in sorted(class_counts.items()):
        print(f"  Class {cls}: {count}")
    return class_counts, total_labels

def plot_class_distribution(class_counts, class_names=None):
    """Plot a bar chart of class distribution."""
    classes = list(class_counts.keys())
    counts = [class_counts[c] for c in classes]

    if class_names:
        labels = [class_names[c] if c < len(class_names) else f"Class {c}" for c in classes]
    else:
        labels = [f"Class {c}" for c in classes]

    plt.figure(figsize=(8, 5))
    bars = plt.bar(labels, counts)
    plt.title("Class Distribution in Dataset", fontsize=14)
    plt.xlabel("Class", fontsize=12)
    plt.ylabel("Number of Annotations", fontsize=12)
    plt.xticks(rotation=15)
    plt.grid(axis="y", linestyle="--", alpha=0.6)

    # Annotate bar values
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + max(counts)*0.01,
                 f"{yval}", ha='center', va='bottom', fontsize=9)

    plt.tight_layout()
    plt.show()

def main():
    print("📊 Checking class distribution in:", DATASET_DIR)
    total_counter = Counter()
    total_annots = 0
    total_files = 0

    for split in SPLITS:
        split_counts, split_total = analyze_split(split)
        total_counter.update(split_counts)
        total_annots += split_total
        lbl_dir = DATASET_DIR / split / "labels"
        total_files += len(list(lbl_dir.glob("*.txt")))

    print("\n=== OVERALL SUMMARY ===")
    print(f"📁 Total label files: {total_files}")
    print(f"🏷️  Total annotations: {total_annots}")
    for cls, count in sorted(total_counter.items()):
        print(f"  Class {cls}: {count}")

    # Load class names (if YAML found)
    class_names = load_class_names()

    # Plot overall class distribution
    plot_class_distribution(total_counter, class_names)

if __name__ == "__main__":
    main()
