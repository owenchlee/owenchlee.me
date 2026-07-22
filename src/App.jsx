import { useEffect, useRef, useState } from 'react';
import './App.css';
import {
  TILE_SIZE,
  COLS,
  ROWS,
  WORLD_W,
  WORLD_H,
  TILE_GRID,
  HOUSES,
  DECOR_HOUSES,
  FENCES,
  NPCS,
  CRITTERS,
  WAYPOINTS_PX,
  WAYPOINT_FRACTIONS,
  TOTAL_PATH_LENGTH,
  tileToPx,
  getWorldPosition,
} from './tileMap';
import { IntroPanel, ProjectsPanel, HobbiesPanel, ContactPanel } from './sections';
import Minimap from './Minimap';
import houseIntroSprite from './assets/house-intro.png';
import houseLabSprite from './assets/house-lab.png';
import houseContactSprite from './assets/house-contact.png';
import houseHobbiesSprite from './assets/house-hobbies.png';
import npcASprite from './assets/npc-a.png';
import npcBSprite from './assets/npc-b.png';
import npcCSprite from './assets/npc-c.png';
import critterRatSprite from './assets/critter-rat.png';
import critterBirdSprite from './assets/critter-bird.png';
import houseDecorTan from './assets/house-decor-tan.png';
import houseDecorTeal from './assets/house-decor-teal.png';
import houseDecorPlum from './assets/house-decor-plum.png';
import houseDecorStone from './assets/house-decor-stone.png';
import houseDecorShop from './assets/house-decor-shop.png';
import houseDecorShopBlue from './assets/house-decor-shop-blue.png';
import houseDecorTower from './assets/house-decor-tower.png';
import charDownIdle from './assets/char/char-down-idle.png';
import charDownWalkA from './assets/char/char-down-walk-a.png';
import charDownWalkB from './assets/char/char-down-walk-b.png';
import charUpIdle from './assets/char/char-up-idle.png';
import charUpWalkA from './assets/char/char-up-walk-a.png';
import charUpWalkB from './assets/char/char-up-walk-b.png';
import charSideIdle from './assets/char/char-side-idle.png';
import charSideWalkA from './assets/char/char-side-walk-a.png';
import charSideWalkB from './assets/char/char-side-walk-b.png';

const CHAR_SPRITES = {
  down: { idle: charDownIdle, 'walk-a': charDownWalkA, 'walk-b': charDownWalkB },
  up: { idle: charUpIdle, 'walk-a': charUpWalkA, 'walk-b': charUpWalkB },
  side: { idle: charSideIdle, 'walk-a': charSideWalkA, 'walk-b': charSideWalkB },
};

const HOUSE_SPRITES = {
  'house-intro': houseIntroSprite,
  'house-lab': houseLabSprite,
  'house-contact': houseContactSprite,
  'house-hobbies': houseHobbiesSprite,
};

const NPC_SPRITES = { a: npcASprite, b: npcBSprite, c: npcCSprite };
const CRITTER_SPRITES = { rat: critterRatSprite, bird: critterBirdSprite };
const DECOR_SPRITES = {
  'house-decor-tan': houseDecorTan,
  'house-decor-teal': houseDecorTeal,
  'house-decor-plum': houseDecorPlum,
  'house-decor-stone': houseDecorStone,
  'house-decor-shop': houseDecorShop,
  'house-decor-shop-blue': houseDecorShopBlue,
  'house-decor-tower': houseDecorTower,
};

// Scroll distance scales with the actual path length so pacing stays
// consistent if the path shape changes.
const TRACK_HEIGHT = Math.round(TOTAL_PATH_LENGTH * 1.6);
// How close (as a fraction of total path progress) the character needs to be
// to a house's waypoint for that house's panel to trigger.
const HOUSE_TRIGGER_WIDTH = 0.055;

function computeProgress(trackEl) {
  const rect = trackEl.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const scrollable = rect.height - viewportH;
  return scrollable <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / scrollable));
}

