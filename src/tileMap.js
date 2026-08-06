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
];

// Purely cosmetic: a short path stub painted past Contact (see buildTileGrid)
// so the route doesn't dead-end abruptly right at the last house. Kept out
// of WAYPOINTS_TILE itself — that array drives scroll length (TRACK_HEIGHT),
// camera keyframes, and every reveal/waypointFraction calculation below, so
// folding the tail into it would add scrollable distance after the Contact
// panel is fully open with nothing left to reveal, letting the page keep
// scrolling past the "end" of the site.
const PATH_TAIL_TILE = { col: 64, row: 93 };

// waypointIndex ties each house to the WAYPOINTS_TILE entry it sits next to,
// so scroll progress (not screen position) can drive which house is "active"
// — screen position breaks down once the path folds back on itself (the
// up-right leg puts Projects at a *smaller* row than Intro even though it
// comes later on the path).
//
// Each checkpoint gets its own distinct sourced sprite (see house-XX credit
// in ASSET_CREDITS.md) rather than one recolored building. The sourced pack
// has 18 usable houses, but about a third of them (house-05/10/12/14/15/19)
// are stark modern/sci-fi builds that read as visually foreign next to the
// hand-painted grass/path/fence tiles everywhere else — those are excluded
// from both this list and DECOR_HOUSES below in favor of the cottage/shop
// sprites that actually match the rest of the world.
//
// col/row sit 4 tiles horizontal + 2 tiles vertical from this house's own
// waypoint (see WAYPOINTS_TILE above and waypointIndex below) — close enough
// that the camera being centered on the waypoint (which is what "reveal"
// approaching 1 means) puts the actual building right there on screen, not
// a few hundred pixels off in the distance. An earlier layout had houses
// 6-7 tiles out, which combined with the reveal shoulder's own width meant
// the section panel could already be half-visible while the building was
// still ~200-300px away — not "arrived" in any visual sense. Pixel
// positions (col*32, row*32), for reference:
//   intro:    tile (46, 48) -> px (1472, 1536); waypoint (50, 50) -> px (1600, 1600)
//   projects: tile (64, 35) -> px (2048, 1120); waypoint (60, 37) -> px (1920, 1184)
//   hobbies:  tile (42, 63) -> px (1344, 2016); waypoint (46, 65) -> px (1472, 2080)
//   contact:  tile (62, 83) -> px (1984, 2656); waypoint (58, 85) -> px (1856, 2720)
export const HOUSES = [
  { id: 'intro', label: 'Intro', col: 46, row: 48, side: 'left', color: '#e0714f', waypointIndex: 1, kind: 'house', sprite: 'house-07' },
  { id: 'projects', label: 'Projects', col: 64, row: 35, side: 'right', color: '#5b7a94', waypointIndex: 2, kind: 'lab', sprite: 'house-13' },
  { id: 'hobbies', label: 'Hobbies', col: 42, row: 63, side: 'left', color: '#4da338', waypointIndex: 3, kind: 'shop', sprite: 'house-08' },
  { id: 'contact', label: 'Contact', col: 62, row: 83, side: 'right', color: '#c9463e', waypointIndex: 4, kind: 'house', sprite: 'house-04' },
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
//
// Same sourced house pack as HOUSES, restricted to the same style-matching
// subset (see the sprite-exclusion note above HOUSES) — with 14 decor slots
// pulling from only ~12 usable sprites, a few repeat, but every repeat pair
// sits far enough apart on the map (60+ tiles) that it doesn't read as two
// copies of the same building.
export const DECOR_HOUSES = [
  { id: 'decor-1', col: 22, row: 33, sprite: 'house-01' },
  { id: 'decor-2', col: 78, row: 40, sprite: 'house-02' },
  { id: 'decor-3', col: 20, row: 58, sprite: 'house-03' },
  { id: 'decor-4', col: 75, row: 62, sprite: 'house-06' },
  { id: 'decor-5', col: 18, row: 78, sprite: 'house-09' },
  { id: 'decor-6', col: 76, row: 82, sprite: 'house-03' },
  { id: 'decor-7', col: 30, row: 95, sprite: 'house-17' },
  { id: 'decor-8', col: 70, row: 100, sprite: 'house-09' },
  { id: 'decor-9', col: 14, row: 16, sprite: 'house-02' },
  { id: 'decor-10', col: 33, row: 12, sprite: 'house-18' },
  { id: 'decor-11', col: 26, row: 42, sprite: 'house-16' },
  { id: 'decor-12', col: 82, row: 55, sprite: 'house-17' },
  { id: 'decor-13', col: 12, row: 68, sprite: 'house-18' },
  { id: 'decor-14', col: 84, row: 90, sprite: 'house-16' },
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

// Three ponds — a big one off to the side near the start, a smaller one near
// the Hobbies clearing, and a third along the Intro-to-Projects stretch —
// all with corners nicked off so they read as rounded ponds rather than
// plain rectangles. Rows must stay outside the 10-29 spawn-clearing band
// (see buildTileGrid) or that pass would wipe the pond back to grass.
const WATER_PATCHES = [
  { col: 10, row: 42, w: 6, h: 6 },
  { col: 26, row: 70, w: 4, h: 4 },
  { col: 58, row: 58, w: 5, h: 5 },
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
  paintSegment(WAYPOINTS_TILE[WAYPOINTS_TILE.length - 1], PATH_TAIL_TILE);

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

  // Trees are composed multi-tile sprites (canopy + trunk, see TREES below)
  // rendered as overlays like houses/NPCs, not a tile-grid cell type — a
  // single 32x32 background-image can't read as an actual tree at any
  // convincing size. `treeReserved` tracks which grid cells a tree has
  // already claimed so the later interior scatter pass (which also rolls
  // trees) doesn't double-claim the same cell.
  const trees = [];
  const treeReserved = new Set();
  const pickTreeVariant = (c, r) => (hash(c + 500, r + 500) < 0.5 ? 'round' : 'pine');
  const addTree = (c, r) => {
    trees.push({ col: c, row: r, variant: pickTreeVariant(c, r) });
    treeReserved.add(`${c},${r}`);
  };

  // Spawn clearing: the HUD nameplate is a screen-fixed overlay sitting
  // near the top of the very first view (progress 0, camera centered on the
  // start waypoint at row 30). Several nearby decorative houses' driveways
  // (and the flavor spur) cross through the rows just above that hub on
  // their way there, which used to run straight behind the name. The real
  // route never touches rows above 30 except the shared hub tile itself, so
  // it's safe to force this whole band back to plain grass. This must run
  // *before* autotiling/edge-blending below, not after — reverting cells to
  // grass after those passes already ran leaves the boundary tile holding a
  // stale autotile choice computed against a neighbor that no longer
  // exists, which is what produced the hard, unblended cut.
  for (let r = 10; r <= 29; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = 'grass';
    }
  }

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
        if (hash(c, r) < 0.5) addTree(c, r);
        else grid[r][c] = 'flower';
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

  // A 2-tile-radius buffer around any path cell where the *random* scatter
  // below won't place a tree — the character is always screen-center while
  // the path scrolls beneath it, so a tree landing right next to the route
  // (previously possible with zero distance awareness — only the deliberate
  // route-framing lining above, fixed at a 3-tile offset, was ever spaced
  // out) made the character constantly look like it was standing inside a
  // pine tree. Flowers/grass shading are unaffected, only trees are held
  // back, so the corridor still reads as decorated, just not crowded.
  const nearPath = (c, r) => {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (pathAt(c + dc, r + dr)) return true;
      }
    }
    return false;
  };

  // Scatter trees/flowers over any tile that's still plain grass, keeping a
  // clear buffer around houses so decoration doesn't overlap them. Plain
  // grass tiles also get one of three subtle shade variants here so the
  // field doesn't read as a single repeating texture.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== 'grass') continue;
      if (nearAnyHouse(c, r)) continue;
      if (treeReserved.has(`${c},${r}`)) continue;

      const onBorder = c < BORDER_MARGIN || c >= COLS - BORDER_MARGIN || r < BORDER_MARGIN || r >= ROWS - BORDER_MARGIN;
      const roll = hash(c, r);

      if (onBorder) {
        if (roll < 0.55) addTree(c, r);
        continue;
      }

      if (roll < 0.14 && !nearPath(c, r)) {
        addTree(c, r);
      } else if (roll < 0.26) {
        grid[r][c] = 'flower';
      } else {
        const shadeRoll = hash(c - 1000, r - 1000);
        grid[r][c] = shadeRoll < 0.35 ? 'grass-b' : shadeRoll < 0.6 ? 'grass-c' : 'grass';
      }
    }
  }

  return { grid, trees };
}

