import { describe, expect, it } from 'vitest';
import {
  COLS,
  ROWS,
  TILE_SIZE,
  TILE_GRID,
  WALKABLE,
  HOUSES,
  NPCS,
  PET_WALKERS,
  SIGNS,
  TREES,
  WATER_PATCHES,
  WAYPOINT_FRACTIONS,
  getWorldPosition,
  nearestProgressOnPath,
  pathPointsBetween,
} from '../tileMap';

// These check properties of the town that should hold however the layout
// gets rearranged — not specific coordinates — so moving a house or adding
// an NPC only fails here if it actually breaks something a visitor would
// notice.

// The camera is always centred on the character, and the character only
// ever stands on the path (see getWorldPosition), so a thing is only ever
// seen if it comes within half a viewport of some point on the path.
// 1280x720 is the smallest desktop the town is designed for (smaller
// screens get nudged to Quick View); the margins keep a whole sprite on
// screen rather than just its anchor tile.
const VIEW_HALF_W_TILES = 1280 / 2 / TILE_SIZE - 1;
const VIEW_HALF_H_TILES = 720 / 2 / TILE_SIZE - 1;

const PATH_SAMPLES = Array.from({ length: 2001 }, (_, i) => getWorldPosition(i / 2000));

function everOnScreen({ col, row }) {
  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE;
  return PATH_SAMPLES.some(
    (p) => Math.abs(p.x - x) <= VIEW_HALF_W_TILES * TILE_SIZE && Math.abs(p.y - y) <= VIEW_HALF_H_TILES * TILE_SIZE,
  );
}

const key = (c, r) => `${c},${r}`;
const tile = ({ col, row }) => TILE_GRID[row]?.[col];

describe('tile grid', () => {
  it('is a full COLS x ROWS grid', () => {
    expect(TILE_GRID).toHaveLength(ROWS);
    TILE_GRID.forEach((row) => expect(row).toHaveLength(COLS));
  });

  it('only marks paved road as walkable', () => {
    for (const k of WALKABLE) {
      const [c, r] = k.split(',').map(Number);
      const t = TILE_GRID[r][c];
      expect(t.startsWith('path') && !t.startsWith('path-edge'), `${k} is ${t}`).toBe(true);
    }
  });

  it('forms one connected walkable network', () => {
    const [start] = WALKABLE;
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const [c, r] = queue.pop().split(',').map(Number);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = key(c + dc, r + dr);
        if (WALKABLE.has(n) && !seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    expect(seen.size).toBe(WALKABLE.size);
  });

  it('never puts a tree on the road or in a pond', () => {
    for (const t of TREES) {
      expect(WALKABLE.has(key(t.col, t.row)), `tree at ${key(t.col, t.row)}`).toBe(false);
      expect(tile(t)).not.toBe('water');
    }
  });

  it('keeps every pond clear of the road', () => {
    for (const p of WATER_PATCHES) {
      for (let r = p.row; r < p.row + p.h; r++) {
        for (let c = p.col; c < p.col + p.w; c++) {
          expect(WALKABLE.has(key(c, r)), `pond tile ${key(c, r)}`).toBe(false);
        }
      }
    }
  });
});

describe('route', () => {
  it('runs every path sample over walkable road', () => {
    for (const p of PATH_SAMPLES) {
      const c = Math.round(p.x / TILE_SIZE);
      const r = Math.round(p.y / TILE_SIZE);
      expect(WALKABLE.has(key(c, r)), `path point ${key(c, r)}`).toBe(true);
    }
  });

  it('has strictly increasing waypoint fractions from 0 to 1', () => {
    expect(WAYPOINT_FRACTIONS[0]).toBe(0);
    expect(WAYPOINT_FRACTIONS.at(-1)).toBeCloseTo(1, 10);
    for (let i = 1; i < WAYPOINT_FRACTIONS.length; i++) {
      expect(WAYPOINT_FRACTIONS[i]).toBeGreaterThan(WAYPOINT_FRACTIONS[i - 1]);
    }
  });

  it('projects any point on the path back to the same progress', () => {
    for (let i = 0; i <= 50; i++) {
      const progress = i / 50;
      const { x, y } = getWorldPosition(progress);
      expect(nearestProgressOnPath(x, y)).toBeCloseTo(progress, 6);
    }
  });

  it('clamps progress outside 0-1', () => {
    expect(getWorldPosition(-1)).toEqual(getWorldPosition(0));
    expect(getWorldPosition(2)).toEqual(getWorldPosition(1));
  });

  it('draws the route preview through every corner in between, both ways', () => {
    const forward = pathPointsBetween(0, 1);
    expect(forward).toHaveLength(WAYPOINT_FRACTIONS.length);
    expect(pathPointsBetween(1, 0)).toEqual([...forward].reverse());
  });
});

describe('houses', () => {
  it('each has a walkable doorway that connects to the route', () => {
    for (const h of HOUSES) {
      expect(WALKABLE.has(key(h.col, h.row + 3)), `${h.id} doorway`).toBe(true);
    }
  });

  it('are listed in the order the road reaches them', () => {
    const order = HOUSES.map((h) => h.waypointIndex);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(new Set(order).size).toBe(order.length);
  });
});

describe('visibility at 1280x720', () => {
  const interactive = [...HOUSES, ...NPCS, ...PET_WALKERS, ...SIGNS];

  it.each(interactive.map((e) => [e.id, e]))('%s comes on screen somewhere along the walk', (_, e) => {
    expect(everOnScreen(e)).toBe(true);
  });
});
