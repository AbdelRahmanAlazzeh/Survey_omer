"""Prepare standardized 3-view face composites for Survey v2.

Implements the 7-step preparation pipeline from plans/code_artifact.md:
  1. Read sex (F/M) and population (CN/ME) from source filename.
  2. Deduplicate exact files by SHA-256 hash.
  3. Detect the frontal face in the center panel and standardize face height across all subjects.
  4. Re-space the 3 views (left profile, frontal, right profile) evenly on a white 1000x400 canvas.
  5. Strip all EXIF/hidden metadata and save optimized JPEG (~35 KB).
  6. Assign deterministic opaque code (e.g. f_zk83xz.jpg / m_92c1fl.jpg).
  7. Write mapping key to data/faces.csv (code,source_file,sex,population,provenance,status,note).

Usage:
  python tools/prepare_faces.py --src "../more dataset/pic for test"
"""
import argparse
import csv
import hashlib
import os
import re
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

CANVAS_W = 1000
CANVAS_H = 400
SLOT_W = 333
TARGET_FACE_H = 170.0  # Standardized frontal face height (px) on 400px-tall canvas
VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}

# Mapping of optional organized subfolders -> (sex, population)
SUBFOLDER_META = {
    "chin-women": ("F", "CN"),
    "chin-men": ("M", "CN"),
    "meu-women": ("F", "ME"),
    "meu-men": ("M", "ME"),
}

# Filenames in "pic for test" known to be Chinese Male despite omitting "chinese" in filename
KNOWN_CN_OVERRIDES = {"17M.jpg", "18M.jpg"}

# Known excluded source files (kept excluded even if stimuli.csv is moved aside)
KNOWN_EXCLUDED = {
    "20M chinese.jpg": "Source photo: nose cut off by the frame in the right profile. Needs a new photo."
}


def base36_hash(digest: bytes, length: int = 6) -> str:
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    val = int.from_bytes(digest[:8], "big")
    chars = []
    for _ in range(length):
        val, rem = divmod(val, 36)
        chars.append(alphabet[rem])
    return "".join(chars)


def parse_filename_meta(filename: str) -> tuple[str, str]:
    m = re.match(r"^\d+\s*([FMfm])", filename)
    if not m:
        raise ValueError(f"Cannot determine sex (F/M) from filename: {filename}")
    sex = m.group(1).upper()
    is_cn = ("chinese" in filename.lower()) or (filename in KNOWN_CN_OVERRIDES)
    population = "CN" if is_cn else "ME"
    return sex, population


