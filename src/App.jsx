import { Fragment, useEffect, useRef, useState } from 'react';
import './App.css';
import {
  TILE_SIZE,
  WORLD_W,
  WORLD_H,
  TILE_GRID,
  WATER_PATCHES,
  HOUSES,
  DECOR_HOUSES,
  FENCES,
  BARRIERS,
  LAMPS,
  NPCS,
  CRITTERS,
  PET_WALKERS,
  SPORTS,
  PICNICS,
  SIGNS,
  NOTICE_BOARD,
  WORKSHOP,
  LIVE_TREES,
  WAYPOINTS_PX,
  WAYPOINT_FRACTIONS,
  TOTAL_PATH_LENGTH,
  tileToPx,
  getWorldPosition,
  getHouseFootprintWidth,
  nearestProgressOnPath,
  pathPointsBetween,
  getLightingTint,
  getNightAmount,
} from './tileMap';
import { ProjectsPanel, ExperiencePanel, HobbiesPanel, ContactPanel } from './sections';
import { INTRO, RESUME_URL } from './content';
import { Highlighted } from './Highlighted';
import Minimap, { minimapPoint } from './Minimap';
import SectionNav from './SectionNav';
import MusicPlayer from './MusicPlayer';
import GroundCanvas from './GroundCanvas';
import QuickView from './QuickView';
import { BadgeCase, BadgeToast } from './Badges';
import { earnBadge, installLinkTracking } from './achievements';
import DialogueBox from './DialogueBox';
import { openDialogue, advanceDialogue, closeDialogue, getDialogue, isObjectTalk } from './dialogue';
import FishingBox from './FishingBox';
import { startFishing, fishingAction, stopFishing, getFishing } from './fishing';
import Workshop from './Workshop';
import NowLog from './NowLog';
import PackOpener from './PackOpener';
import { usePackOpener, closePackOpener } from './packs';
import { useSecrets, isWorkshopOpen, installKonami, findSecret } from './secrets';
import { playStep, playDoor, playTalk, playKnock } from './sfx';
import { SEASON, treeVariant, useSeasonTreeUrls } from './season';
import SeasonFx from './SeasonFx';
import { ParticleBurst } from './Badges';
// Swap for Plausible/Fathom/GA4 here if preferred — this is a zero-config
// default, not a hard architectural commitment.
import { Analytics } from '@vercel/analytics/react';
import house01 from './assets/houses/house-01.png';
import house02 from './assets/houses/house-02.png';
import workshopShed from './assets/houses/workshop-shed.png';
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
const TREE_SPRITES = { round: treeRoundSprite, pine: treePineSprite };

// The ponds are the only animated part of the ground, so each one is a
// live element, slotted under GroundCanvas's chunks (which leave the water
// clear) so trees on the bank still overhang it. A pond's clip-path is
// built from its actual water tiles (not just its rectangle) so it keeps
// the nicked corners and any path that cuts across it stays dry.
const PONDS = WATER_PATCHES.map((p) => {
  let d = '';
  for (let r = p.row; r < p.row + p.h; r++) {
    for (let c = p.col; c < p.col + p.w; c++) {
      if (TILE_GRID[r]?.[c] !== 'water') continue;
      d += `M${(c - p.col) * TILE_SIZE} ${(r - p.row) * TILE_SIZE}h${TILE_SIZE}v${TILE_SIZE}h-${TILE_SIZE}z`;
    }
  }
  return {
    id: `pond-${p.col}-${p.row}`,
    left: p.col * TILE_SIZE,
    top: p.row * TILE_SIZE,
    width: p.w * TILE_SIZE,
    height: p.h * TILE_SIZE,
    clipPath: `path('${d}')`,
  };
});
const HOUSE_SPRITES = {
  'house-01': house01,
  'house-02': house02,
  'workshop-shed': workshopShed,
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

// Top walking pace along the path, in world px per second — converted to
// progress via TOTAL_PATH_LENGTH so pacing stays consistent if the path
// shape changes. Roughly a Pokémon "running shoes" pace for this tile size.
const WALK_SPEED = 340;
// Long trips (a SectionNav jump across the map, a tap far down the route)
// speed up so no single walk takes longer than this — a brisk jog rather
// than making the visitor wait out the whole route at walking pace.
const MAX_TRIP_S = 2.4;
// Speed ramps up over the first few frames and eases off into the stop
// (px/s²) instead of snapping between standing and full speed, which reads
// as sliding. The stop never slows below WALK_MIN_SPEED so the last few
// pixels don't creep.
const WALK_ACCEL = 2600;
const WALK_DECEL = 2000;
const WALK_MIN_SPEED = 70;
// Classic 4-beat top-down walk cycle: step, stand, other step, stand.
const WALK_CYCLE = ['walk-a', 'idle', 'walk-b', 'idle'];
// Time each walk-cycle frame is held at WALK_SPEED; scales with actual
// speed so the feet keep up on a jog and don't flail when easing to a stop.
const WALK_FRAME_MS = 95;

// Time from standing on the path outside a house to its panel fully open
// (and the same again walking back out). houseT runs 0-1 over this: the
// first HOUSE_WALK_PORTION of it is the gate -> door walk, and the panel's
// iris opens over the tail starting at HOUSE_IRIS_START, overlapping the
// last bit of the walk so stepping through the door and the room opening
// read as one motion.
const HOUSE_ENTER_MS = 1300;
const HOUSE_WALK_PORTION = 0.7;
const HOUSE_IRIS_START = 0.6;

// How close (world px along the path) the character has to be standing to
// a house's waypoint for that house to count as "right here" — highlights
// its label as a tap/Enter prompt and lets Enter step inside.
const NEAR_HOUSE_PX = 40;

// Arrow-key step, in world px along the path, per keydown (auto-repeat
// while held keeps extending the target, so holding a key walks).
const KEY_STEP_PX = 96;

// Once a press has moved further than this it's a drag, which steers the
// character toward wherever the pointer currently is.
const DRAG_SLOP_PX = 8;

// Rendered sprite heights for checkpoint and decor buildings — kept in sync
// with .house-sprite/.decor-house in App.css, and used to size each
// building's foundation/shadow off its real on-screen width.
const HOUSE_SPRITE_H = 104;
const DECOR_SPRITE_H = 88;

// Within the walk portion of houseT (see HOUSE_WALK_PORTION), the fraction
// spent on the first leg (path to the yard's fence gate) before switching
// to the second leg (gate to the door).
const WALK_LEG1_END = 0.55;
// Within the second leg, the fraction of *that* leg's own progress where the
// character starts shrinking/fading — kept late so most of the walk plays at
// full size (reads as "walk to the door") and only the last bit at the door
// itself shrinks away (reads as "step inside").
const WALK_SHRINK_START = 0.7;

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Which way the character should face to cover a given (dx, dy) leg —
// side + mirrored if that leg is mostly horizontal, else up/down.
function directionFromDelta(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return { direction: 'side', mirror: dx < 0 };
  return { direction: dy < 0 ? 'up' : 'down', mirror: false };
}

function houseProgress(id) {
  const house = HOUSES.find((h) => h.id === id);
  return WAYPOINT_FRACTIONS[house.waypointIndex];
}

// The center of the gap in a house's front fence (yardFence in tileMap.js
// leaves out the post at h.col on the bottom row) — where the destination
// marker sits when a house is the target, and the first leg of the walk in.
function houseGatePx(house) {
  const { x, y } = tileToPx(house.col, house.row + 3);
  return { x: x + TILE_SIZE / 2, y: y + TILE_SIZE / 2 };
}

// The doorstep: straight up from the gate to the building's base.
function houseDoorPx(house) {
  const { x, y } = tileToPx(house.col, house.row + 2);
  return { x: x + TILE_SIZE / 2, y: y + TILE_SIZE / 2 };
}

// Deep links: owenchlee.me/#projects (etc.) opens straight into that
// room, and the hash follows whichever room is open, so a room can be
// shared as a link.
const HOUSE_IDS = new Set(HOUSES.map((h) => h.id));

function houseFromHash() {
  const id = window.location.hash.slice(1);
  return HOUSE_IDS.has(id) ? id : null;
}

function isWaterAt(world) {
  const c = Math.floor(world.x / TILE_SIZE);
  const r = Math.floor(world.y / TILE_SIZE);
  return TILE_GRID[r]?.[c] === 'water';
}

// Until the welcome sign has been read once, it carries a bouncing "!"
// and the HUD points at it, so a first-time visitor knows where to start.
const WELCOME_KEY = 'welcome-read-v1';

function readWelcomeSeen() {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1';
  } catch {
    return false;
  }
}

