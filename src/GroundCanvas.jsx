import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { TILE_SIZE, COLS, ROWS, WORLD_W, WORLD_H, TILE_GRID, BAKED_TREES, WALKABLE, hash } from './tileMap';
import pavementUrl from './assets/pavement.png';
import grassUrl from './assets/grass.png';
import dirtUrl from './assets/dirt-lpc.png';
import dirtEdgeUrl from './assets/dirt-edge-lpc.png';
import plantUrl from './assets/plant.png';
import treeRoundUrl from './assets/tree-round-lpc.png';
import treePineUrl from './assets/tree-pine-lpc.png';
import { seasonGround, seasonTreeSprites, treeVariant } from './season';

// The whole static ground — every grass/path/flower/water tile plus the
// thousands of trees that don't need live depth sorting (BAKED_TREES, see
// tileMap.js) — painted once into a single canvas when the page loads.
//
// This used to be ~10,600 individual tile <div>s plus ~3,800 tree <img>s,
// and panning that many nodes under the camera cost far more than a frame
// budget: measured in headless Chrome, the walk ran at ~9fps, and because
// each frame's step is time-based that read as the character crawling. One
// pre-painted bitmap that the camera just translates is effectively free
// to move. The ponds are live elements under the canvas instead (see
// `children` below), so they keep their shimmer.

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
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
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

// Pavement is bordered by a dark curb wherever it meets anything else,
// dirt included, so the walkable road reads as one built surface and the
// dirt tracks (fenced off at the curb, see BARRIERS in tileMap.js) as
// somewhere you can't go.
const CURB = '#5a5246';
const CURB_LIGHT = '#e6dfcd';

