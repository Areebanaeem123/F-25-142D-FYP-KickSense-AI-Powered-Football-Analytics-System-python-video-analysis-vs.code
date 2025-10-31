#!/usr/bin/env python3
import os
import shutil
from pathlib import Path

# === USER CONFIG ===
DATASET_DIR = Path("/home/labuser/Desktop/KickSense/football-players-detection.v1i.yolov8")
KEEP_CLASSES = {"1", "3"}   # strings because we'll compare to split strings
SPLITS = ["train", "val", "test"]
IMG_EXTS = [".jpg", ".jpeg", ".png"]
# ====================

def ensure_out_dirs(split):
    out_img_dir = DATASET_DIR / split / "images_filtered"
    out_lbl_dir = DATASET_DIR / split / "labels_filtered"
    out_img_dir.mkdir(parents=True, exist_ok=True)
    out_lbl_dir.mkdir(parents=True, exist_ok=True)
    return out_img_dir, out_lbl_dir

def find_image_path(img_dir, base_name):
    for ext in IMG_EXTS:
        p = img_dir / (base_name + ext)
        if p.exists():
            return p
    return None

def process_split(split):
    img_dir = DATASET_DIR / split / "images"
    lbl_dir = DATASET_DIR / split / "labels"
    out_img_dir, out_lbl_dir = ensure_out_dirs(split)

    if not lbl_dir.exists():
        print(f"[WARN] labels folder not found for split '{split}' ({lbl_dir}) — skipping")
        return (0,0,0)  # processed, kept, removed counts

    total_files = 0
    kept_files = 0
    removed_files = 0

    for lbl_file in sorted(lbl_dir.glob("*.txt")):
        total_files += 1
        base_name = lbl_file.stem
        with lbl_file.open("r", encoding="utf-8") as f:
            lines = [ln.rstrip() for ln in f if ln.strip()]

        # Filter lines where class id (first token) is in KEEP_CLASSES
        filtered_lines = []
        for ln in lines:
            parts = ln.split()
            if len(parts) == 0:
                continue
            cls = parts[0].strip()
            if cls in KEEP_CLASSES:
                filtered_lines.append(ln + "\n")

        if filtered_lines:
            # write label to filtered folder
            out_label_path = out_lbl_dir / lbl_file.name
            with out_label_path.open("w", encoding="utf-8") as out_f:
                out_f.writelines(filtered_lines)

            # copy image to images_filtered if exists
            src_img = find_image_path(img_dir, base_name)
            if src_img:
                dst_img = out_img_dir / src_img.name
                if not dst_img.exists():
                    shutil.copy2(src_img, dst_img)
            kept_files += 1
        else:
            # there were no goalkeeper/referee annotations -> we skip copying label and image
            removed_files += 1

    print(f"[{split}] total label files: {total_files}  kept: {kept_files}  removed: {removed_files}")
    return (total_files, kept_files, removed_files)

def main():
    overall = {"total":0, "kept":0, "removed":0}
    print("Dataset root:", DATASET_DIR)
    for split in SPLITS:
        t,k,r = process_split(split)
        overall["total"] += t
        overall["kept"] += k
        overall["removed"] += r
    print("=== Summary ===")
    print(f"Total label files scanned: {overall['total']}")
    print(f"Files kept (have GK/referee): {overall['kept']}")
    print(f"Files removed (no GK/referee): {overall['removed']}")
    print("\nFiltered labels and images are in each split's 'labels_filtered' and 'images_filtered' folders.")
    print("If everything looks good, you can replace original folders with the filtered ones (or merge as needed).")

if __name__ == '__main__':
    main()
