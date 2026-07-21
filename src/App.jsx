import { useEffect, useRef, useState } from 'react';
import './App.css';
import {
  TILE_SIZE,
  COLS,
  ROWS,
  TILE_GRID,
  HOUSES,
  WAYPOINTS_PX,
  WAYPOINT_FRACTIONS,
  TOTAL_PATH_LENGTH,
  tileToPx,
  getWorldPosition,
} from './tileMap';

const WORLD_W = COLS * TILE_SIZE;
const WORLD_H = ROWS * TILE_SIZE;
// Scroll distance scales with the actual path length so pacing stays
// consistent if the path shape changes.
const TRACK_HEIGHT = Math.round(TOTAL_PATH_LENGTH * 1.6);
// Ground-plane tilt for the angled camera look. Applied to `.world`; houses
// counter-rotate by the same amount so they stand upright on the tilted
// ground instead of lying flat with it.
const TILT_DEG = 45;

function App() {
  const trackRef = useRef(null);
  const boxRef = useRef(null);
  const worldRef = useRef(null);
  const houseRefs = useRef({});
  const boxCenterRef = useRef({ cx: 0, cy: 0 });
  const [activeHouse, setActiveHouse] = useState(null);

  const [usesCss] = useState(() => {
    const supports =
      typeof CSS !== 'undefined' &&
      CSS.supports &&
      CSS.supports('view-timeline-name', '--test');
    const forceFallback = new URLSearchParams(window.location.search).has('fallback');
    return Boolean(supports) && !forceFallback;
  });

  // Track the box's own pixel size so the camera can center on it without
  // ever animating layout-triggering properties (left/top) on scroll — only
  // `transform`, which the browser can composite on the GPU. The box is
  // measured once per resize, not per scroll frame.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;

    const updateCenter = () => {
      const { width, height } = box.getBoundingClientRect();
      boxCenterRef.current = { cx: width / 2, cy: height / 2 };
      box.style.setProperty('--cx', `${width / 2}px`);
      box.style.setProperty('--cy', `${height / 2}px`);
    };

    updateCenter();
    const observer = new ResizeObserver(updateCenter);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // CSS scroll-timeline path: inject keyframes generated from the same
  // waypoints the JS fallback uses, so both mechanisms move identically.
  // Animates `transform` only (compositor-driven, no layout/paint per frame).
  useEffect(() => {
    if (!usesCss) return undefined;

    const stops = WAYPOINT_FRACTIONS.map((frac, i) => {
      const { x, y } = WAYPOINTS_PX[i];
      return `${(frac * 100).toFixed(3)}% { transform: rotateX(${TILT_DEG}deg) translate3d(calc(var(--cx) - ${x}px), calc(var(--cy) - ${y}px), 0); }`;
    }).join('\n');

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes worldCamera {
        ${stops}
      }
      .stage-track {
        view-timeline-name: --journey;
        view-timeline-axis: block;
      }
      .world.css-driven {
        animation-name: worldCamera;
        animation-timeline: --journey;
        animation-range: contain 0% contain 100%;
        animation-fill-mode: both;
        animation-timing-function: linear;
      }
    `;
    document.head.appendChild(styleEl);
    return () => styleEl.remove();
  }, [usesCss]);

  // JS fallback path: scroll + rAF-driven, using the same getWorldPosition().
  // Also transform-only, so its performance profile matches the CSS path.
  useEffect(() => {
    if (usesCss) return undefined;

    let rafId = null;
    const track = trackRef.current;
    const world = worldRef.current;

    function update() {
      rafId = null;
      const rect = track.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const scrollable = rect.height - viewportH;
      const progress = scrollable <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / scrollable));
      const { x, y } = getWorldPosition(progress);
      const { cx, cy } = boxCenterRef.current;
      world.style.transform = `rotateX(${TILT_DEG}deg) translate3d(${cx - x}px, ${cy - y}px, 0)`;
    }

    function onScroll() {
      if (rafId == null) rafId = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [usesCss]);

  // House highlighting: IntersectionObserver watching a thin band at the
  // box's vertical center. Works the same regardless of which mechanism
  // above is driving the camera, since it reads actual rendered geometry.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.houseId;
          setActiveHouse((current) => {
            if (entry.isIntersecting) return id;
            return current === id ? null : current;
          });
        });
      },
      { root: box, rootMargin: '-48% 0px -48% 0px', threshold: 0 },
    );

    Object.values(houseRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="page-header">
        <h1>Scroll-driven overworld prototype</h1>
        <p>Scroll down to walk the path. Mechanic test only — no real content yet.</p>
        <p className="mode-badge">
          Camera driver: <strong>{usesCss ? 'CSS scroll-timeline' : 'JS fallback'}</strong>
          {' '}
          (add <code>?fallback=1</code> to the URL to force the JS path)
        </p>
      </header>

      <div className="stage-track" ref={trackRef} style={{ height: TRACK_HEIGHT }}>
        <div className="stage-box" ref={boxRef}>
          <div
            className={`world ${usesCss ? 'css-driven' : ''}`}
            ref={worldRef}
            style={{ width: WORLD_W, height: WORLD_H }}
          >
            <div
              className="tile-grid"
              style={{
                gridTemplateColumns: `repeat(${COLS}, ${TILE_SIZE}px)`,
                gridTemplateRows: `repeat(${ROWS}, ${TILE_SIZE}px)`,
              }}
            >
              {TILE_GRID.flatMap((row, r) =>
                row.map((type, c) => (
                  <div key={`${r}-${c}`} className={`tile tile-${type}`} />
                )),
              )}
            </div>

            {HOUSES.map((house) => {
              const { x, y } = tileToPx(house.col, house.row);
              return (
                <div
                  key={house.id}
                  ref={(el) => {
                    houseRefs.current[house.id] = el;
                  }}
                  data-house-id={house.id}
                  className={`house house-${house.side} ${
                    activeHouse === house.id ? 'active' : ''
                  }`}
                  style={{ left: x, top: y, '--house-color': house.color }}
                >
                  <div className="house-roof" />
                  <div className="house-body" />
                  <span className="house-label">{house.label}</span>
                </div>
              );
            })}
          </div>

          <svg
            className="character"
            viewBox="0 0 8 12"
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            <rect x="1" y="0" width="6" height="2" fill="#2a1a12" />
            <rect x="0" y="2" width="1" height="1" fill="#2a1a12" />
            <rect x="7" y="2" width="1" height="1" fill="#2a1a12" />
            <rect x="1" y="2" width="6" height="3" fill="#e3ab6d" />
            <rect x="2" y="3" width="1" height="1" fill="#1a1a1a" />
            <rect x="5" y="3" width="1" height="1" fill="#1a1a1a" />
            <rect x="3" y="5" width="2" height="1" fill="#e3ab6d" />
            <rect x="1" y="6" width="6" height="4" fill="#8a5fbf" />
            <rect x="1" y="10" width="6" height="2" fill="#26344a" />
          </svg>
        </div>
      </div>

      <footer className="page-footer">
        <p>End of prototype path.</p>
      </footer>
    </>
  );
}

export default App;
