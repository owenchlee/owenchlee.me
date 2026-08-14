"""Converts the raw hobby photos under src/assets/Hobbies/ into small,
palette-quantized pixel-art PNGs under src/assets/Hobbies/pixel/.

Most of the source photos are studio/product shots on a flat white or black
backdrop, which is what made them read as "a photo sitting on a background"
rather than an item on the shelf. This flood-fills the backdrop from each
corner (tolerant of JPEG noise/gradient via `thresh`) to punch it out to
transparent, crops tight to the remaining subject's bounding box (so a thin
subject like a racket doesn't drag along a huge blank canvas), then resizes
to TARGET_H and quantizes color while preserving the alpha cutout. Photos
that already fill the frame edge-to-edge (Cooking, Board Games) are largely
untouched by the flood fill since there's no uniform region touching a
corner to seed from.

Run with: py -3 scripts/pixelize_hobbies.py
"""

import os
from PIL import Image, ImageDraw
from rembg import remove

SRC_DIR = os.path.join('src', 'assets', 'Hobbies')
OUT_DIR = os.path.join(SRC_DIR, 'pixel')
TARGET_H = 32
PALETTE_COLORS = 40
BG_FLOOD_THRESH = 34
CROP_PADDING = 2

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

# Cooking.jpg's steak sits on a wood cutting board — real grain texture, not
# a flat/uniform color — with a knife and thyme sprig sharing the shot. None
# of that is a uniform region a corner-seeded flood fill can ever cut
# cleanly (see remove_backdrop below): the grain breaks contiguity, so a
# flood fill either leaves board behind or has to eat into the steak's own
# edge to get rid of it. rembg's U^2-Net matting model segments the actual
# subject instead of relying on background uniformity, so it's used here in
# place of remove_backdrop for this one source photo only.
REMBG_FILES = {'Cooking.jpg'}

# Badmintion.webp is a tall portrait product shot (racket head up, handle
# down) — at the shared TARGET_H every other hobby renders at, that shape
# comes out as a narrow sliver a couple pixels wide. Rotating it onto its
# side before the rest of the pipeline runs is what actually fixes that: the
# long axis becomes the shelf-width axis instead of the height one, so it
# reads as an actual object sitting on the shelf rather than a thin line.
ROTATE_CCW_FILES = {'Badmintion.webp'}

os.makedirs(OUT_DIR, exist_ok=True)


def remove_backdrop(img):
    """Flood-fills from each corner into transparency, tolerant of the
    JPEG noise/soft gradients real studio backdrops have."""
    img = img.convert('RGBA')
    w, h = img.size
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for seed in corners:
        ImageDraw.floodfill(img, seed, (0, 0, 0, 0), thresh=BG_FLOOD_THRESH)
    return img


def autocrop(img):
    """Crops tight to the bounding box of whatever the flood fill left
    behind, so a small/thin subject doesn't sit in a big empty canvas."""
    # A couple of sources (Badminton) already ship with an alpha channel
    # that's got scattered near-zero noise well outside the actual subject
    # instead of clean transparency — snap that noise to 0 first so it
    # can't drag the bounding box out into empty space.
    alpha = img.getchannel('A').point(lambda a: 0 if a < 10 else a)
    bbox = alpha.getbbox()
    if bbox is None:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - CROP_PADDING)
    top = max(0, top - CROP_PADDING)
    right = min(img.width, right + CROP_PADDING)
    bottom = min(img.height, bottom + CROP_PADDING)
    return img.crop((left, top, right, bottom))


def boost_alpha(alpha):
    """Some sources (e.g. a strung badminton racket) are naturally mostly
    see-through — real mesh with more gap than string. Downsampled to a
    handful of pixels, that averages out to faint near-invisible noise
    instead of a readable shape. Snapping low alpha to 0 and pushing the
    rest toward opaque trades "physically accurate translucency" for "reads
    as a solid item on a shelf at 32px," which is what this is for."""
    return alpha.point(lambda a: 0 if a < 20 else min(255, round(a * 2.4)))


def resize_and_quantize(img):
    w, h = img.size
    target_w = max(1, round(w / h * TARGET_H))
    small = img.resize((target_w, TARGET_H), Image.LANCZOS)
    alpha = boost_alpha(small.getchannel('A'))
    rgb_quantized = small.convert('RGB').quantize(colors=PALETTE_COLORS, method=Image.MEDIANCUT).convert('RGBA')
    rgb_quantized.putalpha(alpha)
    return rgb_quantized


for src_name, out_name in FILES.items():
    path = os.path.join(SRC_DIR, src_name)
    img = Image.open(path)
    if src_name in ROTATE_CCW_FILES:
        img = img.rotate(90, expand=True)
    if src_name in REMBG_FILES:
        img = remove(img.convert('RGBA'))
    else:
        img = remove_backdrop(img)
    img = autocrop(img)
    out_img = resize_and_quantize(img)
    out_path = os.path.join(OUT_DIR, out_name)
    out_img.save(out_path)
    print(f'{out_name}: {out_img.size[0]}x{out_img.size[1]}')
