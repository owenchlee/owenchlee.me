import { Fragment, useEffect, useRef, useState } from 'react';
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
  LAMPS,
  NPCS,
  CRITTERS,
  PET_WALKERS,
  SPORTS,
  PICNICS,
  TREES,
  WAYPOINTS_PX,
  WAYPOINT_FRACTIONS,
  TOTAL_PATH_LENGTH,
  tileToPx,
  getWorldPosition,
  getHouseFootprintWidth,
  getHouseReveal,
  getCharacterWalkT,
  getLightingTint,
  getNightAmount,
} from './tileMap';
import { ProjectsPanel, HobbiesPanel, ContactPanel } from './sections';
import { INTRO } from './content';
import { Highlighted } from './Highlighted';
import Minimap from './Minimap';
import SectionNav from './SectionNav';
import MusicPlayer from './MusicPlayer';
import QuickView from './QuickView';
// Swap for Plausible/Fathom/GA4 here if preferred — this is a zero-config
// default, not a hard architectural commitment.
import { Analytics } from '@vercel/analytics/react';
import house01 from './assets/houses/house-01.png';
import house02 from './assets/houses/house-02.png';
import house03 from './assets/houses/house-03.png';
import house04 from './assets/houses/house-04.png';
import house05 from './assets/houses/house-05.png';
import house06 from './assets/houses/house-06.png';
import house07 from './assets/houses/house-07.png';
import house08 from './assets/houses/house-08.png';
import house09 from './assets/houses/house-09.png';
import house10 from './assets/houses/house-10.png';
import house12 from './assets/houses/house-12.png';
import house13 from './assets/houses/house-13.png';
import house14 from './assets/houses/house-14.png';
import house15 from './assets/houses/house-15.png';
import house16 from './assets/houses/house-16.png';
import house17 from './assets/houses/house-17.png';
import house18 from './assets/houses/house-18.png';
import house19 from './assets/houses/house-19.png';
import npcASprite from './assets/npc-a.png';
import npcBSprite from './assets/npc-b.png';
import npcCSprite from './assets/npc-c.png';
import critterRatSprite from './assets/critter-rat.png';
import critterBirdSprite from './assets/critter-bird.png';
import petDogA from './assets/pet-dog-a.png';
import petDogB from './assets/pet-dog-b.png';
import sportsBall from './assets/sports-ball.png';
import picnicScene from './assets/picnic-scene.png';
import npcSitA from './assets/npc-sit-a.png';
import npcSitB from './assets/npc-sit-b.png';
import treeRoundSprite from './assets/tree-round-lpc.png';
import treePineSprite from './assets/tree-pine-lpc.png';
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

const NPC_SPRITES = { a: npcASprite, b: npcBSprite, c: npcCSprite };
const CRITTER_SPRITES = { rat: critterRatSprite, bird: critterBirdSprite };
const PET_SPRITES = { a: petDogA, b: petDogB };
const SIT_SPRITES = { a: npcSitA, b: npcSitB };
const TREE_SPRITES = { round: treeRoundSprite, pine: treePineSprite };
const HOUSE_SPRITES = {
  'house-01': house01,
  'house-02': house02,
  'house-03': house03,
  'house-04': house04,
  'house-05': house05,
  'house-06': house06,
  'house-07': house07,
  'house-08': house08,
  'house-09': house09,
  'house-10': house10,
  'house-12': house12,
  'house-13': house13,
  'house-14': house14,
  'house-15': house15,
  'house-16': house16,
  'house-17': house17,
  'house-18': house18,
  'house-19': house19,
};

// Scroll distance scales with the actual path length so pacing stays
// consistent if the path shape changes.
const TRACK_HEIGHT = Math.round(TOTAL_PATH_LENGTH * 2.4);

