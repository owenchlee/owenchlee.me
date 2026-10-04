"""Draws a small original pixel-art pokeball icon (plain geometric shapes —
red top, white bottom, black band, black/white center button) for the
Pokemon Cards hobby entry, at the same 32px target height as the sprites
pixelize_hobbies.py produces from photos.

The outline is derived from the filled disc (any filled pixel with an
empty 4-neighbour), not from a distance threshold, so it's an even,
unbroken 1px line instead of the patchy ring a threshold gives at this
size. Light comes from the top-left: a highlight arc on the red cap and
grey shade on the lower right of the white half.

Run with: py -3 scripts/draw_pokeball.py
"""

import os
import math
from PIL import Image

OUT_PATH = os.path.join('src', 'assets', 'Hobbies', 'pixel', 'pokemon-cards.png')
SIZE = 32
C = (SIZE - 1) / 2  # 15.5: the disc is centred between pixels
RADIUS = 15.2
BAND_HALF = 1.6  # band is 4px tall (rows 14-17)
BUTTON_R = 4.6
BUTTON_INNER_R = 2.9

INK = (24, 20, 28, 255)
RED = (222, 52, 52, 255)
RED_DARK = (166, 30, 40, 255)
RED_LIGHT = (255, 128, 112, 255)
WHITE = (250, 248, 244, 255)
GREY = (196, 192, 200, 255)
BUTTON = (250, 248, 244, 255)
BUTTON_SHADE = (208, 204, 212, 255)
CLEAR = (0, 0, 0, 0)


def inside(x, y):
    return math.hypot(x - C, y - C) <= RADIUS


img = Image.new('RGBA', (SIZE, SIZE), CLEAR)
px = img.load()

for y in range(SIZE):
    for x in range(SIZE):
        if not inside(x, y):
            continue
        dx, dy = x - C, y - C
        d = math.hypot(dx, dy)
        edge = any(not inside(x + ox, y + oy) for ox, oy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        if edge:
            px[x, y] = INK
        elif d <= BUTTON_R:
            if d > BUTTON_INNER_R:
                px[x, y] = INK
            # Button: shaded on its lower right.
            elif dx + dy > 1.5:
                px[x, y] = BUTTON_SHADE
            else:
                px[x, y] = BUTTON
        elif abs(dy) <= BAND_HALF:
            px[x, y] = INK
        elif dy < 0:
            # Red cap: highlight arc toward the top-left, shade along the
            # band and the right rim.
            rim = RADIUS - d
            if rim < 4.2 and dx < -2 and dy < -3 and rim > 2.2:
                px[x, y] = RED_LIGHT
            elif dy > -BAND_HALF - 2.2 or (dx > 0 and rim < 2.2):
                px[x, y] = RED_DARK
            else:
                px[x, y] = RED
        else:
            rim = RADIUS - d
            if (dx > 0 and rim < 2.2) or dy > RADIUS - 3.5:
                px[x, y] = GREY
            else:
                px[x, y] = WHITE

img.save(OUT_PATH)
print(f'saved {OUT_PATH} ({img.size[0]}x{img.size[1]})')
