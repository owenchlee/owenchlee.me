export const TILE_SIZE = 32;
export const COLS = 92;
export const ROWS = 116;
export const WORLD_W = COLS * TILE_SIZE;
export const WORLD_H = ROWS * TILE_SIZE;

// Path shape: start -> down-right -> Intro -> up-right (backtracks north) ->
// Projects -> down-left -> Hobbies -> down-right -> Contact -> a short
// continuation in the same direction so the path doesn't dead-end abruptly
// right at the last house.
const WAYPOINTS_TILE = [
  { col: 40, row: 30 }, // start
  { col: 50, row: 50 }, // down-right -> Intro
  { col: 60, row: 37 }, // up-right -> Projects
  { col: 46, row: 65 }, // down-left -> Hobbies
  { col: 58, row: 85 }, // down-right -> Contact
  { col: 64, row: 93 }, // tail past Contact
];

// waypointIndex ties each house to the WAYPOINTS_TILE entry it sits next to,
// so scroll progress (not screen position) can drive which house is "active"
// — screen position breaks down once the path folds back on itself (the
// up-right leg puts Projects at a *smaller* row than Intro even though it
// comes later on the path).
//
// `kind` controls what marker renders at this spot: 'house' (peaked-roof
// pixel-sprite cottage), 'lab' (flat-roofed pixel-sprite building), or
// 'shop' (storefront with a striped awning + display window) — three
// genuinely different silhouettes, not just recolors of one template, so
// the four checkpoints don't all read as the same building. `sprite` names
// the PNG in src/assets for that building.
export const HOUSES = [
  { id: 'intro', label: 'Intro', col: 44, row: 48, side: 'left', color: '#e0714f', waypointIndex: 1, kind: 'house', sprite: 'house-intro' },
  { id: 'projects', label: 'Projects', col: 66, row: 35, side: 'right', color: '#5b7a94', waypointIndex: 2, kind: 'lab', sprite: 'house-lab' },
  { id: 'hobbies', label: 'Hobbies', col: 39, row: 64, side: 'left', color: '#4da338', waypointIndex: 3, kind: 'shop', sprite: 'house-hobbies' },
  { id: 'contact', label: 'Contact', col: 64, row: 83, side: 'right', color: '#c9463e', waypointIndex: 4, kind: 'house', sprite: 'house-contact' },
];

// Purely decorative townsfolk that patrol a short back-and-forth walk near
// each spot — makes the town feel lived-in rather than just scenery. `axis`
// + `range` (px) describe the patrol; `duration` (s) staggers their pace so
// they don't all move in lockstep.
export const NPCS = [
  { id: 'npc-1', col: 24, row: 22, sprite: 'a', axis: 'x', range: 56, duration: 6 },
  { id: 'npc-2', col: 30, row: 57, sprite: 'b', axis: 'y', range: 44, duration: 5 },
  { id: 'npc-3', col: 77, row: 27, sprite: 'c', axis: 'x', range: 64, duration: 7.5 },
  { id: 'npc-4', col: 19, row: 67, sprite: 'a', axis: 'y', range: 48, duration: 5.5 },
  { id: 'npc-5', col: 75, row: 92, sprite: 'b', axis: 'x', range: 52, duration: 6.5 },
  { id: 'npc-6', col: 52, row: 22, sprite: 'c', axis: 'y', range: 40, duration: 4.5 },
  { id: 'npc-7', col: 70, row: 44, sprite: 'a', axis: 'x', range: 48, duration: 5.8 },
  { id: 'npc-8', col: 34, row: 46, sprite: 'b', axis: 'y', range: 36, duration: 4.8 },
];