// Fraction of getCharacterWalkT's 0-1 range spent on the first leg (path to
// the yard's fence gate) before switching to the second leg (gate to the
// door) — see the pose math in the scroll effect below. Purely a scroll-
// driven split, not a timed one: at t=WALK_LEG1_END the character is exactly
// at the gate, however fast or slow the user got there.
const WALK_LEG1_END = 0.55;
// Within the second leg, the fraction of *that* leg's own progress where the
// character starts shrinking/fading — kept late so most of the walk plays at
// full size (reads as "walk to the door") and only the last bit at the door
// itself shrinks away (reads as "step inside"), instead of shrinking
// continuously across the whole distance.
const WALK_SHRINK_START = 0.7;
// Within leg 1 (see WALK_LEG1_END), the fraction of *that* leg's own
// progress before the sprite commits to facing the gate instead of the
// ambient path direction. posX/posY (the character's actual on-screen
// position) already ease smoothly from 0 the moment maxWalkT ticks above
// zero, but a sprite's facing is a discrete state (down/up/side + mirror) —
// snapping it to point at the gate at that same instant reads as "he's
// already beelining for the door" despite the body having barely nudged off
// the path. Waiting until the position shift itself is visible before
// committing the facing keeps the two in sync.
const WALK_FACING_START = 0.2;

function computeProgress(trackEl) {
  const rect = trackEl.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const scrollable = rect.height - viewportH;
  return scrollable <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / scrollable));
}

