import { WORLD_W, WORLD_H } from './tileMap';

// The area inside .minimap's 3px border (App.css: 100x126, border-box),
// and the scale/offset the SVG's `slice` fit puts the world at inside it,
// so the player dot (an HTML element over the SVG) lands on the same spot
// the map draws.
const MAP_W = 94;
const MAP_H = 120;
const SCALE = Math.max(MAP_W / WORLD_W, MAP_H / WORLD_H);
const OFFSET_X = (MAP_W - WORLD_W * SCALE) / 2;
const OFFSET_Y = (MAP_H - WORLD_H * SCALE) / 2;

// World px -> px inside the minimap box.
export function minimapPoint(x, y) {
  return { x: OFFSET_X + x * SCALE, y: OFFSET_Y + y * SCALE };
}
