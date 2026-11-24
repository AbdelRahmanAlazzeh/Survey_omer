# Dataset Analysis & Obstacles Report (`more dataset`)

## 1. `more dataset/pic for test` (138 Composite Photos — Processed)
All 138 composite 3-angle photos were processed by `tools/prepare_faces.py` into `public/faces/` (`1000 × 400`, white canvas, EXIF stripped, mean size `32.4 KB`) and recorded in `data/faces.csv`.

### Findings & Notes
1. **Unlabelled Chinese Male Files (`17M.jpg`, `18M.jpg`):**
   - Both files omit the word `chinese` in their filenames, whereas `17M.jpeg` and `18M.jpeg` (`1280 × 568`) are the Middle Eastern Male photos.
   - Visually and dimensionally (`1500 × 430`), `17M.jpg` and `18M.jpg` match the `10M–16M chinese.jpg` (`1500 × 430`) Chinese Male series.
   - `prepare_faces.py` explicitly assigns `17M.jpg` and `18M.jpg` to `CN`, matching the exact target breakdown (`F-CN: 10, F-ME: 53, M-CN: 29, M-ME: 46`).
2. **Excluded Photo (`20M chinese.jpg`):**
   - Marked `status = excluded` in `data/faces.csv` (matching the note in `stimuli.csv`: `"Source photo: nose cut off by the frame in the right profile. Needs a new photo."`).
   - Result: **28 active M-CN faces** (and **10 active F-CN faces**).
3. **10 Active `F-CN` Faces vs `faces_per_sex = 24`:**
   - Because `F-CN` currently has `10` active faces while `24 / 2 = 12` target half, `sessions.py` now takes all `10` available `F-CN` faces and tops up the remaining `14` female slots from `F-ME` (so every participant still completes 24 female faces / 32 pairs cleanly).
   - Once 2+ more `F-CN` composite faces are added, `sessions.py` automatically reverts to an exact `12 + 12` split.

---

## 2. `more dataset/雅克` (105 Raw Camera Photos — Pending Metadata)
These 105 files (`DSC_0304.JPG`–`DSC_9405.JPG`, `6192 × 4128` DSLR originals) were **not** auto-merged into the live study set because doing so without verified sex labels or complete 3-angle captures would corrupt the scientific dataset.

### Exact Audit by EXIF Timestamp (`DateTimeOriginal`, ≤ 180s window)
Grouping the 105 photos by capture timestamp identifies **37 subjects**:
- **31 complete subjects** (3 angles each = 93 photos)
- **6 incomplete subjects** (only 2 photos present instead of 3 = 12 photos):
  1. `DSC_0813.JPG`, `DSC_0816.JPG` (`2026-09-29 14:42`)
  2. `DSC_1672.JPG`, `DSC_1674.JPG` (`2026-10-06 11:05`)
  3. `DSC_2774.JPG`, `DSC_2776.JPG` (`2026-08-06 16:44`)
  4. `DSC_3102.JPG`, `DSC_3106.JPG` (`2026-10-16 16:57`)
  5. `DSC_3381.JPG`, `DSC_3383.JPG` (`2026-10-19 15:26`)
  6. `DSC_8970.JPG`, `DSC_8972.JPG` (`2026-09-15 16:00`)

### Exact Overlap Check with Existing v1 Images
Cross-checking against `assets/images/chinese_female` and `assets/images/chinese_male` confirmed at least 2 exact matches (`DSC_6185.JPG` = `chinese_female/6.jpg`, `DSC_2288.JPG` = `chinese_male/10.jpg`), while the remaining ~35 subjects appear to be additional unlabelled Chinese volunteers.

### What Is Needed Before Adding `雅克` Photos
1. Confirm the **sex (`F` / `M`)** of each of the 31 complete 3-angle subjects (do not rely on automated face-gender guesses in a research study).
2. Confirm how to handle the **6 incomplete 2-angle subjects** (recommended: exclude from the 3-angle study, or locate the missing 3rd camera shot).
3. Once labeled, stitch each complete 3-photo triplet into `pic for test` as `<num>Fchinese.jpg` / `<num>Mchinese.jpg` and re-run `python tools/prepare_faces.py`.

