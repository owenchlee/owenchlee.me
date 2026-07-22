import { forwardRef } from 'react';
import { WAYPOINTS_PX, HOUSES, WORLD_W, WORLD_H } from './tileMap';

const pathPoints = WAYPOINTS_PX.map((p) => `${p.x},${p.y}`).join(' ');

// Fixed HUD, rendered once at the app root so it stays visible over the
// overworld and every section takeover alike — the persistent thread that
// ties the whole scroll experience together as one connected space.
const Minimap = forwardRef(function Minimap(_props, playerDotRef) {
  return (
    <div className="minimap" aria-hidden="true">
      <svg
        className="minimap-svg"
        viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="0" y="0" width={WORLD_W} height={WORLD_H} className="minimap-bg" />
        <polyline points={pathPoints} className="minimap-path" />
        {HOUSES.map((h) => (
          <circle
            key={h.id}
            cx={h.col * 32}
            cy={h.row * 32}
            r={70}
            className="minimap-marker"
            style={{ fill: h.color }}
          />
        ))}
        <circle ref={playerDotRef} cx={WAYPOINTS_PX[0].x} cy={WAYPOINTS_PX[0].y} r={60} className="minimap-player" />
      </svg>
    </div>
  );
});

export default Minimap;