function nearbyHouseId(progress) {
  const near = HOUSES.find(
    (h) => Math.abs(progress - WAYPOINT_FRACTIONS[h.waypointIndex]) * TOTAL_PATH_LENGTH <= NEAR_HOUSE_PX,
  );
  return near ? near.id : null;
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
  const stageRef = useRef(null);
  const boxRef = useRef(null);
  const worldRef = useRef(null);
  const boxCenterRef = useRef({ cx: 0, cy: 0 });
  const minimapDotRef = useRef(null);
  const groundRef = useRef(null);
  const characterImgRef = useRef(null);
  const facingRef = useRef({ direction: 'down', mirror: false });
  const houseElRefs = useRef({});
  const panelRefs = useRef({});
  const lastRevealRef = useRef({});
  const lightingRef = useRef(null);
  const characterWrapRef = useRef(null);
  const tapRippleRef = useRef(null);
  const destMarkerRef = useRef(null);
  const destGhostRef = useRef(null);
  const routeRef = useRef(null);
  const routeShadowRef = useRef(null);
  const reducedMotionRef = useRef(false);
  // Movement state. `progress` (0-1 along the path) is the single value the
  // camera, lighting, night sky and minimap all key off — advanced toward
  // `targetProgress` a little each animation frame. `houseT` (0-1) is how
  // far into the house in `houseIdRef` the character is: walking from the
  // path to the door, then the panel opening. The character only walks the
  // path while fully outside (houseT === 0), so tapping elsewhere while
  // inside first walks back out, then heads there.
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const houseTRef = useRef(0);
  const houseTargetRef = useRef(0);
  const houseIdRef = useRef(null);
  const pendingHouseRef = useRef(null);
  const tripSpeedRef = useRef(WALK_SPEED);
  const velocityRef = useRef(0);
  const kickRef = useRef(() => {});
  // The active press: where it started, and whether it has turned into a
  // steering drag yet.
  const pressRef = useRef(null);
  // Where the destination marker currently points: 'path' (a spot on the
  // route), 'house' (a house's gate) or null when hidden.
  const destKindRef = useRef(null);
  const [activeHouse, setActiveHouse] = useState(null);
  // Standing at the start of the path (outside any house) — lights up the
  // Intro entry in SectionNav.
  const [atSpawn, setAtSpawn] = useState(true);
  // The world is tuned for a desktop-sized stage-box and gets tight/
  // overlapping on phones, so small screens land straight on Quick View (a
  // plain layout of the same content) instead of the game camera. Checked
  // once on mount, not on resize — this is about the device the page loaded
  // on, not a live viewport-width reaction. Also passed to QuickView so its
  // close button can read correctly either way: "back to site" for someone
  // who opened it from the world, "explore the interactive world" for
  // someone who landed here first.
  const [isMobileLanding] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const [quickView, setQuickView] = useState(isMobileLanding);
  const [welcomeSeen, setWelcomeSeen] = useState(readWelcomeSeen);
  const [workshopOpen, setWorkshopOpen] = useState(false);
  const [nowLogOpen, setNowLogOpen] = useState(false);
  const packOpen = usePackOpener();
  // Timestamp of the last secret found (0 = none showing), doubling as the
  // confetti's key so a second find replays it.
  const [secretBurst, setSecretBurst] = useState(0);
  const secrets = useSecrets();
  const hasFished = Object.keys(secrets.fish).length > 0 || Boolean(secrets.found.key);
  const workshopUnlocked = isWorkshopOpen(secrets);
  const seasonTrees = useSeasonTreeUrls(treeRoundSprite, treePineSprite);

  function talkTo(id) {
    stopFishing();
    if (isObjectTalk(id)) playKnock();
    else playTalk();
    // The NOW board opens its monthly log instead of a dialogue line.
    if (id === 'now-board') {
      closeDialogue();
      setNowLogOpen(true);
      return;
    }
    if (getDialogue()?.id === id) {
      advanceDialogue();
      return;
    }
    openDialogue(id);
    if (id === 'sign-welcome' && !welcomeSeen) {
      setWelcomeSeen(true);
      try {
        localStorage.setItem(WELCOME_KEY, '1');
      } catch {
        // Non-fatal: the hint just shows again next visit.
      }
    }
  }

  function enterWorkshop() {
    closeDialogue();
    stopFishing();
    if (!isWorkshopOpen()) {
      openDialogue('workshop-locked');
      return;
    }
    if (findSecret('workshop')) setSecretBurst(Date.now());
    setWorkshopOpen(true);
  }

  function setWalkTarget(progress) {
    targetProgressRef.current = clamp01(progress);
    const tripPx = Math.abs(targetProgressRef.current - progressRef.current) * TOTAL_PATH_LENGTH;
    tripSpeedRef.current = Math.max(WALK_SPEED, tripPx / MAX_TRIP_S);
  }

  // Destination marker: a pulsing tile plus a bouncing arrow on the spot the
  // character is heading to, which stays up for the whole walk (the RPG
  // Maker "destination sprite" convention) and pops when they arrive. A
  // house target tints it in that house's color, parks the tile on the
  // gate and floats the arrow up over the roof (`arrowLift` px higher), so
  // it reads as "into this building" and never sits on the sprite itself.
  function showDestination(x, y, color, arrowLift = 0, houseId = null) {
    const marker = destMarkerRef.current;
    if (!marker) return;
    setTargetedHouse(houseId);
    marker.classList.toggle('house-target', Boolean(houseId));
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.style.setProperty('--marker-color', color || 'var(--pal-cream)');
    marker.style.setProperty('--arrow-lift', `${arrowLift}px`);
    if (!marker.classList.contains('active') || marker.classList.contains('arrive')) {
      marker.classList.remove('arrive', 'active');
      // Reflow so the drop-in animation replays for a fresh destination.
      void marker.offsetWidth;
      marker.classList.add('active');
    }
  }

  // The house being walked to glows and shows its colored label (instead of
  // a ground tile that would cover that label).
  function setTargetedHouse(id) {
    HOUSES.forEach((h) => houseElRefs.current[h.id]?.classList.toggle('targeted', h.id === id));
  }

  function goToProgress(progress, { marker = true } = {}) {
    pendingHouseRef.current = null;
    setWalkTarget(progress);
    if (houseTRef.current > 0) houseTargetRef.current = 0;
    if (marker) {
      const { x, y } = getWorldPosition(targetProgressRef.current);
      destKindRef.current = 'path';
      showDestination(x, y);
    } else if (destKindRef.current) {
      // Keyboard steps don't get a marker — clear any left over from an
      // earlier tap so it doesn't point at a spot no longer being walked to.
      destKindRef.current = null;
      destMarkerRef.current?.classList.remove('active', 'arrive');
      setTargetedHouse(null);
    }
    kickRef.current();
  }

  function goToHouse(id) {
    closeDialogue();
    stopFishing();
    const house = HOUSES.find((h) => h.id === id);
    if (houseIdRef.current === id) {
      // Already in (or walking in/out of) this one — just head inside.
      pendingHouseRef.current = null;
      houseTargetRef.current = 1;
    } else {
      pendingHouseRef.current = id;
      setWalkTarget(houseProgress(id));
      if (houseTRef.current > 0) houseTargetRef.current = 0;
    }
    const gate = houseGatePx(house);
    // The sprite's top edge: .house is a 74px box at the house tile with the
    // sprite overflowing upward from its bottom.
    const roofY = tileToPx(house.col, house.row).y + 74 - HOUSE_SPRITE_H;
    destKindRef.current = 'house';
    showDestination(gate.x, gate.y, house.color, gate.y - roofY - 20, house.id);
    kickRef.current();
  }

  function leaveHouse() {
    pendingHouseRef.current = null;
    houseTargetRef.current = 0;
    kickRef.current();
  }

  function playTapRipple(clientX, clientY) {
    const ripple = tapRippleRef.current;
    const box = boxRef.current;
    if (!ripple || !box) return;
    const rect = box.getBoundingClientRect();
    ripple.style.left = `${clientX - rect.left}px`;
    ripple.style.top = `${clientY - rect.top}px`;
    ripple.classList.remove('show');
    void ripple.offsetWidth;
    ripple.classList.add('show');
  }

  // Screen point -> world point, through the camera (which is always
  // centered on the character's spot on the path).
  function toWorld(clientX, clientY) {
    const rect = boxRef.current.getBoundingClientRect();
    const cam = getWorldPosition(progressRef.current);
    const { cx, cy } = boxCenterRef.current;
    return { x: clientX - rect.left - cx + cam.x, y: clientY - rect.top - cy + cam.y };
  }

  // Generous hit area around each checkpoint (the building plus its yard
  // down to the gate), so tapping near a house counts, not just its exact
  // sprite pixels.
  function houseAt(target, world) {
    const houseEl = target.closest?.('[data-house-id]');
    if (houseEl) return HOUSES.find((h) => h.id === houseEl.dataset.houseId);
    return HOUSES.find((h) => {
      // .house is a 56x74 box at (x, y) with the sprite centered on it and
      // overflowing upward; the hit box spans the sprite's real width plus
      // some slack, from its roof down through the yard to the gate.
      const { x, y } = tileToPx(h.col, h.row);
      const halfW = getHouseFootprintWidth(h.sprite, HOUSE_SPRITE_H) / 2 + 16;
      const cx = x + 28;
      return (
        world.x >= cx - halfW &&
        world.x <= cx + halfW &&
        world.y >= y + 74 - HOUSE_SPRITE_H - 12 &&
        world.y <= y + 4 * TILE_SIZE
      );
    });
  }

  function isWorldInput(e) {
    if (e.target.closest?.('button, a, .section-panel.visible, .hud-textbox')) return false;
    // A room is open — the world underneath isn't interactive.
    return !(houseTRef.current >= 1 && houseTargetRef.current === 1);
  }

  function hideGhost() {
    destGhostRef.current?.classList.remove('show');
  }

  // Press anywhere on the stage: the character sets off immediately (on
  // press, not release, so it feels instant) toward the nearest point on the
  // path, or into a house if the press lands on or around one. Holding and
  // dragging steers — the target follows the pointer along the path.
  // Buttons, links, the HUD plaque and open rooms keep their own clicks.
  function onStagePointerDown(e) {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (!boxRef.current || !isWorldInput(e)) return;
    hideGhost();
    playTapRipple(e.clientX, e.clientY);
    // Tapping someone (or a sign) talks to them instead of walking; tapping
    // them again moves the conversation on. Tapping anywhere else ends it.
    if (e.target.closest?.('[data-workshop]')) {
      enterWorkshop();
      return;
    }
    const talkEl = e.target.closest?.('[data-talk-id]');
    if (talkEl) {
      talkTo(talkEl.dataset.talkId);
      return;
    }
    closeDialogue();
    const world = toWorld(e.clientX, e.clientY);
    // Tapping a pond casts a line (or strikes, once something's biting).
    if (isWaterAt(world)) {
      if (getFishing()) fishingAction();
      else startFishing();
      return;
    }
    stopFishing();
    const house = houseAt(e.target, world);
    pressRef.current = { x: e.clientX, y: e.clientY, dragging: false };
    stageRef.current?.setPointerCapture?.(e.pointerId);
    if (house) {
      goToHouse(house.id);
      return;
    }
    goToProgress(nearestProgressOnPath(world.x, world.y));
  }

  function onStagePointerMove(e) {
    if (!e.isPrimary || !boxRef.current) return;
    const press = pressRef.current;
    if (press) {
      if (!press.dragging && Math.hypot(e.clientX - press.x, e.clientY - press.y) < DRAG_SLOP_PX) return;
      press.dragging = true;
      const world = toWorld(e.clientX, e.clientY);
      goToProgress(nearestProgressOnPath(world.x, world.y));
      return;
    }
    // Mouse hover preview: a faint marker on the spot a click would send
    // the character, so the snap-to-path behavior is visible before
    // committing to it.
    const ghost = destGhostRef.current;
    if (!ghost || e.pointerType !== 'mouse') return;
    const world = toWorld(e.clientX, e.clientY);
    const overWater = isWorldInput(e) && isWaterAt(world);
    boxRef.current.classList.toggle('over-water', overWater);
    if (!isWorldInput(e) || overWater || e.target.closest?.('[data-talk-id], [data-workshop]')) {
      hideGhost();
      return;
    }
    const house = houseAt(e.target, world);
    const point = house ? houseGatePx(house) : getWorldPosition(nearestProgressOnPath(world.x, world.y));
    ghost.style.left = `${point.x}px`;
    ghost.style.top = `${point.y}px`;
    ghost.style.setProperty('--marker-color', house ? house.color : 'var(--pal-cream)');
    ghost.classList.add('show');
  }

  function onStagePointerUp(e) {
    if (!e.isPrimary) return;
    pressRef.current = null;
  }

  // Escape leaves the current house; arrow keys / WASD walk the path; Enter
  // steps into whichever house the character is standing at. While inside,
  // the arrows are left alone so they scroll the open panel natively.
  useEffect(() => {
    if (quickView) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (houseTargetRef.current === 1 || houseTRef.current > 0) leaveHouse();
        return;
      }
      if (e.target.closest?.('input, textarea, select, button, a')) return;
      if (houseTRef.current > 0) return;
      const step = KEY_STEP_PX / TOTAL_PATH_LENGTH;
      if (['ArrowRight', 'ArrowDown', 'd', 's'].includes(e.key)) {
        e.preventDefault();
        goToProgress(targetProgressRef.current + step, { marker: false });
      } else if (['ArrowLeft', 'ArrowUp', 'a', 'w'].includes(e.key)) {
        e.preventDefault();
        goToProgress(targetProgressRef.current - step, { marker: false });
      } else if (e.key === 'Enter' || e.key === ' ') {
        const id = nearbyHouseId(progressRef.current);
        if (id) {
          e.preventDefault();
          goToHouse(id);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quickView]);

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

  // Stepping inside is a deliberate tap now (walking past no longer opens
  // anything), so the house's badge is earned the moment its panel opens.
  // Focus moves into the panel so the wheel, arrow keys and screen readers
  // all land in the room's content straight away.
  useEffect(() => {
    if (!activeHouse) return;
    earnBadge(activeHouse);
    const panelEl = panelRefs.current[activeHouse];
    if (panelEl) {
      panelEl.setAttribute('tabindex', '-1');
      panelEl.focus({ preventScroll: true });
    }
  }, [activeHouse]);

  useEffect(() => installLinkTracking(), []);

  useEffect(
    () =>
      installKonami(() => {
        stopFishing();
        openDialogue('secret-konami');
        setSecretBurst(Date.now());
      }),
    [],
  );

  // The confetti for finding a secret, cleared once it has played out.
  useEffect(() => {
    if (!secretBurst) return undefined;
    const id = setTimeout(() => setSecretBurst(0), 2000);
    return () => clearTimeout(id);
  }, [secretBurst]);

  // Season-specific CSS (the snowy ground color under unpainted chunks).
  useEffect(() => {
    document.documentElement.dataset.season = SEASON;
  }, []);

  // Arriving on a room's link starts the visitor already inside it (no
  // walk from the spawn point), as if they'd just stepped through the door.
  useEffect(() => {
    const id = houseFromHash();
    if (!id || isMobileLanding) return;
    const progress = houseProgress(id);
    progressRef.current = progress;
    targetProgressRef.current = progress;
    houseIdRef.current = id;
    houseTRef.current = 1;
    houseTargetRef.current = 1;
    kickRef.current();
  }, [isMobileLanding]);

  // replaceState rather than pushState, so walking in and out of rooms
  // doesn't fill the back button with history entries. Skips the first
  // run so an incoming #room link isn't wiped before the room opens.
  const lastHashHouseRef = useRef(activeHouse);
  useEffect(() => {
    if (lastHashHouseRef.current === activeHouse) return;
    lastHashHouseRef.current = activeHouse;
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', activeHouse ? `#${activeHouse}` : pathname + search);
  }, [activeHouse]);

  // Editing the hash by hand (or following an in-page #room link) walks
  // there, and clearing it walks back out.
  useEffect(() => {
    if (quickView) return undefined;
    const onHashChange = () => {
      const id = houseFromHash();
      if (id) goToHouse(id);
      else if (houseTargetRef.current === 1) leaveHouse();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [quickView]);

  // Ambient loops (patrolling NPCs, critters, the ball, pond ripples) are
  // paused while they're off screen, so the compositor isn't ticking a
  // dozen animations nobody can see. The margin starts them again a little
  // before they scroll into view.
  useEffect(() => {
    const els = worldRef.current?.querySelectorAll('.ambient');
    if (!els?.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
      },
      { rootMargin: '160px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Read once + subscribe: everything that consumes this ref lives inside
  // the animation loop, so a plain mutable ref (not state) avoids
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

  // Track the box's own pixel size so the camera can center on it without
  // ever animating layout-triggering properties (left/top) — only
  // `transform`, which the browser can composite on the GPU. The box is
  // measured once per resize, not per frame.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;

    const updateCenter = () => {
      const { width, height } = box.getBoundingClientRect();
      boxCenterRef.current = { cx: width / 2, cy: height / 2 };
      box.style.setProperty('--cx', `${width / 2}px`);
      box.style.setProperty('--cy', `${height / 2}px`);
      kickRef.current();
    };

    updateCenter();
    const observer = new ResizeObserver(updateCenter);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // The whole scene — camera, house glow + panel iris, the walk to the door,
  // lighting, night sky, minimap dot, walk-cycle frames — is drawn from
  // `progress` and `houseT` by one requestAnimationFrame loop. It only runs
  // while something is actually moving (kick() restarts it on a tap, key,
  // nav click or resize) and parks on the idle sprite once everything
  // settles. Every visual is written straight to the DOM via transforms/CSS
  // custom properties, never through React state; `activeHouse` state is
  // only for the few hard on/off things (panel pointer-events, the label
  // color swap, the Leave button, the house badge).
  useEffect(() => {
    let rafId = null;
    let lastFrame = 0;
    let lastOpenId = null;
    let lastAtSpawn = true;
    let lastNight = -1;
    let lastSprite = null;
    let lastMirror = null;
    let routeShown = false;
    let walkPhase = 0;
    let lastStepFrame = null;

    // Only touches the <img> when the frame or facing actually changes, not
    // every animation frame.
    function setSprite(direction, frameName, mirror) {
      const img = characterImgRef.current;
      if (!img) return;
      const src = CHAR_SPRITES[direction][frameName];
      if (src !== lastSprite) {
        img.src = src;
        lastSprite = src;
      }
      if (mirror !== lastMirror) {
        img.style.transform = mirror ? 'scaleX(-1)' : 'none';
        lastMirror = mirror;
      }
    }

    function setIdleSprite() {
      const { direction, mirror } = facingRef.current;
      setSprite(direction, 'idle', mirror);
      walkPhase = 0;
    }

    // .is-shown gates the dots' march animation, so it isn't left running
    // (and repainting every frame) on an empty line between walks.
    function hideRoute() {
      if (!routeShown) return;
      routeRef.current?.setAttribute('points', '');
      routeShadowRef.current?.setAttribute('points', '');
      routeRef.current?.ownerSVGElement?.classList.remove('is-shown');
      routeShown = false;
    }

    // Dotted route from the character to the destination along the path —
    // drawn from the destination end so the dots stay planted on the
    // ground while the tail shortens behind the character, instead of
    // crawling along as the line's start point moves.
    function drawRoute(progress) {
      const target = targetProgressRef.current;
      const pendingHouse = pendingHouseRef.current ? HOUSES.find((h) => h.id === pendingHouseRef.current) : null;
      const remainingPx = Math.abs(target - progress) * TOTAL_PATH_LENGTH;
      if (!destKindRef.current || (remainingPx < 24 && !pendingHouse)) {
        hideRoute();
        return;
      }
      const points = pathPointsBetween(target, progress);
      if (pendingHouse) points.unshift(houseGatePx(pendingHouse));
      const attr = points.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
      routeRef.current?.setAttribute('points', attr);
      routeShadowRef.current?.setAttribute('points', attr);
      if (!routeShown) routeRef.current?.ownerSVGElement?.classList.add('is-shown');
      routeShown = true;
    }

    function arriveMarker() {
      const marker = destMarkerRef.current;
      if (!destKindRef.current || !marker) return;
      destKindRef.current = null;
      marker.classList.add('arrive');
      HOUSES.forEach((h) => houseElRefs.current[h.id]?.classList.remove('targeted'));
      hideRoute();
    }

    function draw(progress, houseT, pathMoved) {
      const houseId = houseIdRef.current;
      const house = houseId ? HOUSES.find((h) => h.id === houseId) : null;
      const walkT = clamp01(houseT / HOUSE_WALK_PORTION);
      const reveal = smoothstep(clamp01((houseT - HOUSE_IRIS_START) / (1 - HOUSE_IRIS_START)));
      const nearId = houseT === 0 && !pathMoved ? nearbyHouseId(progress) : null;

      HOUSES.forEach((h) => {
        const inside = h.id === houseId;
        houseElRefs.current[h.id]?.classList.toggle('near', h.id === nearId);
        const houseReveal = inside ? walkT : 0;
        const panelReveal = inside ? reveal : 0;
        const last = lastRevealRef.current[h.id];
        if (last && last.house === houseReveal && last.panel === panelReveal) return;
        lastRevealRef.current[h.id] = { house: houseReveal, panel: panelReveal };
        houseElRefs.current[h.id]?.style.setProperty('--house-reveal', houseReveal);
        // Squared so the panel's text stays near-invisible until the iris
        // is well open, rather than floating legibly over the yard while
        // the character is still walking up to the door.
        panelRefs.current[h.id]?.style.setProperty('--reveal', panelReveal * panelReveal);
      });

      const openId = houseT >= 1 && houseTargetRef.current === 1 ? houseId : null;
      if (openId !== lastOpenId) {
        lastOpenId = openId;
        setActiveHouse(openId);
      }
      const atSpawnNow = progress <= 0.01 && houseT === 0;
      if (atSpawnNow !== lastAtSpawn) {
        lastAtSpawn = atSpawnNow;
        setAtSpawn(atSpawnNow);
      }
      if (progress >= 0.99) earnBadge('pathfinder');

      // Path -> gate -> door walk, relative to the house's own waypoint
      // (where the character is standing whenever houseT > 0).
      let walkFacing = null;
      let pose = { x: 0, y: 0, scale: 1, opacity: 1 };
      if (house && walkT > 0) {
        const waypointPx = WAYPOINTS_PX[house.waypointIndex];
        const gatePx = houseGatePx(house);
        const doorPx = houseDoorPx(house);
        const gate = { x: gatePx.x - waypointPx.x, y: gatePx.y - waypointPx.y };
        const door = { x: doorPx.x - waypointPx.x, y: doorPx.y - waypointPx.y };
        // Walking back out plays the same legs in reverse, so face the
        // opposite way.
        const sign = houseTargetRef.current === 1 ? 1 : -1;
        let x;
        let y;
        let doorLegT = 0;
        if (walkT <= WALK_LEG1_END) {
          const legT = walkT / WALK_LEG1_END;
          x = gate.x * legT;
          y = gate.y * legT;
          walkFacing = directionFromDelta(gate.x * sign, gate.y * sign);
        } else {
          doorLegT = (walkT - WALK_LEG1_END) / (1 - WALK_LEG1_END);
          x = gate.x + (door.x - gate.x) * doorLegT;
          y = gate.y + (door.y - gate.y) * doorLegT;
          walkFacing = directionFromDelta((door.x - gate.x) * sign, (door.y - gate.y) * sign);
        }
        const shrinkT = doorLegT < WALK_SHRINK_START ? 0 : (doorLegT - WALK_SHRINK_START) / (1 - WALK_SHRINK_START);
        pose = { x, y, scale: 1 - shrinkT * 0.7, opacity: 1 - shrinkT };
      }

      if (characterWrapRef.current) {
        characterWrapRef.current.style.transform = `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) scale(${pose.scale})`;
        characterWrapRef.current.style.opacity = String(pose.opacity);
      }

      const { x, y } = getWorldPosition(progress);
      const { cx, cy } = boxCenterRef.current;
      if (worldRef.current) {
        worldRef.current.style.transform = `translate3d(${cx - x}px, ${cy - y}px, 0)`;
      }
      groundRef.current?.setView(x, y, cx, cy);

      if (lightingRef.current) {
        lightingRef.current.style.backgroundColor = getLightingTint(progress);
      }

      // Written on :root so any element in the scene — lamp posts, house
      // windows — can react to the same night amount via an inherited
      // var(--night). Rounded and only written when it changes: every write
      // restyles the whole document, and sub-percent steps are invisible.
      const night = Math.round(getNightAmount(progress) * 200) / 200;
      if (night !== lastNight) {
        lastNight = night;
        document.documentElement.style.setProperty('--night', night);
      }

      if (minimapDotRef.current) {
        const dot = minimapPoint(x, y);
        minimapDotRef.current.style.transform = `translate(${dot.x}px, ${dot.y}px)`;
      }

      // The opening nameplate + CTA belong to the spawn point: they fade as
      // soon as the character sets off, and come back if they walk home.
      stageRef.current?.classList.toggle('hud-away', progress > 0.01 || houseT > 0);

      return walkFacing;
    }

    function frame(now) {
      rafId = null;
      // Real elapsed time (capped only against huge gaps like a background
      // tab), so pace stays true even if a slow device drops frames —
      // capping it tightly is what made the walk crawl on a slow frame rate.
      const dt = lastFrame ? Math.min(250, now - lastFrame) : 16;
      lastFrame = now;
      const dtS = dt / 1000;
      const reducedMotion = reducedMotionRef.current;

      let houseT = houseTRef.current;
      const houseTarget = houseTargetRef.current;
      let houseMoved = false;
      if (houseT !== houseTarget) {
        const step = reducedMotion ? 1 : dt / HOUSE_ENTER_MS;
        const prevHouseT = houseT;
        houseT = houseTarget > houseT ? Math.min(houseTarget, houseT + step) : Math.max(houseTarget, houseT - step);
        houseTRef.current = houseT;
        houseMoved = true;
        // The door sound plays as the character reaches the doorstep, going
        // in or coming back out.
        if (prevHouseT < HOUSE_IRIS_START !== houseT < HOUSE_IRIS_START) playDoor(houseT > prevHouseT);
      }
      if (houseT === 0 && houseTarget === 0 && houseIdRef.current) {
        houseIdRef.current = null;
        houseMoved = true;
      }

      const prevProgress = progressRef.current;
      let progress = prevProgress;
      let pathMoved = false;
      if (houseT === 0) {
        const target = targetProgressRef.current;
        const remainingPx = Math.abs(target - progress) * TOTAL_PATH_LENGTH;
        if (remainingPx > 0.05) {
          if (reducedMotion) {
            progress = target;
          } else {
            // Accelerate toward top speed, and ease off approaching the stop
            // (v² = 2·a·d, the speed from which DECEL just stops in time).
            const v = Math.max(
              WALK_MIN_SPEED,
              Math.min(
                velocityRef.current + WALK_ACCEL * dtS,
                tripSpeedRef.current,
                Math.sqrt(2 * WALK_DECEL * remainingPx),
              ),
            );
            velocityRef.current = v;
            const stepPx = Math.min(remainingPx, v * dtS);
            progress += (Math.sign(target - progress) * stepPx) / TOTAL_PATH_LENGTH;
            if (stepPx >= remainingPx) progress = target;
          }
          progressRef.current = progress;
          pathMoved = true;
        } else {
          if (progress !== target) {
            progress = target;
            progressRef.current = progress;
          }
          velocityRef.current = 0;
          if (pendingHouseRef.current) {
            houseIdRef.current = pendingHouseRef.current;
            pendingHouseRef.current = null;
            houseTargetRef.current = 1;
            houseMoved = true;
          } else if (destKindRef.current === 'path') {
            arriveMarker();
          }
        }
      }
      // A house target's marker sits on the gate, so it pops the moment the
      // character walks through it.
      if (destKindRef.current === 'house' && houseTargetRef.current === 1 && houseT >= HOUSE_WALK_PORTION * WALK_LEG1_END) {
        arriveMarker();
      }

      const walkFacing = draw(progress, houseT, pathMoved);
      if (houseT === 0) drawRoute(progress);
      else hideRoute();

      // Walk cycle: facing follows the direction of travel (or the gate/door
      // leg while walking up to a house), and the 4-beat cycle advances in
      // step with distance covered rather than the frame rate, so the feet
      // match the ground whether jogging, easing to a stop or on a slow
      // device.
      const walking = pathMoved || (houseMoved && walkFacing != null);
      if (walking) {
        let facing = walkFacing;
        if (!facing) {
          const a = getWorldPosition(prevProgress);
          const b = getWorldPosition(progress);
          facing = directionFromDelta(b.x - a.x, b.y - a.y);
        }
        facingRef.current = facing;
        const speed = pathMoved ? Math.max(velocityRef.current, WALK_MIN_SPEED) : WALK_SPEED * 0.6;
        walkPhase += (dt * speed) / (WALK_FRAME_MS * WALK_SPEED);
        const frameName = WALK_CYCLE[Math.floor(walkPhase) % WALK_CYCLE.length];
        setSprite(facing.direction, frameName, facing.mirror);
        if (frameName !== lastStepFrame) {
          lastStepFrame = frameName;
          if (frameName !== 'idle') playStep();
        }
      }

      if (pathMoved || houseMoved) {
        rafId = requestAnimationFrame(frame);
      } else {
        lastFrame = 0;
        setIdleSprite();
      }
    }

    kickRef.current = () => {
      if (rafId == null) rafId = requestAnimationFrame(frame);
    };
    kickRef.current();
    return () => {
      kickRef.current = () => {};
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div aria-hidden={quickView || undefined} inert={quickView || undefined}>
      <div
        className="stage"
        ref={stageRef}
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={onStagePointerUp}
        onPointerCancel={onStagePointerUp}
        onPointerLeave={hideGhost}
      >
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
            onClick={() => goToHouse('projects')}
          >
            See My Projects →
          </button>
          {!welcomeSeen && (
            <p className="hud-start-hint">
              New here? Tap the <span className="hud-start-bang">!</span> sign →
            </p>
          )}
          <p className="hud-scroll-hint">
            or tap anywhere to walk · tap a house to go in ·{' '}
            <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className="hud-resume-link">
              résumé (PDF)
            </a>
          </p>
        </div>

        <div className="stage-box" ref={boxRef}>
          <div
            className="world"
            ref={worldRef}
            style={{ width: WORLD_W, height: WORLD_H }}
          >
            <GroundCanvas ref={groundRef}>
              {PONDS.map(({ id, ...style }) => (
                <div key={id} className="water-pond ambient" style={style}>
                  {/* A bobber floating mid-pond (and now and then a fish
                      leaping) says the water can be fished; until the
                      visitor has caught something, a sign spells it out. */}
                  <span className="pond-bobber" />
                  <span className="pond-fish" />
                  {!hasFished && <span className="pond-hint">Tap to fish!</span>}
                </div>
              ))}
            </GroundCanvas>

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

            {BARRIERS.map((b) => {
              // Each barricade stands just on the dirt side of the
              // pavement edge it closes off (see buildBarriers).
              const edge = b.line * TILE_SIZE;
              const span = b.length * TILE_SIZE;
              const from = b.start * TILE_SIZE;
              const style =
                b.orientation === 'h'
                  ? {
                      left: from + span / 2,
                      top: edge + (b.side > 0 ? 20 : -2),
                      width: span - 4,
                      zIndex: zFromGroundY(edge + (b.side > 0 ? 20 : -2)),
                    }
                  : {
                      left: edge + b.side * 7,
                      top: from + 2,
                      height: span - 4,
                      zIndex: zFromGroundY(from + span),
                    };
              return (
                <div
                  key={b.id}
                  className={`barricade barricade--${b.orientation} talkable`}
                  data-talk-id="barricade"
                  style={style}
                >
                  <span className="barricade-board" />
                </div>
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
              const footprint = getHouseFootprintWidth(house.sprite, DECOR_SPRITE_H);
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
              const footprint = getHouseFootprintWidth(house.sprite, HOUSE_SPRITE_H);
              return (
                <div
                  key={house.id}
                  ref={(el) => {
                    houseElRefs.current[house.id] = el;
                  }}
                  className={`house house--${house.kind} house-${house.side} ${
                    activeHouse === house.id ? 'active' : ''
                  }`}
                  data-house-id={house.id}
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

            {LIVE_TREES.map((tree, i) => {
              const { x, y } = tileToPx(tree.col, tree.row);
              const groundY = y + TILE_SIZE;
              const versions = seasonTrees?.[tree.variant];
              return (
                <img
                  key={`tree-${i}`}
                  src={versions ? versions[treeVariant(tree, versions.length)] : TREE_SPRITES[tree.variant]}
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
                  className={`npc npc--${npc.axis} ambient talkable`}
                  data-talk-id={npc.id}
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
                  <span className="talk-hint" aria-hidden="true" />
                </div>
              );
            })}

            {CRITTERS.map((critter) => {
              const { x, y } = tileToPx(critter.col, critter.row);
              return (
                <div
                  key={critter.id}
                  className={`critter critter--${critter.axis} ambient`}
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
                  className={`npc npc--${pet.axis} ambient talkable`}
                  data-talk-id={pet.id}
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
                  <span className="talk-hint" aria-hidden="true" />
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
                    className="sports-ball ambient"
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
                <div key={p.id} className="picnic-scene" style={{ left: x, top: y, zIndex: zFromGroundY(y + 96) }}>
                  <img src={picnicScene} className="picnic-blanket" alt="" />
                </div>
              );
            })}

            {SIGNS.map((sign) => {
              const { x, y } = tileToPx(sign.col, sign.row);
              const isWelcome = sign.id === 'sign-welcome';
              return (
                <div
                  key={sign.id}
                  className={`signpost talkable ${isWelcome ? 'signpost--welcome' : ''} ${
                    isWelcome && !welcomeSeen ? 'is-unread' : ''
                  }`}
                  data-talk-id={sign.id}
                  style={{ left: x, top: y, zIndex: zFromGroundY(y + TILE_SIZE) }}
                >
                  <span className="signpost-post" />
                  <span className="signpost-board" />
                  {isWelcome && !welcomeSeen && (
                    <span className="signpost-alert" aria-hidden="true">
                      !
                    </span>
                  )}
                </div>
              );
            })}

            {(() => {
              const { x, y } = tileToPx(NOTICE_BOARD.col, NOTICE_BOARD.row);
              return (
                <div
                  className="notice-board talkable"
                  data-talk-id={NOTICE_BOARD.id}
                  style={{ left: x, top: y, zIndex: zFromGroundY(y + TILE_SIZE) }}
                >
                  <span className="notice-board-face">
                    <span className="notice-board-title">NOW</span>
                  </span>
                  <span className="talk-hint" aria-hidden="true" />
                </div>
              );
            })()}

            {(() => {
              const { x, y } = tileToPx(WORKSHOP.col, WORKSHOP.row);
              const footprint = getHouseFootprintWidth(WORKSHOP.sprite, DECOR_SPRITE_H);
              return (
                <div
                  className={`decor-house-wrap workshop ${workshopUnlocked ? 'is-open' : 'is-locked'}`}
                  data-workshop=""
                  style={{ left: x, top: y, '--footprint-w': `${footprint}px`, zIndex: zFromGroundY(y + 70) }}
                >
                  <div className="building-shadow" />
                  <div className="building-foundation" />
                  <img src={HOUSE_SPRITES[WORKSHOP.sprite]} className="decor-house" alt="" />
                  {/* It's a secret: no lit windows, no label, no glow. Once
                      unlocked, the boards just come off the door. */}
                  {!workshopUnlocked && <span className="workshop-boards" aria-hidden="true" />}
                </div>
              );
            })()}

            <svg className="route-preview" width={WORLD_W} height={WORLD_H} aria-hidden="true">
              <polyline ref={routeShadowRef} className="route-preview-shadow" points="" />
              <polyline ref={routeRef} className="route-preview-dots" points="" />
            </svg>

            <div className="dest-ghost" ref={destGhostRef} aria-hidden="true" />

            <div className="dest-marker" ref={destMarkerRef} aria-hidden="true">
              <div className="dest-marker-tile" />
              <div className="dest-marker-arrow" />
            </div>
          </div>

          {!activeHouse && <SeasonFx />}

          <div className="lighting-overlay" ref={lightingRef} aria-hidden="true" />

          <div className="tap-ripple" ref={tapRippleRef} aria-hidden="true" />

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
          <ExperiencePanel
            ref={(el) => {
              panelRefs.current.experience = el;
            }}
            active={activeHouse === 'experience'}
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

          {activeHouse && (
            <button type="button" className="leave-house" onClick={leaveHouse}>
              ← Leave {HOUSES.find((h) => h.id === activeHouse).label}
            </button>
          )}
        </div>
      </div>

      <SectionNav
        activeId={activeHouse}
        introActive={atSpawn}
        onSelect={(id) => (id ? goToHouse(id) : goToProgress(0))}
      />
      <Minimap ref={minimapDotRef} />
      <MusicPlayer inRoom={Boolean(activeHouse)} />
      <BadgeCase />
      </div>

      <button
        type="button"
        className="quick-view-toggle"
        onClick={() => {
          closeDialogue();
          stopFishing();
          setQuickView(true);
        }}
        aria-pressed={quickView}
      >
        Quick View
      </button>

      {quickView && <QuickView onClose={() => setQuickView(false)} isMobileLanding={isMobileLanding} />}

      <DialogueBox />

      <FishingBox />

      {workshopOpen && <Workshop onClose={() => setWorkshopOpen(false)} />}
      {nowLogOpen && <NowLog onClose={() => setNowLogOpen(false)} />}
      {packOpen && <PackOpener onClose={closePackOpener} />}

      {secretBurst > 0 && <ParticleBurst key={secretBurst} />}

      <BadgeToast />

      <Analytics />
    </>
  );
}

export default App;
