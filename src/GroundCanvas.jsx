import { useEffect, useRef } from 'react';
import { TILE_SIZE, COLS, ROWS, WORLD_W, WORLD_H, TILE_GRID, BAKED_TREES, WALKABLE, hash } from './tileMap';
import pavementUrl from './assets/pavement.png';
import grassUrl from './assets/grass.png';
import dirtUrl from './assets/dirt-lpc.png';
import dirtEdgeUrl from './assets/dirt-edge-lpc.png';
import waterUrl from './assets/water-lpc.png';
import plantUrl from './assets/plant.png';
import treeRoundUrl from './assets/tree-round-lpc.png';
import treePineUrl from './assets/tree-pine-lpc.png';

// The whole static ground — every grass/path/flower/water tile plus the
// thousands of trees that don't need live depth sorting (BAKED_TREES, see
// tileMap.js) — painted once into a single canvas when the page loads.
//
// This used to be ~10,600 individual tile <div>s plus ~3,800 tree <img>s,
// and panning that many nodes under the camera cost far more than a frame
// budget: measured in headless Chrome, the walk ran at ~9fps, and because
// each frame's step is time-based that read as the character crawling. One
// pre-painted bitmap that the camera just translates is effectively free
// to move. Water keeps its shimmer via a handful of live tiles App.jsx
// renders on top (see WATER_TILES there); this canvas only paints their
// still base so nothing flashes while those load.

// Rendered tree width — matches .tree in App.css (height follows the
// sprite's own aspect ratio, same as height:auto there).
const TREE_W = 56;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// CSS filter functions as 3x3 color matrices, straight from the Filter
// Effects spec, so the pre-tinted grass variants below match the
// hue-rotate()/brightness()/saturate() filters the DOM tiles used exactly.
function hueRotateMatrix(deg) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
  ];
}

function saturateMatrix(v) {
  return [
    0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v,
    0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v,
    0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v,
  ];
}

function brightnessMatrix(v) {
  return [v, 0, 0, 0, v, 0, 0, 0, v];
}

// Applies each matrix in turn (clamping between steps, as chained CSS
// filters do) to a copy of `img`.
function tinted(img, matrices) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i];
    let g = px[i + 1];
    let b = px[i + 2];
    matrices.forEach((m) => {
      const nr = m[0] * r + m[1] * g + m[2] * b;
      const ng = m[3] * r + m[4] * g + m[5] * b;
      const nb = m[6] * r + m[7] * g + m[8] * b;
      r = Math.min(255, Math.max(0, nr));
      g = Math.min(255, Math.max(0, ng));
      b = Math.min(255, Math.max(0, nb));
    });
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

const EDGE_ROTATION = {
  'path-edge-n': 0,
  'path-edge-e': Math.PI / 2,
  'path-edge-s': Math.PI,
  'path-edge-w': (3 * Math.PI) / 2,
};

// Which neighbour an edge tile's path lies toward.
const EDGE_DIR = {
  'path-edge-n': [0, -1],
  'path-edge-e': [1, 0],
  'path-edge-s': [0, 1],
  'path-edge-w': [-1, 0],
};

const isWalkable = (c, r) => WALKABLE.has(`${c},${r}`);
const isPathType = (c, r) => {
  const type = TILE_GRID[r]?.[c];
  return !!type && type.startsWith('path') && !type.startsWith('path-edge');
};

// Pavement is bordered by a dark curb wherever it meets grass, so the
// walkable route reads as a built road; where a dirt spur branches off it
// stays open so the spur still visibly joins the road.
const CURB = '#5a5246';
const CURB_LIGHT = '#e6dfcd';