def load_stimuli_hints(stimuli_csv: Path) -> dict[str, dict]:
    hints = {}
    if not stimuli_csv.is_file():
        return hints
    with open(stimuli_csv, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            hints[row["file"]] = row
    return hints


def find_split_x(gray: np.ndarray, x_from: int, x_to: int) -> tuple[int, str]:
    h, w = gray.shape
    x_from = max(1, x_from)
    x_to = min(w - 2, x_to)

    # 1. Check for a vertical divider line running down the frame
    diffs = np.abs(gray[:, x_from : x_to + 1].astype(np.int16) - gray[:, x_from - 1 : x_to].astype(np.int16))
    line_scores = (diffs > 10).mean(axis=0)
    best_idx = int(np.argmax(line_scores))
    if line_scores[best_idx] >= 0.72:
        return x_from + best_idx, "line"

    # 2. Check for widest empty column gap across the head band (top 3% to 55%)
    top_bg = float(np.percentile(gray[: max(2, h // 20), :], 75))
    head_band = gray[int(h * 0.03) : int(h * 0.55), :]
    occupied = (np.abs(head_band.astype(np.int16) - top_bg) > 16).sum(axis=0) >= max(4, h // 60)

    best_start, best_len = -1, 0
    run_start = None
    for x in range(x_from, x_to + 2):
        is_gap = x <= x_to and not occupied[x]
        if is_gap and run_start is None:
            run_start = x
        elif not is_gap and run_start is not None:
            if x - run_start > best_len:
                best_len = x - run_start
                best_start = run_start
            run_start = None
    if best_len >= 2:
        return best_start + best_len // 2, "gap"

    return (x_from + x_to) // 2, "thirds"


def panel_foreground_bbox(panel_gray: np.ndarray) -> tuple[int, int, int, int]:
    h, w = panel_gray.shape
    corner_w = max(4, w // 12)
    corner_h = max(2, h // 12)
    corners = np.concatenate([
        panel_gray[:corner_h, :corner_w].ravel(),
        panel_gray[:corner_h, w - corner_w :].ravel(),
    ])
    bg = float(np.median(corners))
    fg = np.abs(panel_gray.astype(np.int16) - bg) > 16

    row_counts = fg.sum(axis=1)
    col_counts = fg.sum(axis=0)
    row_min = max(3, w // 80)
    col_min = max(3, h // 80)

    def longest_run(mask: np.ndarray) -> tuple[int, int]:
        best_s, best_e, best_l = 0, len(mask) - 1, 0
        cur_s = None
        for i in range(len(mask) + 1):
            on = i < len(mask) and bool(mask[i])
            if on and cur_s is None:
                cur_s = i
            elif not on and cur_s is not None:
                if i - cur_s > best_l:
                    best_l = i - cur_s
                    best_s, best_e = cur_s, i - 1
                cur_s = None
        return best_s, best_e

    y0, y1 = longest_run(row_counts >= row_min)
    x0, x1 = longest_run(col_counts >= col_min)
    if x1 <= x0 or y1 <= y0:
        return 0, 0, w, h
    return x0, y0, x1 + 1, y1 + 1


def detect_frontal_face(mid_gray: np.ndarray, cascade: cv2.CascadeClassifier) -> tuple[int, int, int, int] | None:
    mh, mw = mid_gray.shape
    faces = cascade.detectMultiScale(mid_gray, scaleFactor=1.08, minNeighbors=4, minSize=(25, 25))
    if len(faces) == 0:
        return None
    # Prefer the largest face close to the horizontal center of the frontal panel
    best = max(faces, key=lambda r: (r[2] * r[3]) - abs((r[0] + r[2] / 2) - mw / 2) * 40)
    return int(best[0]), int(best[1]), int(best[2]), int(best[3])


def process_image(
    src_path: Path,
    dest_path: Path,
    cascade: cv2.CascadeClassifier,
    split_hint: tuple[int, int] | None = None,
) -> dict:
    with Image.open(src_path) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        rgb = np.array(im)

    h, w, _ = rgb.shape
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

    if split_hint is not None:
        split_a, split_b = split_hint
    else:
        split_a, _ = find_split_x(gray, int(w * 0.24), int(w * 0.43))
        split_b, _ = find_split_x(gray, int(w * 0.57), int(w * 0.76))

    # Extract 3 panels (trim 3px divider margin)
    bounds = [
        (0, max(10, split_a - 3)),
        (min(w - 10, split_a + 3), max(split_a + 13, split_b - 3)),
        (min(w - 10, split_b + 3), w),
    ]

    panels = []
    bboxes = []
    for x0, x1 in bounds:
        p_rgb = rgb[:, x0:x1]
        p_gray = gray[:, x0:x1]
        bx0, by0, bx1, by1 = panel_foreground_bbox(p_gray)
        panels.append(p_rgb)
        bboxes.append((bx0, by0, bx1, by1))

    # Detect frontal face in middle panel (index 1) to standardize face scale across subjects
    mid_gray = gray[:, bounds[1][0] : bounds[1][1]]
    face_box = detect_frontal_face(mid_gray, cascade)
    mid_fg = bboxes[1]
    if face_box is not None:
        fx, fy, fw, fh = face_box
        face_h = float(fh)
        face_center_y = fy + fh * 0.5
    else:
        fg_h = float(mid_fg[3] - mid_fg[1])
        face_h = max(40.0, fg_h * 0.55)
        face_center_y = mid_fg[1] + fg_h * 0.42

    scale = TARGET_FACE_H / max(20.0, face_h)
    # Ensure width of any panel fits within slot width with small margin (max 318 px)
    max_scale_w = min(318.0 / max(1, (bx1 - bx0)) for bx0, _, bx1, _ in bboxes)
    # Also ensure the head top-to-chin region doesn't overflow vertically
    scale = min(scale, max_scale_w, 384.0 / max(1.0, face_h * 1.45))

    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), (255, 255, 255))
    slot_centers = [SLOT_W // 2, CANVAS_W // 2, CANVAS_W - SLOT_W // 2]

    # Target vertical anchor: put head top nicely inside upper margin while fitting full crop
    for idx, (p_rgb, (bx0, by0, bx1, by1), cx) in enumerate(zip(panels, bboxes, slot_centers)):
        # Expand crop slightly around foreground head/shoulders
        ph, pw = p_rgb.shape[:2]
        pad_x = max(2, int((bx1 - bx0) * 0.04))
        pad_y = max(2, int((by1 - by0) * 0.04))
        cx0 = max(0, bx0 - pad_x)
        cy0 = max(0, by0 - pad_y)
        cx1 = min(pw, bx1 + pad_x)
        cy1 = min(ph, by1 + pad_y)

        crop = Image.fromarray(p_rgb[cy0:cy1, cx0:cx1])
        cw, ch = crop.size
        nw = max(1, int(round(cw * scale)))
        nh = max(1, int(round(ch * scale)))

        # If height exceeds canvas height (392px), crop excess lower shoulders while keeping head scale identical
        if nh > CANVAS_H - 8:
            # Keep top of head (with 6px top margin) and trim lower torso excess
            keep_src_h = max(1, int(round((CANVAS_H - 8) / scale)))
            crop = crop.crop((0, 0, cw, min(ch, keep_src_h)))
            nh = min(CANVAS_H - 8, int(round(crop.size[1] * scale)))

        resized = crop.resize((nw, nh), Image.Resampling.LANCZOS)
        paste_x = int(cx - nw // 2)
        # Align top proportionally or sit on bottom if shoulders reach bottom edge
        at_bottom = by1 >= ph - 3
        paste_y = (CANVAS_H - nh) if at_bottom else max(4, (CANVAS_H - nh) // 2)
        canvas.paste(resized, (paste_x, paste_y))

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    # Save stripped JPEG (no EXIF, quality 80, progressive + optimized -> ~35 KB)
    canvas.save(dest_path, format="JPEG", quality=80, optimize=True, progressive=True)
    size_kb = dest_path.stat().st_size / 1024.0
    return {"size_kb": round(size_kb, 1), "haar_detected": face_box is not None}


def main():
    rating_root = Path(__file__).resolve().parent.parent
    repo_root = rating_root.parent

    parser = argparse.ArgumentParser(description="Prepare standardized 3-view face composites.")
    parser.add_argument("--src", type=Path, default=repo_root / "more dataset" / "pic for test")
    parser.add_argument("--out-dir", type=Path, default=rating_root / "public" / "faces")
    parser.add_argument("--csv", type=Path, default=rating_root / "data" / "faces.csv")
    args = parser.parse_args()

    if not args.src.is_dir():
        raise SystemExit(f"Source directory not found: {args.src}")

    stimuli_hints = load_stimuli_hints(args.src / "rating-site" / "private" / "stimuli.csv")
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    src_entries: list[tuple[Path, tuple[str, str] | None]] = []
    for f in args.src.iterdir():
        if f.is_file() and f.suffix.lower() in VALID_EXTS:
            src_entries.append((f, None))
        elif f.is_dir() and f.name.lower() in SUBFOLDER_META:
            meta = SUBFOLDER_META[f.name.lower()]
            for sub_f in f.iterdir():
                if sub_f.is_file() and sub_f.suffix.lower() in VALID_EXTS:
                    src_entries.append((sub_f, meta))

    src_entries.sort(
        key=lambda item: (
            int(re.match(r"^(\d+)", item[0].name).group(1)) if re.match(r"^\d+", item[0].name) else 999999,
            item[0].name,
        )
    )

    seen_hashes: dict[str, str] = {}
    csv_rows: list[dict] = []
    sizes_kb: list[float] = []
    expected_files: set[str] = set()

    for f, folder_meta in src_entries:
        digest = hashlib.sha256(f.read_bytes()).digest()
        hex_digest = digest.hex()
        if hex_digest in seen_hashes:
            print(f"DUPLICATE skipped: {f.name} == {seen_hashes[hex_digest]}")
            continue
        seen_hashes[hex_digest] = f.name

        sex, population = folder_meta if folder_meta is not None else parse_filename_meta(f.name)
        code = f"{sex.lower()}_{base36_hash(digest, 6)}"
        out_name = f"{code}.jpg"
        expected_files.add(out_name)

        hint = stimuli_hints.get(f.name)
        split_hint = None
        status = "active"
        note = ""
        if hint:
            try:
                split_hint = (int(hint["split_a"]), int(hint["split_b"]))
            except (KeyError, ValueError):
                split_hint = None
            if hint.get("role") == "exclude":
                status = "excluded"
            note = hint.get("note", "")
        if f.name in KNOWN_EXCLUDED:
            status = "excluded"
            if not note:
                note = KNOWN_EXCLUDED[f.name]

        info = process_image(f, args.out_dir / out_name, cascade, split_hint=split_hint)
        sizes_kb.append(info["size_kb"])
        csv_rows.append({
            "code": code,
            "source_file": f.name,
            "sex": sex,
            "population": population,
            "provenance": "ok",
            "status": status,
            "note": note,
        })

    # Clean stale files in out_dir if re-running
    if args.out_dir.is_dir():
        for existing in args.out_dir.iterdir():
            if existing.is_file() and existing.name not in expected_files:
                existing.unlink()

    args.csv.parent.mkdir(parents=True, exist_ok=True)
    with open(args.csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["code", "source_file", "sex", "population", "provenance", "status", "note"]
        )
        writer.writeheader()
        writer.writerows(csv_rows)

    summary: dict[tuple[str, str, str], int] = {}
    for r in csv_rows:
        k = (r["sex"], r["population"], r["status"])
        summary[k] = summary.get(k, 0) + 1

    print(f"Processed {len(csv_rows)} unique faces -> {args.out_dir}")
    print(f"Wrote key -> {args.csv}")
    print(f"Size KB: min={min(sizes_kb):.1f}, mean={sum(sizes_kb)/len(sizes_kb):.1f}, max={max(sizes_kb):.1f}")
    for k, cnt in sorted(summary.items()):
        print(f"  {k[0]}-{k[1]} ({k[2]}): {cnt}")


if __name__ == "__main__":
    main()

