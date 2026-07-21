export const TILE_SIZE = 32;
export const COLS = 92;
export const ROWS = 116;

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

export const HOUSES = [
  { id: 'intro', label: 'Intro', col: 56, row: 48, side: 'right', color: '#e0714f' },
  { id: 'projects', label: 'Projects', col: 66, row: 35, side: 'right', color: '#3d6a8a' },
  { id: 'hobbies', label: 'Hobbies', col: 39, row: 64, side: 'left', color: '#5a9463' },
  { id: 'contact', label: 'Contact', col: 64, row: 83, side: 'right', color: '#c99a3e' },
];

const WATER_PATCH = { col: 12, row: 45, w: 5, h: 5 };

function buildTileGrid() {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push((r + c) % 2 === 0 ? 'grass-a' : 'grass-b');
    }
    grid.push(row);
  }

  for (let r = WATER_PATCH.row; r < WATER_PATCH.row + WATER_PATCH.h; r++) {
    for (let c = WATER_PATCH.col; c < WATER_PATCH.col + WATER_PATCH.w; c++) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        grid[r][c] = (r + c) % 2 === 0 ? 'water-a' : 'water-b';
      }
    }
  }

  const paintPath = (c, r) => {
    [[0, 0], [1, 0], [0, 1], [-1, 0]].forEach(([dc, dr]) => {
      const cc = c + dc;
      const rr = r + dr;
      if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) grid[rr][cc] = 'path';
    });
  };

  for (let i = 0; i < WAYPOINTS_TILE.length - 1; i++) {
    const a = WAYPOINTS_TILE[i];
    const b = WAYPOINTS_TILE[i + 1];
    const steps = Math.max(Math.abs(b.col - a.col), Math.abs(b.row - a.row)) * 2;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const col = Math.round(a.col + (b.col - a.col) * t);
      const row = Math.round(a.row + (b.row - a.row) * t);
      paintPath(col, row);
    }
  }

  return grid;
}

export const TILE_GRID = buildTileGrid();

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