function drawCurbs(ctx) {
  const T = TILE_SIZE;
  WALKABLE.forEach((key) => {
    const [c, r] = key.split(',').map(Number);
    const x = c * T;
    const y = r * T;
    const open = (dc, dr) => isWalkable(c + dc, r + dr) || isPathType(c + dc, r + dr);
    if (!open(0, -1)) {
      ctx.fillStyle = CURB;
      ctx.fillRect(x, y, T, 3);
      ctx.fillStyle = CURB_LIGHT;
      ctx.fillRect(x, y + 3, T, 2);
    }
    if (!open(0, 1)) {
      ctx.fillStyle = CURB;
      ctx.fillRect(x, y + T - 4, T, 4);
    }
    if (!open(-1, 0)) {
      ctx.fillStyle = CURB;
      ctx.fillRect(x, y, 3, T);
      ctx.fillStyle = CURB_LIGHT;
      ctx.fillRect(x + 3, y, 2, T);
    }
    if (!open(1, 0)) {
      ctx.fillStyle = CURB;
      ctx.fillRect(x + T - 3, y, 3, T);
    }
  });
}

// --- Forest past the map edge ---
// Beyond the world map the treeline carries on forever: an endless
// FOREST_PERIOD-tile square of forest floor + trees, tiled as the
// background of .forest-backdrop. That element sits inside .world, so it
// pans with the camera exactly like the map does, and its pattern is
// phase-locked to the world's tile grid (FOREST_OFFSET is a whole number
// of periods), so a tree out there sits on the same 32px grid as the
// border trees inside the map.
const FOREST_PERIOD = 16;
const FOREST_DENSITY = 0.9; // same fill as BORDER_TREE_DENSITY in tileMap.js
const FOREST_OFFSET = FOREST_PERIOD * TILE_SIZE * 6;
// The ground canvas also paints this many tiles of that same forest past
// each map edge, so canopies along the edge aren't sliced off by the
// canvas boundary and the hand-off into the backdrop is pixel-identical.
const PAD = 3;
const PAD_PX = PAD * TILE_SIZE;

const wrap = (n) => ((n % FOREST_PERIOD) + FOREST_PERIOD) % FOREST_PERIOD;

// Forest tree at any (unbounded) tile, periodic so the backdrop tiles.
function forestTreeAt(c, r) {
  const wc = wrap(c);
  const wr = wrap(r);
  if (hash(wc + 1000, wr + 1000) >= FOREST_DENSITY) return null;
  return { col: c, row: r, variant: hash(wc + 1500, wr + 1500) < 0.5 ? 'round' : 'pine' };
}

// Trees for every tile in the given (inclusive) range, skipping the map.
function forestTrees(c0, c1, r0, r1, skipMap) {
  const out = [];
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (skipMap && c >= 0 && c < COLS && r >= 0 && r < ROWS) continue;
      const tree = forestTreeAt(c, r);
      if (tree) out.push(tree);
    }
  }
  return out;
}

// Back-to-front (north to south) so nearer canopies overlap farther
// ones, same painter's order the live trees get from their z-index.
function drawTrees(ctx, img, trees) {
  const T = TILE_SIZE;
  [...trees]
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .forEach((tree) => {
      const sprite = tree.variant === 'pine' ? img.treePine : img.treeRound;
      const h = (TREE_W * sprite.naturalHeight) / sprite.naturalWidth;
      const cx = tree.col * T + T / 2;
      const groundY = tree.row * T + T;
      ctx.drawImage(sprite, cx - TREE_W / 2, groundY - h, TREE_W, h);
    });
}

// Tree sprites stand ~2.6 tiles tall and overhang their tile ~12px a
// side, so trees up to this many rows below / one column beside a region
// can still reach into it.
const TREE_REACH_ROWS = 3;

function paintForestTile(img, forestFloor) {
  const T = TILE_SIZE;
  const size = FOREST_PERIOD * T;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let r = 0; r < FOREST_PERIOD; r++) {
    for (let c = 0; c < FOREST_PERIOD; c++) ctx.drawImage(forestFloor, c * T, r * T, T, T);
  }
  // Include the wrapped neighbours so canopies crossing the tile's edges
  // continue on the opposite side — that's what makes it seamless.
  drawTrees(ctx, img, forestTrees(-1, FOREST_PERIOD, -1, FOREST_PERIOD + TREE_REACH_ROWS, false));
  return canvas;
}