// Painter's algorithm for the overworld: every decorative sprite inside
// `.world` (trees, houses, NPCs, critters, pets, picnics) used to stack
// purely by DOM insertion order, which is why NPCs — rendered after TREES —
// always painted in front of a tree even when standing well above/behind it
// on the path. Ground-truth for "in front of" in a top-down scene is how
// far south (larger world-space Y) an entity's own ground-contact point
// sits, not the order it happens to appear in JSX, so every entity below
// gets an explicit z-index derived from that point instead. `.world`
// establishes its own stacking context (it has `transform` set — see
// App.css), so these values only ever compete with each other, never with
// unrelated UI chrome elsewhere on the page.
function zFromGroundY(groundY) {
  return Math.round(groundY);
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
  const walkPoseRef = useRef({ x: 0, y: 0, scale: 1, opacity: 1 });
  const houseElRefs = useRef({});
  const panelRefs = useRef({});
  const lastRevealRef = useRef({});
  const lightingRef = useRef(null);
  const characterWrapRef = useRef(null);
  const reducedMotionRef = useRef(false);
  const [activeHouse, setActiveHouse] = useState(null);
  const [quickView, setQuickView] = useState(false);

  // Escape closes Quick View, matching its own visible "Back to site"
  // button — only listens while the overlay is actually open.
  useEffect(() => {
    if (!quickView) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setQuickView(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quickView]);

  // While a house is fully open, its .section-panel sits on top of the
  // world (position:absolute inset:0 inside the sticky .stage-box) and is
  // itself independently scrollable — so without this, the same wheel
  // gesture could land on either the panel's own scrollbar or the page's
  // native one depending on exactly where the content happened to be
  // scrolled, and the only way to tell which was "in control" was to watch
  // which scrollbar thumb on the right edge actually moved. Redirecting
  // every wheel tick straight to the open panel's scrollTop instead — and
  // blocking the page scroll that drives the world-walk — makes it
  // unambiguous: with a section open, the wheel always browses that
  // section first. (SectionNav is also always available as an instant
  // jump.) Once the panel is already scrolled to the edge in the direction
  // the wheel is still pushing, the tick is redirected to window.scrollBy
  // instead — that's what hands control back to the page scroll so
  // continuing to scroll down (or up) walks the character back out of the
  // house and on toward the next one, rather than trapping the visitor
  // inside whichever section they scrolled into. This can't just be a matter
  // of letting the native event through unprevented: .section-panel's
  // scrollable ancestor chain dead-ends at .stage-box (overflow:hidden, by
  // design — it's sticky-positioned and isn't the element the page actually
  // scrolls), so there's no DOM path for the browser's own scroll-chaining
  // to ever reach `window`, and the tick would just be swallowed. Skipped
  // while Quick View's own overlay is open so its independent scroll isn't
  // hijacked.
  useEffect(() => {
    if (!activeHouse) return undefined;
    function redirectDelta(deltaY) {
      const panelEl = panelRefs.current[activeHouse];
      if (!panelEl) return;
      const atTop = panelEl.scrollTop <= 0;
      const atBottom = panelEl.scrollTop + panelEl.clientHeight >= panelEl.scrollHeight - 1;
      if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
        window.scrollBy(0, deltaY);
        return;
      }
      panelEl.scrollTop += deltaY;
    }
    function onWheel(e) {
      if (e.target.closest('.quick-view')) return;
      e.preventDefault();
      redirectDelta(e.deltaY);
    }
    // Touch equivalent of onWheel above: touch devices never fire 'wheel',
    // so without this a swipe that reaches the open panel's scroll edge has
    // nowhere to go — native touch-scroll chaining dead-ends at
    // .stage-box's overflow:hidden exactly like the wheel case did.
    let lastTouchY = null;
    function onTouchStart(e) {
      if (e.target.closest('.quick-view')) return;
      lastTouchY = e.touches[0].clientY;
    }
    function onTouchMove(e) {
      if (e.target.closest('.quick-view') || lastTouchY == null) return;
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentY;
      lastTouchY = currentY;
      e.preventDefault();
      redirectDelta(deltaY);
    }
    function onTouchEnd() {
      lastTouchY = null;
    }
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeHouse]);

  // Which way the character should face to cover a given (dx, dy) leg —
  // side + mirrored if that leg is mostly horizontal, else up/down.
  function directionFromDelta(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) return { direction: 'side', mirror: dx < 0 };
    return { direction: dy < 0 ? 'up' : 'down', mirror: false };
  }

  // Read once + subscribe: everything that consumes this ref lives inside a
  // scroll-driven update() loop, so a plain mutable ref (not state) avoids
  // re-running/re-rendering anything when the OS-level setting changes.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mql.matches;
    const onChange = (e) => {
      reducedMotionRef.current = e.matches;
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

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
  // screen position). Screen-position-based detection (e.g.
  // IntersectionObserver watching where a house lands on screen) breaks once
  // the path folds back on itself — the down-left leg to Hobbies puts it at
  // a smaller col than Contact even though it comes earlier, so its
  // projected depth could cross the trigger band first. Progress is one-dimensional
  // and always monotonic, so it can't misfire like that regardless of path
  // shape. This same progress value also positions the minimap's player dot,
  // so that HUD stays in sync with the game world in both camera modes.
  //
  // Each house's reveal (0-1, from getHouseReveal) is written straight to
  // its house element and section panel via CSS custom properties every
  // tick — never through React state — so the panel's clip-path/opacity and
  // the house's scale/glow track actual scroll speed instead of snapping on
  // a boolean and then playing out on their own fixed-duration timer. State
  // (`activeHouse`) is only used for the few things that must be a hard
  // on/off: pointer-events on the panel and the label's color swap.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let rafId = null;

    function update() {
      rafId = null;
      const progress = computeProgress(track);
      const reducedMotion = reducedMotionRef.current;

      let fullyOpenId = null;
      let maxWalkT = 0;
      let walkGate = null;
      let walkDoor = null;
      HOUSES.forEach((h) => {
        const waypointFraction = WAYPOINT_FRACTIONS[h.waypointIndex];
        const reveal = getHouseReveal(progress, waypointFraction, { reducedMotion });
        if (reveal >= 1) fullyOpenId = h.id;

        const walkT = getCharacterWalkT(progress, waypointFraction, { reducedMotion });
        if (walkT > maxWalkT) {
          maxWalkT = walkT;
          const waypointPx = WAYPOINTS_PX[h.waypointIndex];
          const gatePx = tileToPx(h.col, h.row + 3);
          const doorPx = tileToPx(h.col, h.row + 2);
          walkGate = { x: gatePx.x - waypointPx.x, y: gatePx.y - waypointPx.y };
          walkDoor = { x: doorPx.x - waypointPx.x, y: doorPx.y - waypointPx.y };
        }

        if (lastRevealRef.current[h.id] === reveal) return;
        lastRevealRef.current[h.id] = reveal;

        houseElRefs.current[h.id]?.style.setProperty('--house-reveal', reveal);
        // The panel's iris opens at 50% 50% — screen-center, i.e. wherever
        // the character/camera currently is, not wherever the house's
        // sprite happens to sit on screen. Early in the shoulder (small
        // reveal), the house itself is still visually far off, but the
        // panel's low-opacity text was already legible right at the
        // character's position, reading as "already inside" a building
        // that's nowhere near them yet. Squaring the (already-smoothstepped)
        // reveal keeps panel opacity near-zero through the outer half of the
        // approach and saves the visible ramp for the inner half, without
        // touching the in-world house glow (--house-reveal above), the band
        // width, or the arrival/exit symmetry.
        panelRefs.current[h.id]?.style.setProperty('--reveal', reveal * reveal);
      });

      setActiveHouse((current) => (current === fullyOpenId ? current : fullyOpenId));

      // Character walk-to-the-door pose: a pure function of maxWalkT (itself
      // a pure function of scroll progress — see getCharacterWalkT), two legs
      // — path -> gate -> door, see WALK_LEG1_END — recomputed from scratch
      // every scroll tick. The *target* pose is never a timer or an animation
      // that plays once triggered: every bit of scroll moves the target by
      // exactly that much. But a single native scroll event can jump progress
      // clean across the whole reveal band (a brisk flick easily covers it
      // in under one frame), which used to make the character teleport
      // straight from "on the path" to "at the door" with no visible walk in
      // between. The *rendered* pose below eases toward that target a few
      // frames at a time so the walk is visible even under a big jump, while
      // still settling in well under 300ms — nowhere near the fixed-duration
      // "keeps walking 2s after you stopped scrolling" animation this was
      // built to replace. Scrolling back out runs the same math with a
      // shrinking maxWalkT, so the walk-out is the walk-in in reverse.
      let walkFacing = null;
      let walkTarget;
      if (maxWalkT > 0 && walkGate && walkDoor) {
        let posX;
        let posY;
        let doorLegT = 0;
        if (maxWalkT <= WALK_LEG1_END) {
          const legT = maxWalkT / WALK_LEG1_END;
          posX = walkGate.x * legT;
          posY = walkGate.y * legT;
          if (legT >= WALK_FACING_START) {
            walkFacing = directionFromDelta(walkGate.x, walkGate.y);
          }
        } else {
          doorLegT = (maxWalkT - WALK_LEG1_END) / (1 - WALK_LEG1_END);
          posX = walkGate.x + (walkDoor.x - walkGate.x) * doorLegT;
          posY = walkGate.y + (walkDoor.y - walkGate.y) * doorLegT;
          walkFacing = directionFromDelta(walkDoor.x - walkGate.x, walkDoor.y - walkGate.y);
        }
        const shrinkT = doorLegT < WALK_SHRINK_START ? 0 : (doorLegT - WALK_SHRINK_START) / (1 - WALK_SHRINK_START);
        walkTarget = { x: posX, y: posY, scale: 1 - shrinkT * 0.7, opacity: 1 - shrinkT };
      } else {
        walkTarget = { x: 0, y: 0, scale: 1, opacity: 1 };
      }

      const pose = walkPoseRef.current;
      if (reducedMotion) {
        pose.x = walkTarget.x;
        pose.y = walkTarget.y;
        pose.scale = walkTarget.scale;
        pose.opacity = walkTarget.opacity;
      } else {
        const WALK_EASE = 0.35;
        pose.x += (walkTarget.x - pose.x) * WALK_EASE;
        pose.y += (walkTarget.y - pose.y) * WALK_EASE;
        pose.scale += (walkTarget.scale - pose.scale) * WALK_EASE;
        pose.opacity += (walkTarget.opacity - pose.opacity) * WALK_EASE;
      }

      if (characterWrapRef.current) {
        characterWrapRef.current.style.transform = `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) scale(${pose.scale})`;
        characterWrapRef.current.style.opacity = String(pose.opacity);
      }

      const walkSettled =
        Math.abs(walkTarget.x - pose.x) < 0.5 &&
        Math.abs(walkTarget.y - pose.y) < 0.5 &&
        Math.abs(walkTarget.scale - pose.scale) < 0.004 &&
        Math.abs(walkTarget.opacity - pose.opacity) < 0.004;
      if (!walkSettled && rafId == null) {
        rafId = requestAnimationFrame(update);
      }

      const { x, y } = getWorldPosition(progress);

      if (lightingRef.current) {
        lightingRef.current.style.backgroundColor = getLightingTint(progress);
      }

      // Written on :root so any element in the scene — lamp posts, house
      // windows — can react to the same night amount via an inherited
      // var(--night).
      const nightAmount = getNightAmount(progress);
      document.documentElement.style.setProperty('--night', nightAmount);

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
      // walkFacing (computed above) overrides the normal path-direction
      // facing while approaching/leaving a house, so the sprite faces the
      // gate/door instead of whichever way the path itself happens to bend.
      const prev = prevPosRef.current;
      if (prev && characterImgRef.current) {
        const dx = x - prev.x;
        const dy = y - prev.y;
        if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {
          let direction;
          let mirror = false;
          if (walkFacing) {
            direction = walkFacing.direction;
            mirror = walkFacing.mirror;
          } else if (Math.abs(dy) >= Math.abs(dx)) {
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

  // Lets both the corner nav (click a section) and any other future entry
  // point jump straight to a waypoint without walking the route — computed
  // from the track's live position rather than a cached one so it stays
  // correct regardless of where the page is currently scrolled from.
  function jumpToProgress(fraction) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return;
    const trackTopInDocument = rect.top + window.scrollY;
    const targetY = trackTopInDocument + fraction * scrollable;
    window.scrollTo({ top: targetY, behavior: reducedMotionRef.current ? 'auto' : 'smooth' });
  }

  return (
    <>
      <div aria-hidden={quickView || undefined} inert={quickView || undefined}>
      <div className="stage-track" ref={trackRef} style={{ height: TRACK_HEIGHT }}>
        <header className="hud-nameplate">
          <div className="hud-textbox">
            <div className="hud-name">{INTRO.name}</div>
            <div className="hud-role">
              <span className="hud-tag hud-tag--role" style={{ '--tag-color': '#e0b23c' }}>
                {INTRO.roleTitle}
              </span>{' '}
              @ {INTRO.roleOrg}
            </div>
            {INTRO.status && <div className="hud-status">{INTRO.status}</div>}
            {INTRO.bio && (
              <p className="hud-bio">
                <Highlighted text={INTRO.bio} />
              </p>
            )}
          </div>
        </header>

        <div className="hud-cta-block">
          <button
            type="button"
            className="hud-cta"
            onClick={() => {
              const projectsHouse = HOUSES.find((h) => h.id === 'projects');
              jumpToProgress(WAYPOINT_FRACTIONS[projectsHouse.waypointIndex]);
            }}
          >
            See My Projects →
          </button>
          <p className="hud-scroll-hint">or scroll for the adventure ↓</p>
        </div>

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
                  <div
                    key={`${r}-${c}`}
                    className={`tile tile-${type}`}
                    style={type === 'water' ? { animationDelay: `${((r * 7 + c * 13) % 5) * -0.4}s` } : undefined}
                  />
                )),
              )}
            </div>

            {FENCES.map((post) => {
              const { x, y } = tileToPx(post.col, post.row);
              return (
                <div
                  key={post.id}
                  className={`fence-post fence-post--${post.orientation}`}
                  style={{ left: x, top: y }}
                />
              );
            })}

            {LAMPS.map((lamp) => {
              const { x, y } = tileToPx(lamp.col, lamp.row);
              return (
                <div key={lamp.id} className="lamp-post" style={{ left: x, top: y }}>
                  <div className="lamp-glow" />
                  <div className="lamp-bulb" />
                  <div className="lamp-pole" />
                </div>
              );
            })}

            {DECOR_HOUSES.map((house) => {
              const { x, y } = tileToPx(house.col, house.row);
              const footprint = getHouseFootprintWidth(house.sprite, 60);
              return (
                <div
                  key={house.id}
                  className="decor-house-wrap"
                  style={{ left: x, top: y, '--footprint-w': `${footprint}px`, zIndex: zFromGroundY(y + 70) }}
                >
                  <div className="building-shadow" />
                  <div className="building-foundation" />
                  <img src={HOUSE_SPRITES[house.sprite]} className="decor-house" alt="" />
                  <div className="building-window-glow" />
                </div>
              );
            })}

            {HOUSES.map((house) => {
              const { x, y } = tileToPx(house.col, house.row);
              const footprint = getHouseFootprintWidth(house.sprite, 70);
              return (
                <div
                  key={house.id}
                  ref={(el) => {
                    houseElRefs.current[house.id] = el;
                  }}
                  className={`house house--${house.kind} house-${house.side} ${
                    activeHouse === house.id ? 'active' : ''
                  }`}
                  style={{
                    left: x,
                    top: y,
                    '--house-color': house.color,
                    '--footprint-w': `${footprint}px`,
                    zIndex: zFromGroundY(y + 70),
                  }}
                >
                  <div className="building-shadow" />
                  <div className="building-foundation" />
                  <img src={HOUSE_SPRITES[house.sprite]} className="house-sprite" alt="" />
                  <div className="building-window-glow" />
                  <span className="house-label">{house.label}</span>
                </div>
              );
            })}

            {TREES.map((tree, i) => {
              const { x, y } = tileToPx(tree.col, tree.row);
              const groundY = y + TILE_SIZE;
              return (
                <img
                  key={`tree-${i}`}
                  src={TREE_SPRITES[tree.variant]}
                  className="tree"
                  style={{ left: x + TILE_SIZE / 2, top: groundY, zIndex: zFromGroundY(groundY) }}
                  alt=""
                />
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
                    zIndex: zFromGroundY(y + 40),
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
                    zIndex: zFromGroundY(y + 18),
                  }}
                >
                  <img src={CRITTER_SPRITES[critter.sprite]} className="critter-sprite" alt="" />
                </div>
              );
            })}

            {PET_WALKERS.map((pet) => {
              const { x, y } = tileToPx(pet.col, pet.row);
              return (
                <div
                  key={pet.id}
                  className={`npc npc--${pet.axis}`}
                  style={{
                    left: x,
                    top: y,
                    '--npc-range': `${pet.range}px`,
                    '--npc-duration': `${pet.duration}s`,
                    zIndex: zFromGroundY(y + 40),
                  }}
                >
                  <div className="npc-shadow" />
                  <img src={NPC_SPRITES[pet.npcSprite]} className="npc-sprite" alt="" />
                  <div className="pet-leash" />
                  <img src={PET_SPRITES[pet.dogSprite]} className="pet-dog" alt="" />
                </div>
              );
            })}

            {SPORTS.map((s) => {
              const p1 = tileToPx(s.col, s.row);
              const p2 = tileToPx(s.col + s.gap, s.row);
              const z1 = zFromGroundY(p1.y + 40);
              const z2 = zFromGroundY(p2.y + 40);
              return (
                <Fragment key={s.id}>
                  <div className="npc" style={{ left: p1.x, top: p1.y, zIndex: z1 }}>
                    <div className="npc-shadow" />
                    <img src={NPC_SPRITES[s.npc1Sprite]} className="npc-sprite" alt="" />
                  </div>
                  <div className="npc" style={{ left: p2.x, top: p2.y, zIndex: z2 }}>
                    <div className="npc-shadow" />
                    <img src={NPC_SPRITES[s.npc2Sprite]} className="npc-sprite" alt="" />
                  </div>
                  <img
                    src={sportsBall}
                    className="sports-ball"
                    style={{
                      left: p1.x + 14,
                      top: p1.y + 18,
                      '--ball-dx': `${p2.x - p1.x}px`,
                      zIndex: Math.max(z1, z2) + 1,
                    }}
                    alt=""
                  />
                </Fragment>
              );
            })}

            {PICNICS.map((p) => {
              const { x, y } = tileToPx(p.col, p.row);
              return (
                <div key={p.id} className="picnic-scene" style={{ left: x, top: y, zIndex: zFromGroundY(y + 24) }}>
                  <img src={picnicScene} className="picnic-blanket" alt="" />
                  <img src={SIT_SPRITES[p.sitterA]} className="picnic-sitter picnic-sitter--a" alt="" />
                  <img src={SIT_SPRITES[p.sitterB]} className="picnic-sitter picnic-sitter--b" alt="" />
                </div>
              );
            })}
          </div>

          <div className="lighting-overlay" ref={lightingRef} aria-hidden="true" />

          <div className="character-wrap" ref={characterWrapRef}>
            <div className="character-shadow" />
            <img
              ref={characterImgRef}
              className="character"
              src={CHAR_SPRITES.down.idle}
              alt=""
              aria-hidden="true"
            />
          </div>

          <ProjectsPanel
            ref={(el) => {
              panelRefs.current.projects = el;
            }}
            active={activeHouse === 'projects'}
          />
          <HobbiesPanel
            ref={(el) => {
              panelRefs.current.hobbies = el;
            }}
            active={activeHouse === 'hobbies'}
          />
          <ContactPanel
            ref={(el) => {
              panelRefs.current.contact = el;
            }}
            active={activeHouse === 'contact'}
          />
        </div>
      </div>

      <SectionNav activeId={activeHouse} onJump={jumpToProgress} />
      <Minimap ref={minimapDotRef} />
      <MusicPlayer />
      </div>

      <button
        type="button"
        className="quick-view-toggle"
        onClick={() => setQuickView(true)}
        aria-pressed={quickView}
      >
        Quick View
      </button>

      {quickView && <QuickView onClose={() => setQuickView(false)} />}

      <Analytics />
    </>
  );
}

export default App;