function drawCurbs(ctx, range) {
  const T = TILE_SIZE;
  WALKABLE.forEach((key) => {
    const [c, r] = key.split(',').map(Number);
    if (c < range.c0 || c > range.c1 || r < range.r0 || r > range.r1) return;
    const x = c * T;
    const y = r * T;
    const open = (dc, dr) => isWalkable(c + dc, r + dr);
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
//
// How far it reaches past the map: the camera stays centered on the path
// (x 1280-1920), so even a 5K-wide window only sees ~1300px past an edge.
// It used to reach 3072px, which made .world's layer ~9000x9900px and gave
// the browser a lot of offscreen forest to rasterize and keep around.
const FOREST_PERIOD = 16;
const FOREST_DENSITY = 0.9; // same fill as BORDER_TREE_DENSITY in tileMap.js
const FOREST_OFFSET = FOREST_PERIOD * TILE_SIZE * 3;
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
const byRowThenCol = (a, b) => a.row - b.row || a.col - b.col;

// `bounds` (world px) skips trees whose sprite can't reach the area being
// painted. Trees that cross a chunk edge get drawn into both chunks, in
// the same global order, so the two halves line up exactly.
function drawTrees(ctx, img, sortedTrees, bounds) {
  const T = TILE_SIZE;
  sortedTrees.forEach((tree) => {
    const versions = tree.variant === 'pine' ? img.trees.pine : img.trees.round;
    const sprite = versions[treeVariant(tree, versions.length)];
    const h = (TREE_W * sprite.height) / sprite.width;
    const left = tree.col * T + T / 2 - TREE_W / 2;
    const top = tree.row * T + T - h;
    if (bounds && (left > bounds.x1 || left + TREE_W < bounds.x0 || top > bounds.y1 || top + h < bounds.y0)) return;
    ctx.drawImage(sprite, left, top, TREE_W, h);
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
  const trees = forestTrees(-1, FOREST_PERIOD, -1, FOREST_PERIOD + TREE_REACH_ROWS, false).sort(byRowThenCol);
  drawTrees(ctx, img, trees, null);
  return canvas;
}

// Map trees and the outside forest share one painter's pass so they
// overlap each other correctly across the map edge.
const GROUND_TREES = [
  ...BAKED_TREES,
  ...forestTrees(-PAD - 1, COLS + PAD, -PAD - 1, ROWS + PAD + TREE_REACH_ROWS, true),
].sort(byRowThenCol);

// Paints the ground tiles in an inclusive tile range (which may run into
// the padding ring outside the map), then every tree that reaches it.
function paintGround(ctx, img, grassVariants, range) {
  const T = TILE_SIZE;
  // Flower sprite at 55% of the tile, centered over grass.
  const plantSize = T * 0.55;

  for (let r = range.r0; r <= range.r1; r++) {
    for (let c = range.c0; c <= range.c1; c++) {
      const x = c * T;
      const y = r * T;
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) {
        // Forest floor under the padding ring around the map.
        ctx.drawImage(grassVariants.forest, x, y, T, T);
        continue;
      }
      const type = TILE_GRID[r][c];
      if (grassVariants[type]) {
        ctx.drawImage(grassVariants[type], x, y, T, T);
      } else if (type === 'flower') {
        ctx.drawImage(img.grass, x, y, T, T);
        ctx.drawImage(img.plant, x + (T - plantSize) / 2, y + (T - plantSize) / 2, plantSize, plantSize);
      } else if (type === 'water') {
        // Left clear: the live pond sits underneath the chunks (see the
        // JSX below), so trees painted next here overhang the water.
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
    }
  }
  drawCurbs(ctx, range);
  drawTrees(ctx, img, GROUND_TREES, {
    x0: range.c0 * T,
    y0: range.r0 * T,
    x1: (range.c1 + 1) * T,
    y1: (range.r1 + 1) * T,
  });
}

// --- Chunks ---
// The painted area (map + padding ring) is ~3100x3900px. As one canvas
// that's ~49MB of pixels before the browser's own GPU and tile copies,
// measured at ~135MB of process memory in headless Chrome. Instead it's
// cut into CHUNK_PX squares, and only the ones near the camera hold a
// bitmap: chunks get painted as they come within PAINT_MARGIN of the
// screen and freed (resized to 0x0) once they're past FREE_MARGIN. The gap
// between the two margins stops a chunk from being painted and freed
// over and over by a visitor pacing back and forth across one edge.
const CHUNK_PX = 512;
const CHUNK_TILES = CHUNK_PX / TILE_SIZE;
const PAINT_MARGIN = 256;
const FREE_MARGIN = 640;
const GROUND_W = WORLD_W + 2 * PAD_PX;
const GROUND_H = WORLD_H + 2 * PAD_PX;
const CHUNK_COLS = Math.ceil(GROUND_W / CHUNK_PX);
const CHUNK_ROWS = Math.ceil(GROUND_H / CHUNK_PX);

const CHUNKS = Array.from({ length: CHUNK_COLS * CHUNK_ROWS }, (_, i) => {
  const cx = i % CHUNK_COLS;
  const cy = Math.floor(i / CHUNK_COLS);
  // World px of the chunk's top-left (the ring starts at -PAD_PX).
  const x = cx * CHUNK_PX - PAD_PX;
  const y = cy * CHUNK_PX - PAD_PX;
  return {
    cx,
    cy,
    x,
    y,
    w: Math.min(CHUNK_PX, GROUND_W - cx * CHUNK_PX),
    h: Math.min(CHUNK_PX, GROUND_H - cy * CHUNK_PX),
    range: {
      c0: cx * CHUNK_TILES - PAD,
      r0: cy * CHUNK_TILES - PAD,
      c1: Math.min(COLS + PAD, (cx + 1) * CHUNK_TILES - PAD) - 1,
      r1: Math.min(ROWS + PAD, (cy + 1) * CHUNK_TILES - PAD) - 1,
    },
  };
});

function chunkSpan(view, margin) {
  const clampC = (v) => Math.min(CHUNK_COLS - 1, Math.max(0, v));
  const clampR = (v) => Math.min(CHUNK_ROWS - 1, Math.max(0, v));
  return {
    c0: clampC(Math.floor((view.x - view.halfW - margin + PAD_PX) / CHUNK_PX)),
    c1: clampC(Math.floor((view.x + view.halfW + margin + PAD_PX) / CHUNK_PX)),
    r0: clampR(Math.floor((view.y - view.halfH - margin + PAD_PX) / CHUNK_PX)),
    r1: clampR(Math.floor((view.y + view.halfH + margin + PAD_PX) / CHUNK_PX)),
  };
}

const inSpan = (chunk, s) => chunk.cx >= s.c0 && chunk.cx <= s.c1 && chunk.cy >= s.r0 && chunk.cy <= s.r1;

// `ref` exposes setView(x, y, halfW, halfH): the camera's world position
// and half the stage size, called by App.jsx's draw loop whenever the
// camera moves or the stage resizes.
// `children` (the ponds) render between the flat grass and the chunks: the
// chunks leave their water tiles transparent, so the water shows through
// while every tree in the canvas still draws over it, the way a canopy
// standing on the bank should.
const GroundCanvas = forwardRef(function GroundCanvas({ children }, ref) {
  const chunkRefs = useRef([]);
  const backdropRef = useRef(null);
  // Sprites + tinted grass once loaded, which chunks currently hold a
  // bitmap, the last view, and the last spans (to skip no-op updates).
  const stateRef = useRef({ assets: null, painted: new Set(), view: null, spanKey: '' });

  function syncChunks() {
    const s = stateRef.current;
    if (!s.assets || !s.view) return;
    const paint = chunkSpan(s.view, PAINT_MARGIN);
    const keep = chunkSpan(s.view, FREE_MARGIN);
    const key = `${paint.c0},${paint.c1},${paint.r0},${paint.r1}|${keep.c0},${keep.c1},${keep.r0},${keep.r1}`;
    if (key === s.spanKey) return;
    s.spanKey = key;
    CHUNKS.forEach((chunk, i) => {
      const canvas = chunkRefs.current[i];
      if (!canvas) return;
      const isPainted = s.painted.has(i);
      if (!isPainted && inSpan(chunk, paint)) {
        canvas.width = chunk.w;
        canvas.height = chunk.h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.translate(-chunk.x, -chunk.y);
        paintGround(ctx, s.assets.img, s.assets.grassVariants, chunk.range);
        s.painted.add(i);
      } else if (isPainted && !inSpan(chunk, keep)) {
        canvas.width = 0;
        canvas.height = 0;
        s.painted.delete(i);
      }
    });
  }

  useImperativeHandle(ref, () => ({
    setView(x, y, halfW, halfH) {
      stateRef.current.view = { x, y, halfW, halfH };
      syncChunks();
    },
  }));

  useEffect(() => {
    let cancelled = false;
    let backdropUrl = null;
    Promise.all([
      loadImage(grassUrl),
      loadImage(dirtUrl),
      loadImage(dirtEdgeUrl),
      loadImage(plantUrl),
      loadImage(treeRoundUrl),
      loadImage(treePineUrl),
      loadImage(pavementUrl),
    ]).then(([grassImg, dirtImg, dirtEdgeImg, plantImg, treeRound, treePine, pavement]) => {
      if (cancelled) return;
      const grass = seasonGround(grassImg, 'grass');
      const dirt = seasonGround(dirtImg, 'dirt');
      const dirtEdge = seasonGround(dirtEdgeImg, 'grass');
      const plant = seasonGround(plantImg, 'plant');
      const trees = seasonTreeSprites(treeRound, treePine);
      const img = { grass, dirt, dirtEdge, plant, trees, pavement };
      const grassVariants = {
        grass,
        'grass-b': tinted(grass, [hueRotateMatrix(-6), brightnessMatrix(0.94)]),
        'grass-c': tinted(grass, [hueRotateMatrix(6), brightnessMatrix(1.05)]),
        forest: tinted(grass, [brightnessMatrix(0.5), saturateMatrix(0.85)]),
      };
      stateRef.current.assets = { img, grassVariants };
      syncChunks();

      // A blob URL rather than toDataURL(), which would keep a few hundred
      // KB of base64 text alive in the style for the life of the page.
      paintForestTile(img, grassVariants.forest).toBlob((blob) => {
        if (cancelled || !blob || !backdropRef.current) return;
        backdropUrl = URL.createObjectURL(blob);
        backdropRef.current.style.backgroundImage = `url(${backdropUrl})`;
      });
    });
    return () => {
      cancelled = true;
      if (backdropUrl) URL.revokeObjectURL(backdropUrl);
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
      {/* Flat grass under the map so a chunk that hasn't painted yet never
          shows the forest backdrop through the middle of town. */}
      <div className="ground-base" style={{ width: WORLD_W, height: WORLD_H }} aria-hidden="true" />
      {children}
      {CHUNKS.map((chunk, i) => (
        <canvas
          key={i}
          ref={(el) => {
            chunkRefs.current[i] = el;
          }}
          className="ground-chunk"
          width={0}
          height={0}
          style={{ left: chunk.x, top: chunk.y }}
          aria-hidden="true"
        />
      ))}
    </>
  );
});

export default GroundCanvas;