// Purely decorative scenery buildings — fill out the town so it reads as a
// real place rather than 4 isolated houses in a field. Deliberately have no
// `label`/`waypointIndex`/active-glow: that's what keeps them visually
// distinct from the 4 real section checkpoints in HOUSES, which are the
// only buildings that ever show a name pill or light up. Kept off to the
// west/east sides, clear of the path's central band.
export const DECOR_HOUSES = [
  { id: 'decor-1', col: 22, row: 33, sprite: 'house-decor-tan' },
  { id: 'decor-2', col: 78, row: 40, sprite: 'house-decor-shop-blue' },
  { id: 'decor-3', col: 20, row: 58, sprite: 'house-decor-plum' },
  { id: 'decor-4', col: 75, row: 62, sprite: 'house-decor-tower' },
  { id: 'decor-5', col: 18, row: 78, sprite: 'house-decor-teal' },
  { id: 'decor-6', col: 76, row: 82, sprite: 'house-decor-shop' },
  { id: 'decor-7', col: 30, row: 95, sprite: 'house-decor-stone' },
  { id: 'decor-8', col: 70, row: 100, sprite: 'house-decor-plum' },
  { id: 'decor-9', col: 14, row: 16, sprite: 'house-decor-tower' },
  { id: 'decor-10', col: 33, row: 12, sprite: 'house-decor-teal' },
  { id: 'decor-11', col: 26, row: 42, sprite: 'house-decor-shop' },
  { id: 'decor-12', col: 82, row: 55, sprite: 'house-decor-plum' },
  { id: 'decor-13', col: 12, row: 68, sprite: 'house-decor-shop-blue' },
  { id: 'decor-14', col: 84, row: 90, sprite: 'house-decor-teal' },
];

// A flavor side street with no destination building, just so the town
// doesn't read as *only* house-driveways branching off the main route.
const DECOR_PATH_SPURS = [[{ col: 40, row: 34 }, { col: 26, row: 32 }]];

// Nearest WAYPOINTS_TILE vertex to a given point — used to connect every
// building to the actual path rather than hand-picking an anchor for each
// one. Vertices are guaranteed path cells, so this always lands on the
// route instead of near-but-not-touching it.
function nearestWaypoint(col, row) {
  let best = WAYPOINTS_TILE[0];
  let bestDist = Infinity;
  WAYPOINTS_TILE.forEach((wp) => {
    const d = Math.hypot(wp.col - col, wp.row - row);
    if (d < bestDist) {
      bestDist = d;
      best = wp;
    }
  });
  return best;
}

// Small wandering wildlife — same shape as NPCS but a smaller, subtler range
// since critters should read as idle/twitchy rather than deliberately
// patrolling the way villager NPCs do.
export const CRITTERS = [
  { id: 'critter-1', col: 34, row: 24, sprite: 'rat', axis: 'x', range: 20, duration: 3.5 },
  { id: 'critter-2', col: 70, row: 58, sprite: 'bird', axis: 'y', range: 16, duration: 2.8 },
  { id: 'critter-3', col: 15, row: 80, sprite: 'rat', axis: 'x', range: 18, duration: 4 },
  { id: 'critter-4', col: 58, row: 40, sprite: 'bird', axis: 'x', range: 18, duration: 3.2 },
  { id: 'critter-5', col: 72, row: 74, sprite: 'rat', axis: 'y', range: 16, duration: 3.8 },
];

// Two ponds — a big one off to the side near the start, a smaller one near
// the Hobbies clearing — both with corners nicked off so they read as
// rounded ponds rather than plain rectangles.
const WATER_PATCHES = [
  { col: 10, row: 42, w: 6, h: 6 },
  { col: 26, row: 70, w: 4, h: 4 },
];

// How many tiles from each world edge count as "the edge of town" — this
// band gets a dense treeline (like the forest bordering a Pokémon town)
// instead of the sparse scatter used everywhere else.
const BORDER_MARGIN = 9;

// Small deterministic hash so decoration scatter is stable across reloads
// without needing to store a big random table.
function hash(col, row) {
  const n = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function paintPond(grid, patch) {
  for (let r = patch.row; r < patch.row + patch.h; r++) {
    for (let c = patch.col; c < patch.col + patch.w; c++) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      const onCorner =
        (r === patch.row || r === patch.row + patch.h - 1) &&
        (c === patch.col || c === patch.col + patch.w - 1);
      if (onCorner) continue;
      grid[r][c] = 'water';
    }
  }
}

