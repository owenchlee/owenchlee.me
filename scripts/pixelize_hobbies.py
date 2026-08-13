"""Converts the raw hobby photos under src/assets/Hobbies/ into small,
palette-quantized pixel-art PNGs under src/assets/Hobbies/pixel/.

Every output is resized to the same fixed height (TARGET_H) with width
scaled to preserve each source photo's own aspect ratio, so the browser's
`image-rendering: pixelated` upscale (see .hobby-item-thumb in App.css)
lands on the same pixel-block size for every hobby, and each shelf item's
width is driven purely by CSS `height: <fixed>; width: auto` on the <img>
rather than being force-cropped square.

Run with: py -3 scripts/pixelize_hobbies.py
"""

import os
from PIL import Image

SRC_DIR = os.path.join('src', 'assets', 'Hobbies')
OUT_DIR = os.path.join(SRC_DIR, 'pixel')
TARGET_H = 20
PALETTE_COLORS = 32

# Only the files that have a matching HOBBIES entry in content.js —
# Music.png (Spotify logo) currently has no matching entry, so it's left
# unprocessed.
FILES = {
    'Basketball.webp': 'basketball.png',
    'Badmintion.webp': 'badminton.png',
    'Board Games.jpg': 'board-games.png',
    'Cooking.jpg': 'cooking.png',
    'Gaming.jpg': 'gaming.png',
    'Running.png': 'running.png',
    'Workout.jpg': 'workout.png',
    'Singing.png': 'singing.png',
}

os.makedirs(OUT_DIR, exist_ok=True)

for src_name, out_name in FILES.items():
    path = os.path.join(SRC_DIR, src_name)
    img = Image.open(path).convert('RGB')
    w, h = img.size
    target_w = max(1, round(w / h * TARGET_H))
    small = img.resize((target_w, TARGET_H), Image.LANCZOS)
    quantized = small.quantize(colors=PALETTE_COLORS, method=Image.MEDIANCUT).convert('RGB')
    out_path = os.path.join(OUT_DIR, out_name)
    quantized.save(out_path)
    print(f'{out_name}: {quantized.size[0]}x{quantized.size[1]}')