function paintGround(ctx, img, grassVariants) {
  const T = TILE_SIZE;
  // Flower sprite at 55% of the tile, centered over grass.
  const plantSize = T * 0.55;

  // Forest floor under the padding ring around the map.
  for (let r = -PAD; r < ROWS + PAD; r++) {
    for (let c = -PAD; c < COLS + PAD; c++) {
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS) continue;
      ctx.drawImage(grassVariants.forest, c * T, r * T, T, T);
    }
  }

  TILE_GRID.forEach((row, r) => {
    row.forEach((type, c) => {
      const x = c * T;
      const y = r * T;
      if (grassVariants[type]) {
        ctx.drawImage(grassVariants[type], x, y, T, T);
      } else if (type === 'flower') {
        ctx.drawImage(img.grass, x, y, T, T);
        ctx.drawImage(img.plant, x + (T - plantSize) / 2, y + (T - plantSize) / 2, plantSize, plantSize);
      } else if (type === 'water') {
        ctx.drawImage(img.water, x, y, T, T);
      } else if (type in EDGE_ROTATION && isWalkable(c + EDGE_DIR[type][0], r + EDGE_DIR[type][1])) {
        // Grass beside pavement stays clean — the curb is the border.
        ctx.drawImage(img.grass, x, y, T, T);
      } else if (type in EDGE_ROTATION) {
        // The edge piece is authored for the north side and rotated per
        // side, grass and all — same as the rotated DOM tile it replaces.
        ctx.save();
        ctx.translate(x + T / 2, y + T / 2);
        ctx.rotate(EDGE_ROTATION[type]);
        ctx.drawImage(img.grass, -T / 2, -T / 2, T, T);
        ctx.drawImage(img.dirtEdge, -T / 2, -T / 2, T, T);
        ctx.restore();
      } else if (isWalkable(c, r)) {
        ctx.drawImage(img.pavement, x, y, T, T);
      } else {
        // Every other type is a path piece sharing the one dirt texture.
        ctx.drawImage(img.dirt, x, y, T, T);
      }
    });
  });
  drawCurbs(ctx);

  // Map trees and the outside forest share one painter's pass so they
  // overlap each other correctly across the map edge.
  const outside = forestTrees(-PAD - 1, COLS + PAD, -PAD - 1, ROWS + PAD + TREE_REACH_ROWS, true);
  drawTrees(ctx, img, [...BAKED_TREES, ...outside]);
}

function GroundCanvas() {
  const canvasRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadImage(grassUrl),
      loadImage(dirtUrl),
      loadImage(dirtEdgeUrl),
      loadImage(waterUrl),
      loadImage(plantUrl),
      loadImage(treeRoundUrl),
      loadImage(treePineUrl),
      loadImage(pavementUrl),
    ]).then(([grass, dirt, dirtEdge, water, plant, treeRound, treePine, pavement]) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const img = { grass, dirt, dirtEdge, water, plant, treeRound, treePine, pavement };
      const grassVariants = {
        grass,
        'grass-b': tinted(grass, [hueRotateMatrix(-6), brightnessMatrix(0.94)]),
        'grass-c': tinted(grass, [hueRotateMatrix(6), brightnessMatrix(1.05)]),
        forest: tinted(grass, [brightnessMatrix(0.5), saturateMatrix(0.85)]),
      };

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.translate(PAD_PX, PAD_PX);
      paintGround(ctx, img, grassVariants);
      canvas.classList.add('painted');

      if (backdropRef.current) {
        const tile = paintForestTile(img, grassVariants.forest);
        backdropRef.current.style.backgroundImage = `url(${tile.toDataURL()})`;
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div
        ref={backdropRef}
        className="forest-backdrop"
        aria-hidden="true"
        style={{
          left: -FOREST_OFFSET,
          top: -FOREST_OFFSET,
          width: WORLD_W + 2 * FOREST_OFFSET,
          height: WORLD_H + 2 * FOREST_OFFSET,
          backgroundSize: `${FOREST_PERIOD * TILE_SIZE}px`,
        }}
      />
      <canvas
        ref={canvasRef}
        className="ground-canvas"
        width={WORLD_W + 2 * PAD_PX}
        height={WORLD_H + 2 * PAD_PX}
        style={{ left: -PAD_PX, top: -PAD_PX }}
        aria-hidden="true"
      />
    </>
  );
}

export default GroundCanvas;
