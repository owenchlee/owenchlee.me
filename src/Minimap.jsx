import { forwardRef } from 'react';
import { WAYPOINTS_PX, HOUSES, DECOR_HOUSES, WATER_PATCHES, TILE_SIZE, WORLD_W, WORLD_H } from './tileMap';

const pathPoints = WAYPOINTS_PX.map((p) => `${p.x},${p.y}`).join(' ');

// Fixed HUD, rendered once at the app root so it stays visible over the
// overworld and every section takeover alike — the persistent thread that
// ties the whole scroll experience together as one connected space. Reads
// straight from the same tileMap.js data the overworld itself is built
// from (ponds, decor houses, path) rather than a hand-drawn stand-in, so it
// stays a real (if abstracted) map instead of a flat color swatch. The
// ~2300 individual trees are too many to plot as one shape each in a
// 100x126px widget — a tiled fleck pattern stands in for treeline texture
// without the DOM cost.
const Minimap = forwardRef(function Minimap(_props, playerDotRef) {
  return (
    <div className="minimap" aria-hidden="true">
      <svg
        className="minimap-svg"
        viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="minimap-grass" width="96" height="96" patternUnits="userSpaceOnUse">
            <rect width="96" height="96" className="minimap-bg" />
            <circle cx="16" cy="22" r="7" className="minimap-fleck" />
            <circle cx="68" cy="12" r="6" className="minimap-fleck" />
            <circle cx="46" cy="58" r="8" className="minimap-fleck" />
            <circle cx="8" cy="78" r="5" className="minimap-fleck" />
            <circle cx="80" cy="70" r="6" className="minimap-fleck" />
            <circle cx="32" cy="88" r="5" className="minimap-fleck" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#minimap-grass)" />
        {WATER_PATCHES.map((w) => (
          <ellipse
            key={`${w.col}-${w.row}`}
            cx={(w.col + w.w / 2) * TILE_SIZE}
            cy={(w.row + w.h / 2) * TILE_SIZE}
            rx={(w.w / 2) * TILE_SIZE}
            ry={(w.h / 2) * TILE_SIZE}
            className="minimap-water"
          />
        ))}
        <polyline points={pathPoints} className="minimap-path-casing" />
        <polyline points={pathPoints} className="minimap-path" />
        {DECOR_HOUSES.map((h) => (
          <rect
            key={h.id}
            x={h.col * TILE_SIZE - 22}
            y={h.row * TILE_SIZE - 22}
            width="44"
            height="44"
            rx="6"
            className="minimap-decor-house"
          />
        ))}
        {HOUSES.map((h) => (
          <g key={h.id}>
            <circle cx={h.col * TILE_SIZE} cy={h.row * TILE_SIZE} r={70} className="minimap-marker" style={{ fill: h.color }} />
            <circle cx={h.col * TILE_SIZE} cy={h.row * TILE_SIZE} r={24} className="minimap-marker-core" />
          </g>
        ))}
        <circle ref={playerDotRef} cx={WAYPOINTS_PX[0].x} cy={WAYPOINTS_PX[0].y} r={60} className="minimap-player" />
      </svg>
    </div>
  );
});

export default Minimap;
