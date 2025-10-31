import os
import shutil
import random

# Paths
dataset_dir = "/home/labuser/Desktop/KickSense/filtered_folder"  
output_dir = "/home/labuser/Desktop/KickSense/split_dataset"  # Where train/val/test will go

images_dir = os.path.join(dataset_dir, "Images")
labels_dir = os.path.join(dataset_dir, "Labels")

# Create output structure
for split in ["train", "val", "test"]:
    os.makedirs(os.path.join(output_dir, split, "images"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, split, "labels"), exist_ok=True)

# Get list of images
all_images = [f for f in os.listdir(images_dir) if f.lower().endswith((".jpg", ".png", ".jpeg"))]
random.shuffle(all_images)

# Split ratios
train_ratio = 0.7
val_ratio = 0.2
test_ratio = 0.1

n_total = len(all_images)
n_train = int(train_ratio * n_total)
n_val = int(val_ratio * n_total)
# Remaining goes to test
train_files = all_images[:n_train]
val_files = all_images[n_train:n_train + n_val]
test_files = all_images[n_train + n_val:]

splits = {"train": train_files, "val": val_files, "test": test_files}

# Copy images and labels to corresponding folders
for split, files in splits.items():
    for img_file in files:
        label_file = os.path.splitext(img_file)[0] + ".txt"

        # Copy image
        shutil.copy2(os.path.join(images_dir, img_file),
                     os.path.join(output_dir, split, "images", img_file))

        # Copy label (skip if missing)
        src_label = os.path.join(labels_dir, label_file)
        dst_label = os.path.join(output_dir, split, "labels", label_file)
        if os.path.exists(src_label):
            shutil.copy2(src_label, dst_label)

print("✅ Dataset split completed!")
print(f"Structure inside {output_dir}:")
print("""
train/
    images/
    labels/
val/
    images/
    labels/
test/
    images/
    labels/
""")