function App() {
  const trackRef = useRef(null);
  const boxRef = useRef(null);
  const worldRef = useRef(null);
  const boxCenterRef = useRef({ cx: 0, cy: 0 });
  const minimapDotRef = useRef(null);
  const characterImgRef = useRef(null);
  const prevPosRef = useRef(null);
  const walkFrameRef = useRef('walk-a');
  const lastToggleRef = useRef(0);
  const facingRef = useRef({ direction: 'down', mirror: false });
  const idleTimeoutRef = useRef(null);
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
  // Strict top-down orthogonal projection — plain 2D translate, no
  // perspective/rotateX/skew. Animates `transform` only (compositor-driven,
  // no layout/paint per frame).
  useEffect(() => {
    if (!usesCss) return undefined;

    const stops = WAYPOINT_FRACTIONS.map((frac, i) => {
      const { x, y } = WAYPOINTS_PX[i];
      return `${(frac * 100).toFixed(3)}% { transform: translate3d(calc(var(--cx) - ${x}px), calc(var(--cy) - ${y}px), 0); }`;
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
      const progress = computeProgress(track);
      const { x, y } = getWorldPosition(progress);
      const { cx, cy } = boxCenterRef.current;
      world.style.transform = `translate3d(${cx - x}px, ${cy - y}px, 0)`;
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

  // House activation + minimap dot: both driven by scroll progress (not
  // screen position). A house is "active" when progress is within
  // HOUSE_TRIGGER_WIDTH of its waypoint's fraction along the path.
  // Screen-position-based detection (e.g. IntersectionObserver watching
  // where a house lands on screen) breaks once the path folds back on
  // itself — the up-right leg to Projects puts it at a smaller row than
  // Intro even though it comes later, so its projected depth could cross
  // the trigger band first. Progress is one-dimensional and always
  // monotonic, so it can't misfire like that regardless of path shape.
  // This same progress value also positions the minimap's player dot, so
  // that HUD stays in sync with the game world in both camera modes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let rafId = null;

    function update() {
      rafId = null;
      const progress = computeProgress(track);

      const match = HOUSES.find(
        (h) => Math.abs(progress - WAYPOINT_FRACTIONS[h.waypointIndex]) <= HOUSE_TRIGGER_WIDTH,
      );
      setActiveHouse((current) => {
        const next = match ? match.id : null;
        return current === next ? current : next;
      });

      const { x, y } = getWorldPosition(progress);

      if (minimapDotRef.current) {
        minimapDotRef.current.setAttribute('cx', x);
        minimapDotRef.current.setAttribute('cy', y);
      }

      // Character direction + walk-cycle frame. update() only ever runs in
      // response to an actual scroll event, so every call here implies real
      // movement — direction updates immediately every tick for
      // responsiveness, but the walk-a/walk-b frame swap is paced to a
      // human walking cadence (~140ms) rather than flickering at scroll
      // event rate. When scrolling stops, no more scroll events fire, so a
      // short timeout below falls the sprite back to its idle frame.
      const prev = prevPosRef.current;
      if (prev && characterImgRef.current) {
        const dx = x - prev.x;
        const dy = y - prev.y;
        if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {
          let direction;
          let mirror = false;
          if (Math.abs(dy) >= Math.abs(dx)) {
            direction = dy >= 0 ? 'down' : 'up';
          } else {
            direction = 'side';
            mirror = dx < 0;
          }
          facingRef.current = { direction, mirror };

          const now = performance.now();
          if (now - lastToggleRef.current > 140) {
            walkFrameRef.current = walkFrameRef.current === 'walk-a' ? 'walk-b' : 'walk-a';
            lastToggleRef.current = now;
          }

          characterImgRef.current.src = CHAR_SPRITES[direction][walkFrameRef.current];
          characterImgRef.current.style.transform = mirror ? 'scaleX(-1)' : 'none';

          if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = setTimeout(() => {
            if (!characterImgRef.current) return;
            const { direction: d, mirror: m } = facingRef.current;
            characterImgRef.current.src = CHAR_SPRITES[d].idle;
            characterImgRef.current.style.transform = m ? 'scaleX(-1)' : 'none';
          }, 150);
        }
      }
      prevPosRef.current = { x, y };
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
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <div className="stage-track" ref={trackRef} style={{ height: TRACK_HEIGHT }}>
        <header className="hud-nameplate">
          <div className="hud-name">Owen Lee</div>
          <div className="hud-role">Systems Design Engineering @ University of Waterloo</div>
        </header>

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

            {FENCES.map((post) => {
              const { x, y } = tileToPx(post.col, post.row);
              return <div key={post.id} className="fence-post" style={{ left: x, top: y }} />;
            })}

            {DECOR_HOUSES.map((house) => {
              const { x, y } = tileToPx(house.col, house.row);
              return (
                <div
                  key={house.id}
                  className={`decor-house-wrap ${house.sprite.includes('tower') ? 'decor-house-wrap--tower' : ''}`}
                  style={{ left: x, top: y }}
                >
                  <div className="building-shadow" />
                  <div className="building-foundation" />
                  <img src={DECOR_SPRITES[house.sprite]} className="decor-house" alt="" />
                </div>
              );
            })}

            {HOUSES.map((house) => {
              const { x, y } = tileToPx(house.col, house.row);
              return (
                <div
                  key={house.id}
                  className={`house house--${house.kind} house-${house.side} ${
                    activeHouse === house.id ? 'active' : ''
                  }`}
                  style={{ left: x, top: y, '--house-color': house.color }}
                >
                  <div className="building-shadow" />
                  <div className="building-foundation" />
                  <img src={HOUSE_SPRITES[house.sprite]} className="house-sprite" alt="" />
                  <span className="house-label">{house.label}</span>
                </div>
              );
            })}

            {NPCS.map((npc) => {
              const { x, y } = tileToPx(npc.col, npc.row);
              return (
                <div
                  key={npc.id}
                  className={`npc npc--${npc.axis}`}
                  style={{
                    left: x,
                    top: y,
                    '--npc-range': `${npc.range}px`,
                    '--npc-duration': `${npc.duration}s`,
                  }}
                >
                  <div className="npc-shadow" />
                  <img src={NPC_SPRITES[npc.sprite]} className="npc-sprite" alt="" />
                </div>
              );
            })}

            {CRITTERS.map((critter) => {
              const { x, y } = tileToPx(critter.col, critter.row);
              return (
                <div
                  key={critter.id}
                  className={`critter critter--${critter.axis}`}
                  style={{
                    left: x,
                    top: y,
                    '--critter-range': `${critter.range}px`,
                    '--critter-duration': `${critter.duration}s`,
                  }}
                >
                  <img src={CRITTER_SPRITES[critter.sprite]} className="critter-sprite" alt="" />
                </div>
              );
            })}
          </div>

          <div className="character-wrap">
            <div className="character-shadow" />
            <img
              ref={characterImgRef}
              className="character"
              src={CHAR_SPRITES.down.idle}
              alt=""
              aria-hidden="true"
            />
          </div>

          <IntroPanel active={activeHouse === 'intro'} />
          <ProjectsPanel active={activeHouse === 'projects'} />
          <HobbiesPanel active={activeHouse === 'hobbies'} />
          <ContactPanel active={activeHouse === 'contact'} />
        </div>
      </div>

      <footer className="page-footer">
        <p>End of prototype path.</p>
      </footer>

      <Minimap ref={minimapDotRef} />
    </>
  );
}

export default App;
