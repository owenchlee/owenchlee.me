from PIL import Image
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets')


def new_canvas(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))


def rect(im, x0, y0, x1, y1, color):
    px = im.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            if 0 <= x < im.width and 0 <= y < im.height:
                px[x, y] = color


def triangle_roof(im, cx, top_y, half_width, height, light, dark, seam_dark):
    px = im.load()
    for row in range(height):
        y = top_y + row
        w = int((row + 1) / height * half_width)
        x0, x1 = cx - w, cx + w
        for x in range(x0, x1):
            color = dark if x >= cx else light
            px[x, y] = color
    # ridge seam + eave line for definition
    for row in range(height):
        y = top_y + row
        w = int((row + 1) / height * half_width)
        px[cx, y] = seam_dark
    for x in range(cx - int(half_width), cx + int(half_width)):
        if 0 <= x < im.width:
            px[x, top_y + height - 1] = seam_dark


def wood_floor_tile():
    # Interior floor: horizontal plank stripes with seam lines, so tiling it
    # actually shows a grid/pattern rather than reading as a flat color the
    # way the original single-color path.png did indoors.
    im = new_canvas(16, 16)
    plank_a = (176, 128, 82, 255)
    plank_b = (163, 116, 72, 255)
    seam = (120, 82, 48, 255)
    rect(im, 0, 0, 16, 16, plank_a)
    for y in range(0, 16, 4):
        rect(im, 0, y, 16, y + 4, plank_a if (y // 4) % 2 == 0 else plank_b)
        rect(im, 0, y + 3, 16, y + 4, seam)
    for x in range(0, 16, 7):
        rect(im, x, 0, x + 1, 4, seam)
    for x in range(3, 16, 7):
        rect(im, x, 4, x + 1, 8, seam)
    return im


def stone_floor_tile():
    # A second interior variant (used indoors for the Contact scene) so not
    # every interior looks identical either.
    im = new_canvas(16, 16)
    a = (168, 168, 176, 255)
    b = (150, 150, 160, 255)
    seam = (110, 110, 120, 255)
    rect(im, 0, 0, 16, 16, a)
    rect(im, 0, 0, 8, 8, b)
    rect(im, 8, 8, 16, 16, b)
    rect(im, 0, 7, 16, 9, seam)
    rect(im, 7, 0, 9, 16, seam)
    return im


DIRT = (166, 122, 84, 255)
DIRT_RUT = (140, 100, 68, 255)


def path_straight_tile():
    # Authored as a horizontal (east-west) run; the app rotates this 90deg
    # for vertical runs so only one source image is needed.
    im = new_canvas(16, 16)
    rect(im, 0, 0, 16, 16, DIRT)
    rect(im, 0, 5, 16, 6, DIRT_RUT)
    rect(im, 0, 10, 16, 11, DIRT_RUT)
    return im


def path_corner_tile():
    # Authored connecting North + East (dirt fills the top half and right
    # half, grass everywhere else); the app rotates this for the other 3
    # corner orientations. Built on top of the real grass tile so it blends
    # with the actual ground texture instead of a flat color guess.
    im = Image.open(os.path.join(OUT, 'grass.png')).convert('RGBA').copy()
    px = im.load()
    for y in range(16):
        for x in range(16):
            if y < 8 or x >= 8:
                px[x, y] = DIRT
    return im


def path_edge_tile():
    # Grass tile with dirt bleeding in from the top edge only (a dithered
    # fade, not a hard line) — used on grass tiles that border a path tile
    # to their north; the app rotates this for the other 3 sides.
    im = Image.open(os.path.join(OUT, 'grass.png')).convert('RGBA').copy()
    px = im.load()
    for y in range(3):
        for x in range(16):
            px[x, y] = DIRT
    for x in range(16):
        if x % 2 == 0:
            px[x, 3] = DIRT
    return im


def house_sprite(roof_light, roof_dark, wall_light, wall_dark, roof_flat=False):
    W, H = 24, 26
    im = new_canvas(W, H)
    seam = tuple(max(c - 60, 0) for c in roof_dark[:3]) + (255,)

    if roof_flat:
        rect(im, 2, 4, W - 2, 11, roof_dark)
        rect(im, 2, 4, W - 2, 6, roof_light)
        rect(im, 2, 9, W - 2, 11, seam)
    else:
        triangle_roof(im, W // 2, 0, 11, 10, roof_light, roof_dark, seam)
        rect(im, 2, 9, W - 2, 11, roof_dark)
        rect(im, 2, 9, W - 2, 10, roof_light)

    wall_top = 11
    rect(im, 3, wall_top, W - 3, H - 1, wall_dark)
    rect(im, 3, wall_top, (W // 2) - 1, H - 1, wall_light)

    wood = (63, 43, 0, 255)
    rect(im, (W // 2) - 3, H - 8, (W // 2) + 3, H - 1, wood)
    rect(im, (W // 2) - 2, H - 7, (W // 2) + 2, H - 1, (90, 60, 30, 255))

    glass = (158, 220, 232, 255)
    frame = (63, 43, 0, 255)
    for wx in (6, W - 10):
        rect(im, wx - 1, 14, wx + 5, 20, frame)
        rect(im, wx, 15, wx + 4, 19, glass)

    return im


def shop_sprite(awning_a, awning_b, wall, door):
    # A storefront — flat striped awning + big display window, no roof
    # triangle at all, so it reads as a genuinely different building type
    # from the house/lab silhouette rather than a recolor of it.
    W, H = 30, 26
    im = new_canvas(W, H)

    stripe_w = 4
    x = 1
    i = 0
    while x < W - 1:
        color = awning_a if i % 2 == 0 else awning_b
        rect(im, x, 3, min(x + stripe_w, W - 1), 10, color)
        x += stripe_w
        i += 1
    rect(im, 1, 10, W - 1, 12, (55, 40, 28, 255))

    rect(im, 2, 12, W - 2, H - 1, wall)
    rect(im, 4, 14, W - 13, H - 3, (150, 205, 220, 255))
    rect(im, 3, 13, W - 12, 15, (55, 40, 28, 255))
    rect(im, W - 10, 15, W - 3, H - 1, door)
    return im


def tower_sprite(roof_light, roof_dark, wall_light, wall_dark):
    # Tall and narrow with a steep peaked roof and a single round window —
    # a lookout/watchtower silhouette, distinct from both the cottage and
    # the storefront.
    W, H = 18, 32
    im = new_canvas(W, H)
    seam = tuple(max(c - 60, 0) for c in roof_dark[:3]) + (255,)

    triangle_roof(im, W // 2, 0, 8, 12, roof_light, roof_dark, seam)
    rect(im, 1, 11, W - 1, 13, roof_dark)

    rect(im, 3, 13, W - 3, H - 1, wall_dark)
    rect(im, 3, 13, (W // 2) - 1, H - 1, wall_light)

    frame = (63, 43, 0, 255)
    glass = (158, 220, 232, 255)
    ellipse_blob(im, W // 2, 19, 4, 4, frame)
    ellipse_blob(im, W // 2, 19, 3, 3, glass)

    wood = (63, 43, 0, 255)
    rect(im, (W // 2) - 3, H - 8, (W // 2) + 3, H - 1, wood)
    return im


def npc_sprite(hair, skin, shirt_light, shirt_dark):
    W, H = 16, 16
    im = new_canvas(W, H)
    rect(im, 5, 0, 11, 3, hair)
    rect(im, 4, 2, 5, 3, hair)
    rect(im, 11, 2, 12, 3, hair)
    rect(im, 5, 3, 11, 8, skin)
    px = im.load()
    px[6, 5] = (26, 26, 26, 255)
    px[9, 5] = (26, 26, 26, 255)
    rect(im, 6, 8, 10, 9, skin)
    rect(im, 4, 9, 12, 15, shirt_dark)
    rect(im, 4, 9, 8, 15, shirt_light)
    rect(im, 4, 14, 7, 16, (40, 30, 20, 255))
    rect(im, 9, 14, 12, 16, (40, 30, 20, 255))
    return im


def ellipse_blob(im, cx, cy, rx, ry, color):
    px = im.load()
    for y in range(cy - ry, cy + ry + 1):
        dy = (y - cy) / ry
        if abs(dy) > 1:
            continue
        span = rx * (1 - dy * dy) ** 0.5
        for x in range(int(cx - span), int(cx + span) + 1):
            if 0 <= x < im.width and 0 <= y < im.height:
                px[x, y] = color


def rat_sprite():
    W, H = 16, 12
    im = new_canvas(W, H)
    body = (150, 120, 95, 255)
    shade = (115, 90, 70, 255)
    ear = (198, 150, 140, 255)
    dark = (40, 30, 25, 255)

    # tail, drawn first so the body overlaps its base
    rect(im, 0, 6, 4, 7, shade)
    rect(im, 1, 5, 3, 6, shade)

    ellipse_blob(im, 8, 7, 5, 3, body)
    ellipse_blob(im, 8, 8, 5, 2, shade)
    ellipse_blob(im, 12, 5, 3, 3, body)

    rect(im, 12, 1, 14, 3, body)
    rect(im, 13, 2, 14, 3, ear)

    px = im.load()
    px[14, 4] = dark
    px[14, 5] = dark

    rect(im, 6, 10, 8, 11, dark)
    rect(im, 10, 10, 12, 11, dark)
    return im


def bird_sprite():
    W, H = 12, 12
    im = new_canvas(W, H)
    body = (196, 168, 120, 255)
    wing = (150, 122, 82, 255)
    beak = (222, 156, 60, 255)
    dark = (40, 30, 25, 255)

    ellipse_blob(im, 5, 6, 4, 3, body)
    ellipse_blob(im, 8, 4, 2, 2, body)
    ellipse_blob(im, 4, 6, 2, 2, wing)

    px = im.load()
    px[6, 4] = dark
    rect(im, 10, 4, 12, 5, beak)

    rect(im, 4, 9, 5, 10, dark)
    rect(im, 6, 9, 7, 10, dark)
    return im


def dog_sprite(fur, fur_dark, ear):
    # A small trotting dog for the "someone walking a pet" vignette — same
    # ellipse-blob construction as rat/bird above, just bigger and with a
    # raised head/snout so it silhouettes as a dog rather than another
    # rodent.
    W, H = 16, 13
    im = new_canvas(W, H)
    dark = (40, 30, 25, 255)

    rect(im, 0, 5, 2, 7, fur_dark)  # tail
    ellipse_blob(im, 8, 7, 6, 3, fur)
    ellipse_blob(im, 8, 8, 6, 2, fur_dark)
    ellipse_blob(im, 13, 4, 3, 3, fur)  # head
    rect(im, 12, 1, 14, 4, ear)
    rect(im, 15, 4, 16, 5, dark)  # snout tip

    px = im.load()
    px[14, 3] = dark

    rect(im, 4, 10, 6, 13, fur_dark)
    rect(im, 10, 10, 12, 13, fur_dark)
    return im


def ball_sprite():
    # Small striped ball, tossed back and forth via CSS animation in the
    # sports vignette (see .sports-ball in App.css) rather than drawn as a
    # walk cycle.
    W, H = 10, 10
    im = new_canvas(W, H)
    outline = (60, 55, 50, 255)
    base = (238, 232, 214, 255)
    stripe = (198, 62, 52, 255)
    ellipse_blob(im, 5, 5, 5, 5, outline)
    ellipse_blob(im, 5, 5, 4, 4, base)
    rect(im, 4, 1, 6, 9, stripe)
    return im


def picnic_scene_sprite():
    # A checkered blanket + basket, static ground decoration the two seated
    # npc_sitting_sprite() figures (placed by the app, not baked into this
    # image) sit on top of.
    W, H = 40, 24
    im = new_canvas(W, H)
    red = (196, 64, 58, 255)
    cream = (240, 224, 196, 255)
    cell = 5
    blanket_h = H - 6
    for gy in range(0, blanket_h, cell):
        for gx in range(0, W, cell):
            color = red if ((gx // cell) + (gy // cell)) % 2 == 0 else cream
            rect(im, gx, gy, min(gx + cell, W), min(gy + cell, blanket_h), color)
    seam = (150, 46, 40, 255)
    rect(im, 0, blanket_h - 1, W, blanket_h, seam)

    basket = (150, 100, 56, 255)
    basket_dark = (110, 70, 38, 255)
    handle = (90, 58, 30, 255)
    rect(im, W - 13, H - 9, W - 2, H - 1, basket)
    rect(im, W - 13, H - 9, W - 2, H - 6, basket_dark)
    rect(im, W - 10, H - 12, W - 5, H - 9, handle)
    return im


def npc_sitting_sprite(hair, skin, shirt_light, shirt_dark):
    # Same head/torso construction as npc_sprite (see above), but legs
    # replaced with a shorter, cross-legged seated silhouette so a
    # background figure can read as sitting on the picnic blanket instead
    # of standing on top of it.
    im = new_canvas(16, 14)
    rect(im, 5, 0, 11, 3, hair)
    rect(im, 4, 2, 5, 3, hair)
    rect(im, 11, 2, 12, 3, hair)
    rect(im, 5, 3, 11, 8, skin)
    px = im.load()
    px[6, 5] = (26, 26, 26, 255)
    px[9, 5] = (26, 26, 26, 255)
    rect(im, 6, 8, 10, 9, skin)
    rect(im, 3, 9, 13, 13, shirt_dark)
    rect(im, 3, 9, 8, 13, shirt_light)
    rect(im, 2, 11, 6, 13, shirt_dark)
    rect(im, 10, 11, 14, 13, shirt_dark)
    return im


# Tuned to Owen's actual reference photo: near-black hair, warm-tan skin,
# dark eyes, and a black hoodie rather than the red/gold shirts tried
# earlier — those read as arbitrary recolors of a background NPC instead of
# the actual person the site is about.
HAIR = (26, 24, 28, 255)
SKIN = (241, 197, 155, 255)
EYE = (26, 26, 26, 255)
SHIRT_L = (46, 46, 52, 255)
SHIRT_D = (24, 24, 29, 255)
SHOE = (52, 50, 58, 255)


def _torso_and_arms(im, arm_l_dy, arm_r_dy):
    # Torso: two-tone fill (light stage-left, dark stage-right), rows 8-13.
    # Widened a couple px each side vs the original cut for a broader,
    # square-shouldered build.
    rect(im, 3, 8, 13, 14, SHIRT_D)
    rect(im, 3, 8, 8, 14, SHIRT_L)
    # Blocky arms attached right at the shoulder line (row 9), each offset
    # independently per frame so a walk cycle can swing them.
    rect(im, 0, 9 + arm_l_dy, 3, 13 + arm_l_dy, SKIN)
    rect(im, 13, 9 + arm_r_dy, 16, 13 + arm_r_dy, SKIN)


def _legs(im, stride):
    # stride: 0 = idle (feet together), 1 = left foot forward, -1 = right
    # foot forward. Forward foot drawn lower/longer, back foot shorter.
    l0, l1 = (14, 16) if stride >= 0 else (14, 15)
    r0, r1 = (14, 16) if stride <= 0 else (14, 15)
    rect(im, 5, l0, 8, l1, SHOE)
    rect(im, 9, r0, 12, r1, SHOE)


def character_down(frame):
    im = new_canvas(16, 16)
    stride = {'idle': 0, 'walk-a': 1, 'walk-b': -1}[frame]
    arm = {'idle': (0, 0), 'walk-a': (1, -1), 'walk-b': (-1, 1)}[frame]

    # Head: a fuller, wider crop (not the narrow tapered-crown template
    # shared with background NPCs) matching Owen's actual dark, fairly full
    # hair — flat-topped with hair coming down past the ears on both sides,
    # so there's real hair silhouette instead of a thin cap.
    rect(im, 3, 0, 13, 2, HAIR)
    rect(im, 2, 1, 14, 4, HAIR)
    rect(im, 2, 4, 4, 6, HAIR)
    rect(im, 12, 4, 14, 6, HAIR)
    rect(im, 4, 3, 12, 7, SKIN)
    px = im.load()
    px[6, 4] = HAIR
    px[9, 4] = HAIR
    px[6, 5] = EYE
    px[9, 5] = EYE
    rect(im, 6, 7, 10, 8, SKIN)

    _torso_and_arms(im, *arm)
    _legs(im, stride)
    return im


def character_up(frame):
    im = new_canvas(16, 16)
    stride = {'idle': 0, 'walk-a': 1, 'walk-b': -1}[frame]
    arm = {'idle': (0, 0), 'walk-a': (1, -1), 'walk-b': (-1, 1)}[frame]

    # Back of the head: fully hair, no face. Matches the wider/fuller cut
    # used from the front.
    rect(im, 2, 0, 14, 7, HAIR)
    rect(im, 4, 5, 12, 7, (18, 16, 20, 255))
    rect(im, 6, 7, 10, 8, SKIN)

    _torso_and_arms(im, *arm)
    _legs(im, stride)
    return im


def character_side(frame):
    im = new_canvas(16, 16)
    stride = {'idle': 0, 'walk-a': 1, 'walk-b': -1}[frame]
    # Absolute left-edge x per frame (not a small delta) so all three swing
    # positions stay clearly outside/distinct from the torso silhouette
    # instead of a "backward" swing just landing back inside the torso's
    # own rect and visually vanishing into it.
    arm_x = {'idle': 10, 'walk-a': 12, 'walk-b': 6}[frame]

    # Profile facing right: hair covers the top + back (left side of the
    # head), face/skin is the front (right side), one eye + eyebrow visible.
    rect(im, 4, 0, 12, 2, HAIR)
    rect(im, 3, 1, 12, 3, HAIR)
    rect(im, 3, 2, 7, 7, HAIR)
    rect(im, 7, 3, 12, 7, SKIN)
    px = im.load()
    px[10, 4] = HAIR
    px[10, 5] = EYE
    rect(im, 6, 7, 10, 8, SKIN)

    # Broadened to match the front/back torso width.
    rect(im, 3, 8, 13, 14, SHIRT_D)
    rect(im, 3, 8, 13, 11, SHIRT_L)
    # Single visible (front) arm, swings fore/aft with the stride.
    rect(im, arm_x, 9, arm_x + 4, 13, SKIN)

    _legs(im, stride)
    return im


CHARACTER_DIRS = {'down': character_down, 'up': character_up, 'side': character_side}
CHARACTER_FRAMES = ['idle', 'walk-a', 'walk-b']


if __name__ == '__main__':
    wood_floor_tile().save(os.path.join(OUT, 'floor-wood.png'))
    stone_floor_tile().save(os.path.join(OUT, 'floor-stone.png'))

    path_straight_tile().save(os.path.join(OUT, 'path-straight.png'))
    path_corner_tile().save(os.path.join(OUT, 'path-corner.png'))
    path_edge_tile().save(os.path.join(OUT, 'path-edge.png'))

    house_sprite((242, 148, 120, 255), (200, 100, 75, 255), (245, 224, 196, 255), (222, 196, 160, 255)).save(
        os.path.join(OUT, 'house-intro.png'))
    house_sprite((214, 100, 92, 255), (170, 65, 60, 255), (245, 224, 196, 255), (222, 196, 160, 255)).save(
        os.path.join(OUT, 'house-contact.png'))
    house_sprite((140, 170, 196, 255), (91, 122, 148, 255), (232, 235, 238, 255), (206, 212, 219, 255), roof_flat=True).save(
        os.path.join(OUT, 'house-lab.png'))

    # Decoration-only palette variants — same generator, just more colors, so
    # the town has houses that are scenery rather than section checkpoints.
    house_sprite((230, 196, 120, 255), (194, 160, 90, 255), (245, 224, 196, 255), (222, 196, 160, 255)).save(
        os.path.join(OUT, 'house-decor-tan.png'))
    house_sprite((150, 196, 160, 255), (105, 158, 122, 255), (232, 235, 238, 255), (206, 212, 219, 255)).save(
        os.path.join(OUT, 'house-decor-teal.png'))
    house_sprite((196, 150, 180, 255), (158, 105, 140, 255), (245, 224, 196, 255), (222, 196, 160, 255), roof_flat=True).save(
        os.path.join(OUT, 'house-decor-plum.png'))
    house_sprite((176, 176, 184, 255), (130, 130, 140, 255), (232, 235, 238, 255), (206, 212, 219, 255)).save(
        os.path.join(OUT, 'house-decor-stone.png'))

    # New building types — genuinely different silhouettes, not recolors of
    # the cottage: a storefront and a watchtower.
    shop_sprite((214, 100, 92, 255), (245, 224, 196, 255), (232, 235, 238, 255), (140, 90, 50, 255)).save(
        os.path.join(OUT, 'house-decor-shop.png'))
    shop_sprite((91, 122, 148, 255), (245, 224, 196, 255), (245, 224, 196, 255), (63, 43, 0, 255)).save(
        os.path.join(OUT, 'house-decor-shop-blue.png'))
    tower_sprite((196, 176, 140, 255), (158, 138, 105, 255), (232, 235, 238, 255), (206, 212, 219, 255)).save(
        os.path.join(OUT, 'house-decor-tower.png'))

    # Hobbies checkpoint building: a clubhouse (same storefront generator,
    # cheerful colors) instead of the old plant-cluster landmark.
    shop_sprite((77, 163, 56, 255), (240, 211, 90, 255), (245, 224, 196, 255), (52, 122, 40, 255)).save(
        os.path.join(OUT, 'house-hobbies.png'))

    npc_sprite((63, 43, 0, 255), (250, 227, 159, 255), (214, 100, 92, 255), (170, 65, 60, 255)).save(
        os.path.join(OUT, 'npc-a.png'))
    npc_sprite((90, 60, 30, 255), (232, 194, 150, 255), (91, 122, 148, 255), (66, 92, 112, 255)).save(
        os.path.join(OUT, 'npc-b.png'))
    npc_sprite((30, 24, 20, 255), (208, 168, 128, 255), (77, 163, 56, 255), (52, 122, 40, 255)).save(
        os.path.join(OUT, 'npc-c.png'))

    rat_sprite().save(os.path.join(OUT, 'critter-rat.png'))
    bird_sprite().save(os.path.join(OUT, 'critter-bird.png'))

    dog_sprite((196, 150, 96, 255), (162, 116, 66, 255), (120, 80, 44, 255)).save(
        os.path.join(OUT, 'pet-dog-a.png'))
    dog_sprite((90, 88, 92, 255), (60, 58, 62, 255), (40, 38, 42, 255)).save(
        os.path.join(OUT, 'pet-dog-b.png'))
    ball_sprite().save(os.path.join(OUT, 'sports-ball.png'))
    picnic_scene_sprite().save(os.path.join(OUT, 'picnic-scene.png'))

    npc_sitting_sprite((63, 43, 0, 255), (250, 227, 159, 255), (214, 100, 92, 255), (170, 65, 60, 255)).save(
        os.path.join(OUT, 'npc-sit-a.png'))
    npc_sitting_sprite((90, 60, 30, 255), (232, 194, 150, 255), (91, 122, 148, 255), (66, 92, 112, 255)).save(
        os.path.join(OUT, 'npc-sit-b.png'))

    char_dir = os.path.join(OUT, 'char')
    os.makedirs(char_dir, exist_ok=True)
    for dname, fn in CHARACTER_DIRS.items():
        for frame in CHARACTER_FRAMES:
            fn(frame).save(os.path.join(char_dir, f'char-{dname}-{frame}.png'))

    print('done')