function buildTileGrid() {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push('grass');
    }
    grid.push(row);
  }

  WATER_PATCHES.forEach((patch) => paintPond(grid, patch));

  const paintPath = (c, r) => {
    [[0, 0], [1, 0], [0, 1], [-1, 0]].forEach(([dc, dr]) => {
      const cc = c + dc;
      const rr = r + dr;
      if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) grid[rr][cc] = 'path';
    });
  };

  const paintSegment = (a, b) => {
    const steps = Math.max(Math.abs(b.col - a.col), Math.abs(b.row - a.row)) * 2;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const col = Math.round(a.col + (b.col - a.col) * t);
      const row = Math.round(a.row + (b.row - a.row) * t);
      paintPath(col, row);
    }
  };

  for (let i = 0; i < WAYPOINTS_TILE.length - 1; i++) {
    paintSegment(WAYPOINTS_TILE[i], WAYPOINTS_TILE[i + 1]);
  }

  // Decorative side streets — same painter, but these tiles never feed into
  // WAYPOINTS_TILE/getWorldPosition, so they're purely visual dead ends.
  DECOR_PATH_SPURS.forEach(([a, b]) => paintSegment(a, b));

  // Every building — the 4 real checkpoints and all decorative houses —
  // gets a walkway from its entrance (the fence gap, h.row+3) to the
  // nearest actual path vertex, so nothing sits isolated in open grass.
  [...HOUSES, ...DECOR_HOUSES].forEach((h) => {
    const anchor = nearestWaypoint(h.col, h.row);
    paintSegment({ col: h.col, row: h.row + 3 }, anchor);
  });

  const nearAnyHouse = (c, r) =>
    HOUSES.some((h) => Math.abs(h.col - c) <= 3 && Math.abs(h.row - r) <= 3);

  // Route framing: low fence/tree lining along both sides of the *real*
  // path only (not the decorative spurs), at a sparse interval, like a GBA
  // route being visually channeled rather than open field on both sides.
  // Perpendicular offset per segment so the lining tracks whichever way the
  // path is currently running.
  for (let i = 0; i < WAYPOINTS_TILE.length - 1; i++) {
    const a = WAYPOINTS_TILE[i];
    const b = WAYPOINTS_TILE[i + 1];
    const dx = b.col - a.col;
    const dy = b.row - a.row;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const steps = Math.round(len);
    for (let s = 0; s <= steps; s += 3) {
      const t = s / steps;
      const cx = a.col + dx * t;
      const cy = a.row + dy * t;
      [-3, 3].forEach((offset) => {
        const c = Math.round(cx + perpX * offset);
        const r = Math.round(cy + perpY * offset);
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
        if (grid[r][c] !== 'grass') return;
        if (nearAnyHouse(c, r)) return;
        grid[r][c] = hash(c, r) < 0.5 ? 'tree' : 'flower';
      });
    }
  }

  // --- Path autotiling ---
  // Every path cell so far is the same flat 'path' fill — a freeform
  // painted blob with jagged pixel edges. Snapshot which cells are path,
  // then reassign each one a specific tile role (straight/corner) based on
  // which of its 4 neighbors are also path, so the route reads as built
  // from discrete tile pieces instead of one painted shape. Neighbor checks
  // below always read this snapshot, never the grid being written to, so
  // earlier reassignments in the same pass can't skew later ones.
  const isPath = grid.map((row) => row.map((t) => t === 'path'));
  const pathAt = (c, r) => r >= 0 && r < ROWS && c >= 0 && c < COLS && isPath[r][c];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isPath[r][c]) continue;
      const n = pathAt(c, r - 1);
      const e = pathAt(c + 1, r);
      const s = pathAt(c, r + 1);
      const w = pathAt(c - 1, r);

      if (n && s && !e && !w) grid[r][c] = 'path-straight-v';
      else if (e && w && !n && !s) grid[r][c] = 'path-straight-h';
      else if (n && e && !s && !w) grid[r][c] = 'path-corner-ne';
      else if (e && s && !n && !w) grid[r][c] = 'path-corner-es';
      else if (s && w && !n && !e) grid[r][c] = 'path-corner-sw';
      else if (w && n && !e && !s) grid[r][c] = 'path-corner-wn';
      // Junctions, dead-ends and isolated cells (a small minority) keep the
      // plain flat fill — not worth a dedicated sprite for each.
    }
  }

  // Edge-transition tiles: a grass cell touching a path cell gets a
  // dirt-bleed variant on whichever side touches, so the grass/path
  // boundary reads as a dithered blend instead of a hard printed line.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== 'grass') continue;
      if (pathAt(c, r - 1)) grid[r][c] = 'path-edge-n';
      else if (pathAt(c + 1, r)) grid[r][c] = 'path-edge-e';
      else if (pathAt(c, r + 1)) grid[r][c] = 'path-edge-s';
      else if (pathAt(c - 1, r)) grid[r][c] = 'path-edge-w';
    }
  }

  // Scatter trees/flowers over any tile that's still plain grass, keeping a
  // clear buffer around houses so decoration doesn't overlap them. Plain
  // grass tiles also get one of three subtle shade variants here so the
  // field doesn't read as a single repeating texture.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== 'grass') continue;
      if (nearAnyHouse(c, r)) continue;

      const onBorder = c < BORDER_MARGIN || c >= COLS - BORDER_MARGIN || r < BORDER_MARGIN || r >= ROWS - BORDER_MARGIN;
      const roll = hash(c, r);

      if (onBorder) {
        if (roll < 0.55) grid[r][c] = 'tree';
        continue;
      }

      if (roll < 0.08) {
        grid[r][c] = 'tree';
      } else if (roll < 0.2) {
        grid[r][c] = 'flower';
      } else {
        const shadeRoll = hash(c - 1000, r - 1000);
        grid[r][c] = shadeRoll < 0.35 ? 'grass-b' : shadeRoll < 0.6 ? 'grass-c' : 'grass';
      }
    }
  }

  return grid;
}

