import os
import shutil
import re
from PIL import Image, ImageOps

base_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(base_dir)

categories = [
    {
        'src': os.path.join(parent_dir, 'New folder (2)', 'girls'),
        'dst': os.path.join(base_dir, 'assets', 'images', 'arab_female'),
        'id': 'arab_female',
        'title': 'Arab Females',
        'aspectRatioType': 'portrait'
    },
    {
        'src': os.path.join(parent_dir, 'New folder (2)', 'boys'),
        'dst': os.path.join(base_dir, 'assets', 'images', 'arab_male'),
        'id': 'arab_male',
        'title': 'Arab Males',
        'aspectRatioType': 'portrait'
    },
    {
        'src': os.path.join(parent_dir, 'fortest', 'boys'),
        'dst': os.path.join(base_dir, 'assets', 'images', 'chinese_male'),
        'id': 'chinese_male',
        'title': 'Chinese Males',
        'aspectRatioType': 'landscape'
    },
    {
        'src': os.path.join(parent_dir, 'fortest', 'girls'),
        'dst': os.path.join(base_dir, 'assets', 'images', 'chinese_female'),
        'id': 'chinese_female',
        'title': 'Chinese Females',
        'aspectRatioType': 'landscape'
    }
]

valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
counts = {}
aspect_ratios = {}

for cat in categories:
    if os.path.exists(cat['dst']):
        shutil.rmtree(cat['dst'])
    os.makedirs(cat['dst'], exist_ok=True)
    
    if not os.path.exists(cat['src']):
        print(f"Warning: Source folder {cat['src']} does not exist.")
        counts[cat['id']] = 0
        continue

    all_files = os.listdir(cat['src'])
    files = [
        f for f in all_files
        if os.path.splitext(f.lower())[1] in valid_exts and os.path.isfile(os.path.join(cat['src'], f))
    ]
    
    # Sort files naturally
    try:
        files.sort(key=lambda x: [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', x)])
    except Exception:
        files.sort()

    count = len(files)
    counts[cat['id']] = count
    aspect_ratios[cat['id']] = cat['aspectRatioType']
    print(f"Processing {cat['title']} from '{os.path.basename(os.path.dirname(cat['src']))}/{os.path.basename(cat['src'])}': {count} unique images...")

    for i, filename in enumerate(files, start=1):
        file_path = os.path.join(cat['src'], filename)
        try:
            with Image.open(file_path) as img:
                img = ImageOps.exif_transpose(img)
                img = img.convert('RGB')
                img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                
                out_path = os.path.join(cat['dst'], f"{i}.jpg")
                img.save(out_path, 'JPEG', quality=88, optimize=True)
        except Exception as e:
            print(f"Error on {file_path}: {e}")

print("\nSuccessfully organized and optimized images:")
for cat_id, cnt in counts.items():
    print(f" - {cat_id}: {cnt} images (1.jpg to {cnt}.jpg) [{aspect_ratios[cat_id]}]")

# Auto-update config.js
config_path = os.path.join(base_dir, 'config.js')
if os.path.exists(config_path):
    with open(config_path, 'r', encoding='utf-8') as f:
        cfg_content = f.read()

    for cat_id, cnt in counts.items():
        pattern_cnt = rf'(id:\s*"{cat_id}"[\s\S]*?totalImages:\s*)\d+'
        cfg_content = re.sub(pattern_cnt, rf'\g<1>{cnt}', cfg_content)

        pattern_ratio = rf'(id:\s*"{cat_id}"[\s\S]*?aspectRatioType:\s*)"[^"]+"'
        cfg_content = re.sub(pattern_ratio, rf'\g<1>"{aspect_ratios[cat_id]}"', cfg_content)

    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(cfg_content)
    print("Updated config.js with accurate image counts and aspect ratios automatically!")
