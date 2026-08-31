import os
import shutil
from PIL import Image, ImageOps

base_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(base_dir)

categories = [
    {
        'src': os.path.join(parent_dir, 'fortest', 'girls'),
        'dst': os.path.join(base_dir, 'assets', 'images', 'arab_female'),
        'id': 'arab_female',
        'title': 'Arab Females'
    },
    {
        'src': os.path.join(parent_dir, 'fortest', 'boys'),
        'dst': os.path.join(base_dir, 'assets', 'images', 'arab_male'),
        'id': 'arab_male',
        'title': 'Arab Males'
    },
    {
        'src': os.path.join(parent_dir, 'New folder (2)', 'boys'),
        'dst': os.path.join(base_dir, 'assets', 'images', 'chinese_male'),
        'id': 'chinese_male',
        'title': 'Chinese Males'
    },
    {
        'src': os.path.join(parent_dir, 'New folder (2)', 'girls'),
        'dst': os.path.join(base_dir, 'assets', 'images', 'chinese_female'),
        'id': 'chinese_female',
        'title': 'Chinese Females'
    }
]

valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
counts = {}

for cat in categories:
    # Clear dst folder if exists
    if os.path.exists(cat['dst']):
        shutil.rmtree(cat['dst'])
    os.makedirs(cat['dst'], exist_ok=True)
    
    # Get all unique files in source directory
    all_files = os.listdir(cat['src'])
    files = [
        f for f in all_files
        if os.path.splitext(f.lower())[1] in valid_exts and os.path.isfile(os.path.join(cat['src'], f))
    ]
    
    files.sort()
    count = len(files)
    counts[cat['id']] = count
    print(f"Processing {cat['title']}: {count} unique images...")

    for i, filename in enumerate(files, start=1):
        file_path = os.path.join(cat['src'], filename)
        try:
            with Image.open(file_path) as img:
                img = ImageOps.exif_transpose(img)
                img = img.convert('RGB')
                # Resize keeping aspect ratio, max 1200px
                img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                
                out_path = os.path.join(cat['dst'], f"{i}.jpg")
                img.save(out_path, 'JPEG', quality=88, optimize=True)
        except Exception as e:
            print(f"Error on {file_path}: {e}")

print("\nSuccessfully organized and optimized images:")
for cat_id, cnt in counts.items():
    print(f" - {cat_id}: {cnt} images (1.jpg to {cnt}.jpg)")