const built = buildTileGrid();
export const TILE_GRID = built.grid;
export const TREES = built.trees;

// A fenced yard perimeter around each checkpoint building — purely
// decorative. Leaves a gap in the bottom edge, centered on the building, as
// a walk-through entrance.
// `orientation` records which edge of the yard a post sits on ('h' for the
// top/bottom runs, 'v' for the left/right runs) so the sourced fence sprite
// — a horizontal post+rail panel — can be rotated 90deg for the vertical
// runs instead of just being stacked sideways.
function yardFence(h) {
  const left = h.col - 3;
  const right = h.col + 3;
  const top = h.row - 2;
  const bottom = h.row + 3;
  const posts = [];

  for (let c = left; c <= right; c++) {
    posts.push({ col: c, row: top, orientation: 'h' });
    if (c !== h.col) posts.push({ col: c, row: bottom, orientation: 'h' });
  }
  for (let r = top + 1; r < bottom; r++) {
    posts.push({ col: left, row: r, orientation: 'v' });
    posts.push({ col: right, row: r, orientation: 'v' });
  }

  return posts;
}

export const FENCES = HOUSES.filter((h) => h.kind !== 'landmark').flatMap((h) =>
  yardFence(h).map((post, i) => ({
    id: `${h.id}-fence-${i}`,
    col: post.col,
    row: post.row,
    orientation: post.orientation,
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

// --- House reveal curve ---
// Section panels used to snap open/closed on a binary distance check, paired
// with a fixed-duration CSS transition — the reveal pace had zero relation
// to how fast the user was actually scrolling, which is what read as
// abrupt/disconnected ("boom, next page"). Instead, reveal is a continuous
// 0-1 function of scroll progress: a flat "fully open" plateau (so the panel
// is comfortably interactive, not a single instantaneous point) plus eased
// shoulders on either side (so it grows/shrinks in lockstep with scroll
// speed rather than on its own timer).
export const HOUSE_OPEN_PLATEAU = 0.03;
export const HOUSE_REVEAL_SHOULDER = 0.035;

export function getHouseReveal(progress, waypointFraction, { reducedMotion = false } = {}) {
  const d = Math.abs(progress - waypointFraction);
  if (reducedMotion) return d <= HOUSE_OPEN_PLATEAU ? 1 : 0;
  if (d <= HOUSE_OPEN_PLATEAU) return 1;
  const s = d - HOUSE_OPEN_PLATEAU;
  if (s >= HOUSE_REVEAL_SHOULDER) return 0;
  const t = 1 - s / HOUSE_REVEAL_SHOULDER;
  return t * t * (3 - 2 * t); // smoothstep
}

// Character walk-to-the-door amount (0-1), a pure function of scroll
// progress like getHouseReveal above — no independent timer, no
// requestAnimationFrame loop, nothing that plays on its own once triggered.
// An earlier version played a fixed-duration CSS animation once a threshold
// was crossed, so the character kept walking for a full ~2s even after the
// user had completely stopped scrolling — every other reveal-driven visual
// in this file is tied straight to scroll position, and this one needs to
// be too: every bit of scroll should move something, and nothing should
// move without a bit of scroll. Reuses almost all of HOUSE_REVEAL_SHOULDER
// (linear, not smoothstepped — smoothstep flattens near both ends, which
// compresses most of the visible change into a sliver of the actual scroll
// distance) so there's still a wide, clearly visible band to walk through.
const CHARACTER_WALK_FRACTION = 0.92;

export function getCharacterWalkT(progress, waypointFraction, { reducedMotion = false } = {}) {
  const d = Math.abs(progress - waypointFraction);
  if (reducedMotion) return d <= HOUSE_OPEN_PLATEAU ? 1 : 0;
  if (d <= HOUSE_OPEN_PLATEAU) return 1;
  const s = d - HOUSE_OPEN_PLATEAU;
  const band = HOUSE_REVEAL_SHOULDER * CHARACTER_WALK_FRACTION;
  if (s >= band) return 0;
  return 1 - s / band; // linear — constant rate across the whole band
}

// Adjacent houses' reveal bands must never overlap, or two panels could be
// simultaneously non-zero — verified here at module load (dev only) rather
// than just in a comment, so it can't silently regress if a waypoint moves.
if (import.meta.env.DEV) {
  const band = 2 * (HOUSE_OPEN_PLATEAU + HOUSE_REVEAL_SHOULDER);
  const fractions = HOUSES.map((h) => WAYPOINT_FRACTIONS[h.waypointIndex]).sort((a, b) => a - b);
  for (let i = 0; i < fractions.length - 1; i++) {
    const gap = fractions[i + 1] - fractions[i];
    if (gap < band) {
      console.warn(
        `[tileMap] House reveal bands overlap: gap ${gap.toFixed(3)} between waypoint fractions ` +
          `${fractions[i].toFixed(3)} and ${fractions[i + 1].toFixed(3)} is smaller than band width ${band.toFixed(3)}.`,
      );
    }
  }
}

// --- Lighting cycle ---
// One monotonic wash across the whole path (dawn -> day -> dusk -> night),
// purely atmospheric — not a repeating loop, since the player only ever
// walks the route once in a given direction.
const LIGHT_STOPS = [
  { at: 0, rgba: [255, 223, 168, 0.1] },
  { at: 0.35, rgba: [255, 255, 255, 0] },
  { at: 0.7, rgba: [91, 110, 168, 0.16] },
  { at: 1, rgba: [20, 20, 40, 0.38] },
];

export function getLightingTint(progress) {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i < LIGHT_STOPS.length - 1; i++) {
    const a = LIGHT_STOPS[i];
    const b = LIGHT_STOPS[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at);
      const [r, g, bl, aAlpha] = a.rgba;
      const [r2, g2, b2, aAlpha2] = b.rgba;
      const lerp = (x, y) => x + (y - x) * t;
      return `rgba(${Math.round(lerp(r, r2))}, ${Math.round(lerp(g, g2))}, ${Math.round(lerp(bl, b2))}, ${lerp(aAlpha, aAlpha2).toFixed(3)})`;
    }
  }
  const last = LIGHT_STOPS[LIGHT_STOPS.length - 1].rgba;
  return `rgba(${last[0]}, ${last[1]}, ${last[2]}, ${last[3]})`;
}

// Same dawn/day/dusk/night timing as LIGHT_STOPS above, collapsed to a plain
// 0 (full day, sun out) - 1 (full night, moon out) scale for the sun/moon HUD
// — kept separate from LIGHT_STOPS since that one is about tint color/alpha,
// not a clean day/night amount (dawn's alpha is actually higher than day's).
const SKY_STOPS = [
  { at: 0, night: 0 },
  { at: 0.35, night: 0 },
  { at: 0.7, night: 1 },
  { at: 1, night: 1 },
];

export function getNightAmount(progress) {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at);
      return a.night + (b.night - a.night) * t;
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1].night;
}
