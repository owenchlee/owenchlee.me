import { useEffect, useState } from 'react';
import { hash } from './tileMap';

// The town follows the real calendar: blossom in spring, plain green in
// summer, orange and red leaves in autumn, snow in winter. `?season=winter`
// (or spring/summer/autumn) in the URL previews one out of season.
const SEASONS = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];

function pickSeason() {
  try {
    const forced = new URLSearchParams(window.location.search).get('season');
    if (SEASONS.includes(forced)) return forced;
  } catch {
    // No URL to read — fall through to the calendar.
  }
  return SEASONS[new Date().getMonth()];
}

export const SEASON = pickSeason();

// --- Recoloring sprites ---
// Every tree and grass texture is recolored once at load, in a canvas, so
// a season costs nothing per frame. Only the leaves change: a pixel counts
// as foliage when green is clearly its strongest channel, which leaves the
// trunks, outlines and shadows alone.
const isLeaf = (r, g, b, a) => a > 0 && g > r * 1.05 && g >= b;

function hueRotate(r, g, b, deg) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const m = [
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
  ];
  return [m[0] * r + m[1] * g + m[2] * b, m[3] * r + m[4] * g + m[5] * b, m[6] * r + m[7] * g + m[8] * b];
}

const clamp = (v) => Math.min(255, Math.max(0, Math.round(v)));

function recolor(img, fn) {
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const alphaAt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : px[(y * w + x) * 4 + 3]);
  // Decide from the untouched pixels, then write, so one change can't
  // feed into the next pixel's test.
  const out = new Uint8ClampedArray(px);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const rgb = fn(px[i], px[i + 1], px[i + 2], px[i + 3], x, y, alphaAt);
      if (!rgb) continue;
      out[i] = clamp(rgb[0]);
      out[i + 1] = clamp(rgb[1]);
      out[i + 2] = clamp(rgb[2]);
    }
  }
  data.data.set(out);
  ctx.putImageData(data, 0, 0);
  return canvas;
}

const mix = (rgb, to, t) => rgb.map((v, i) => v + (to[i] - v) * t);

const SNOW = [238, 244, 248];
const SNOW_SHADE = [206, 218, 230];
const BLOSSOM = [[246, 179, 207], [239, 143, 181]];

// Autumn turns each round tree one of a few colors (picked per tree by
// treeVariant below); pines are evergreen.
const AUTUMN_HUES = [-58, -44, -30];

function treeVariants(sprite, isPine) {
  if (SEASON === 'autumn') {
    if (isPine) return [sprite];
    return AUTUMN_HUES.map((deg) =>
      recolor(sprite, (r, g, b, a) => (isLeaf(r, g, b, a) ? hueRotate(r * 1.08, g, b, deg) : null)),
    );
  }
  if (SEASON === 'winter') {
    // Snow on every top edge of the canopy, a little frost elsewhere.
    return [
      recolor(sprite, (r, g, b, a, x, y, alphaAt) => {
        if (!isLeaf(r, g, b, a)) return null;
        if (alphaAt(x, y - 1) === 0 || alphaAt(x, y - 2) === 0 || alphaAt(x, y - 3) === 0) return SNOW;
        if (alphaAt(x, y - 4) === 0 || hash(x * 1.7, y * 2.3) < 0.14) return SNOW_SHADE;
        return mix([r, g, b], [150, 175, 185], 0.45);
      }),
    ];
  }
  if (SEASON === 'spring' && !isPine) {
    return [
      recolor(sprite, (r, g, b, a, x, y) => {
        if (!isLeaf(r, g, b, a) || hash(x * 3.1, y * 2.7) > 0.24) return null;
        return BLOSSOM[(x + y) % 2];
      }),
    ];
  }
  return [sprite];
}

// One entry per tree sprite: the list of seasonal versions of it.
export function seasonTreeSprites(treeRound, treePine) {
  return { round: treeVariants(treeRound, false), pine: treeVariants(treePine, true) };
}

// Which of a sprite's seasonal versions a given tree uses — stable per
// tile, so a baked tree and its live twin always match.
export function treeVariant(tree, count) {
  return count > 1 ? Math.floor(hash(tree.col + 77, tree.row + 77) * count) % count : 0;
}

// Ground textures for the season (grass, forest floor, dirt), or the
// sprite itself when the season leaves it alone.
export function seasonGround(sprite, kind) {
  if (SEASON === 'winter') {
    const amount = { dirt: 0.35, plant: 0.5 }[kind] ?? 0.8;
    return recolor(sprite, (r, g, b) => mix([r, g, b], SNOW, amount));
  }
  if (SEASON === 'autumn' && kind === 'grass') {
    return recolor(sprite, (r, g, b) => hueRotate(r * 1.06, g, b, -10));
  }
  return sprite;
}

// Blob URLs of the seasonal tree sprites for the live <img> trees App.jsx
// renders (the same recolor the ground canvas bakes in), or null while
// they're being made / when the season leaves the trees alone.
export function useSeasonTreeUrls(roundUrl, pineUrl) {
  const [urls, setUrls] = useState(null);
  useEffect(() => {
    if (SEASON === 'summer') return undefined;
    let cancelled = false;
    const made = [];
    const load = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    const toUrl = (canvas) =>
      canvas instanceof HTMLImageElement
        ? Promise.resolve(canvas.src)
        : new Promise((resolve) =>
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              made.push(url);
              resolve(url);
            }),
          );
    Promise.all([load(roundUrl), load(pineUrl)])
      .then(([round, pine]) => {
        const sprites = seasonTreeSprites(round, pine);
        return Promise.all([Promise.all(sprites.round.map(toUrl)), Promise.all(sprites.pine.map(toUrl))]);
      })
      .then(([round, pine]) => {
        if (!cancelled) setUrls({ round, pine });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      made.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [roundUrl, pineUrl]);
  return urls;
}
