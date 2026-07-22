from PIL import Image, ImageDraw
import os

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'char')
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'preview_character.png')

DIRS = ['down', 'up', 'side']
FRAMES = ['idle', 'walk-a', 'walk-b']
SCALE = 12
CELL = 16 * SCALE
PAD = 24
LABEL_H = 22

W = PAD + len(FRAMES) * (CELL + PAD)
H = PAD + LABEL_H + len(DIRS) * (CELL + PAD + LABEL_H)

sheet = Image.new('RGBA', (W, H), (58, 47, 36, 255))
draw = ImageDraw.Draw(sheet)

for ci, frame in enumerate(FRAMES):
    x = PAD + ci * (CELL + PAD)
    draw.text((x, 4), frame, fill=(255, 255, 255, 255))

for ri, d in enumerate(DIRS):
    y = PAD + LABEL_H + ri * (CELL + PAD + LABEL_H)
    draw.text((4, y), d, fill=(255, 255, 255, 255))
    for ci, frame in enumerate(FRAMES):
        x = PAD + ci * (CELL + PAD)
        im = Image.open(os.path.join(ASSETS, f'char-{d}-{frame}.png')).convert('RGBA')
        big = im.resize((im.width * SCALE, im.height * SCALE), Image.NEAREST)
        sheet.paste(big, (x, y + LABEL_H), big)

sheet.save(OUT)
print('saved', OUT)