export const TILE_GRID = buildTileGrid();

// A fenced yard perimeter around each checkpoint building — purely
// decorative. Leaves a gap in the bottom edge, centered on the building, as
// a walk-through entrance.
function yardFence(h) {
  const left = h.col - 3;
  const right = h.col + 3;
  const top = h.row - 2;
  const bottom = h.row + 3;
  const posts = [];

  for (let c = left; c <= right; c++) {
    posts.push({ col: c, row: top });
    if (c !== h.col) posts.push({ col: c, row: bottom });
  }
  for (let r = top + 1; r < bottom; r++) {
    posts.push({ col: left, row: r });
    posts.push({ col: right, row: r });
  }

  return posts;
}

export const FENCES = HOUSES.filter((h) => h.kind !== 'landmark').flatMap((h) =>
  yardFence(h).map((post, i) => ({
    id: `${h.id}-fence-${i}`,
    col: post.col,
    row: post.row,
  })),
);

export function tileToPx(col, row) {
  return { x: col * TILE_SIZE, y: row * TILE_SIZE };
}

const WAYPOINTS_PX = WAYPOINTS_TILE.map(({ col, row }) => tileToPx(col, row));
export { WAYPOINTS_PX };

function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

const segmentLengths = WAYPOINTS_PX.slice(1).map((p, i) => dist(WAYPOINTS_PX[i], p));
export const TOTAL_PATH_LENGTH = segmentLengths.reduce((a, b) => a + b, 0);

export const WAYPOINT_FRACTIONS = (() => {
  let acc = 0;
  const fracs = [0];
  for (const len of segmentLengths) {
    acc += len;
    fracs.push(acc / TOTAL_PATH_LENGTH);
  }
  return fracs;
})();

export function getWorldPosition(progress) {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i < WAYPOINT_FRACTIONS.length - 1; i++) {
    const start = WAYPOINT_FRACTIONS[i];
    const end = WAYPOINT_FRACTIONS[i + 1];
    if (p >= start && p <= end) {
      const segT = end === start ? 0 : (p - start) / (end - start);
      const a = WAYPOINTS_PX[i];
      const b = WAYPOINTS_PX[i + 1];
      return {
        x: a.x + (b.x - a.x) * segT,
        y: a.y + (b.y - a.y) * segT,
      };
    }
  }
  return WAYPOINTS_PX[WAYPOINTS_PX.length - 1];
}
