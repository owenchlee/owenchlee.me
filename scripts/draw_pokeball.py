"""Draws a small original pixel-art pokeball icon (plain geometric shapes —
red top, white bottom, black band, black/white center button) for the
Pokemon Cards hobby entry, at the same 32px target height as the sprites
pixelize_hobbies.py produces from photos.

Run with: python3 scripts/draw_pokeball.py
"""

import os
import math
from PIL import Image

OUT_PATH = os.path.join('src', 'assets', 'Hobbies', 'pixel', 'pokemon-cards.png')
SIZE = 32
CENTER = (SIZE - 1) / 2
RADIUS = 14
BAND_HALF = 1.5
OUTLINE = 1.2
BUTTON_R = 4
BUTTON_RING = 1.2

RED = (214, 44, 44, 255)
WHITE = (255, 255, 255, 255)
BLACK = (20, 20, 20, 255)
TRANSPARENT = (0, 0, 0, 0)

img = Image.new('RGBA', (SIZE, SIZE), TRANSPARENT)
px = img.load()

for y in range(SIZE):
    for x in range(SIZE):
        dx = x - CENTER
        dy = y - CENTER
        dist = math.hypot(dx, dy)
        if dist > RADIUS:
            continue
        if dist > RADIUS - OUTLINE:
            px[x, y] = BLACK
        elif abs(dy) <= BAND_HALF:
            px[x, y] = BLACK
        elif dist <= BUTTON_R and abs(dy) <= BAND_HALF + BUTTON_R + 1:
            if dist <= BUTTON_R - BUTTON_RING:
                px[x, y] = WHITE
            else:
                px[x, y] = BLACK
        elif dy < 0:
            px[x, y] = RED
        else:
            px[x, y] = WHITE

img.save(OUT_PATH)
print(f'saved {OUT_PATH} ({img.size[0]}x{img.size[1]})')
