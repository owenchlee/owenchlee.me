import { useSyncExternalStore } from 'react';
import { HOBBIES, RESUME_URL } from './content';

// Pokémon-style gym badges for exploring the world. Eight of them, like a
// badge case, and earning all eight makes the visitor "Champion", which
// unlocks the secret note in ContactPanel (see sections.jsx). Everything
// lives in a tiny module-level store (not React state in App) so any
// component can read it with useAchievements() or award a badge with
// earnBadge() without prop-drilling — the same "just import it" pattern
// sections.jsx already uses for content.js.
//
// `pixels` is a 9x9 map drawn with the badge's own palette:
//   o = ink outline, h = highlight, b = base color, s = shadow, . = empty
export const BADGES = [
  {
    id: 'projects',
    name: 'Circuit Badge',
    color: '#5b7a94',
    hint: 'Step inside the Projects lab.',
    pixels: ['..ooooo..', '.ohhbbbo.', 'ohhbbbbbo', 'ohbbooobo', 'obbbohobo', 'obbbooobo', 'obbbbbbso', '.obbbbso.', '..ooooo..'],
  },
  {
    id: 'experience',
    name: 'Ledger Badge',
    color: '#e0b23c',
    hint: 'Visit the Experience office.',
    pixels: ['....o....', '...oho...', '..ohhbo..', '.ohhbbbo.', 'ohhbbbbso', '.obbbbso.', '..obbso..', '...oso...', '....o....'],
  },
  {
    id: 'hobbies',
    name: 'Hearth Badge',
    color: '#4da338',
    hint: 'Drop by the Hobbies house.',
    pixels: ['....o....', '...oho...', '..ohhbo..', '.ohbbbbo.', 'ohbbbbbso', '.obbobbo.', '.obbobso.', '.obbbbso.', '.ooooooo.'],
  },
  {
    id: 'contact',
    name: 'Beacon Badge',
    color: '#c9463e',
    hint: 'Knock on the Contact door.',
    pixels: ['....o....', '...oho...', 'oooohbooo', 'ohhbbbbso', '.obbbbso.', '..obbbo..', '.obbosbo.', '.obo.oso.', '.oo...oo.'],
  },
  {
    id: 'curator',
    name: 'Curator Badge',
    color: '#6f5fa3',
    hint: 'Look at every item on the hobby shelf.',
    pixels: ['ooooooooo', 'ohhbbbbso', 'ohooooobo', 'ohbbbbbso', 'ohooooobo', 'ohbbbbbso', 'ohooooobo', 'obbbbbsso', 'ooooooooo'],
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder Badge',
    color: '#a67a54',
    hint: 'Walk the road all the way to its end.',
    pixels: ['....o....', '...obo...', '..ohbbo..', '.ohhbbbo.', 'ohhbbbbso', 'ohbbbbbso', 'ohbbbbsso', '.obbbsso.', '..ooooo..'],
  },
  {
    id: 'scholar',
    name: 'Scholar Badge',
    color: '#8ea9c9',
    hint: 'Open the résumé.',
    pixels: ['ooooooooo', 'ohhbbbbso', 'ohbbbbbso', 'ohbbhbbso', '.obbhbbo.', '.obbbbso.', '..obbso..', '...oso...', '....o....'],
  },
  {
    id: 'quill',
    name: 'Quill Badge',
    color: '#26a8b1',
    hint: 'Copy the email or follow a contact link.',
    pixels: ['...oooo..', '..ohhbbo.', '.ohhooo..', '.ohbo....', '.ohbo....', '.ohbbo...', '..obbbooo', '...obbbso', '....oooo.'],
  },
];

const BADGE_IDS = new Set(BADGES.map((b) => b.id));
const STORAGE_KEY = 'badges-v1';

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && typeof parsed === 'object') {
      return {
        earned: parsed.earned ?? {},
        hobbiesSeen: parsed.hobbiesSeen ?? [],
        championAt: parsed.championAt ?? null,
      };
    }
  } catch {
    // Private mode / blocked storage / corrupt JSON — start fresh.
  }
  return { earned: {}, hobbiesSeen: [], championAt: null };
}

function save(s) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ earned: s.earned, hobbiesSeen: s.hobbiesSeen, championAt: s.championAt }),
    );
  } catch {
    // Non-fatal: badges just won't persist past this visit.
  }
}

// `queue` holds announcements waiting to be shown by BadgeToast — never
// persisted, so a badge's "You received…" moment only plays the one time
// it's actually earned.
let state = { ...load(), queue: [] };
const listeners = new Set();

function setState(next) {
  state = next;
  save(state);
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAchievements() {
  return useSyncExternalStore(subscribe, () => state);
}

export function earnBadge(id) {
  if (!BADGE_IDS.has(id) || state.earned[id]) return;
  const earned = { ...state.earned, [id]: Date.now() };
  const queue = [...state.queue, { type: 'badge', id, uid: `badge-${id}` }];
  const becameChampion = !state.championAt && BADGES.every((b) => earned[b.id]);
  if (becameChampion) queue.push({ type: 'champion', uid: 'champion' });
  setState({ ...state, earned, queue, championAt: becameChampion ? Date.now() : state.championAt });
  playJingle(becameChampion ? 'champion' : 'badge');
}

export function markHobbySeen(index) {
  if (state.hobbiesSeen.includes(index)) return;
  const hobbiesSeen = [...state.hobbiesSeen, index];
  setState({ ...state, hobbiesSeen });
  if (hobbiesSeen.length >= HOBBIES.length) earnBadge('curator');
}

export function dismissAnnouncement() {
  if (state.queue.length === 0) return;
  setState({ ...state, queue: state.queue.slice(1) });
}

// Résumé and contact links live in four different components (HUD, the
// Experience and Contact panels, Quick View), so they're caught with one
// delegated listener instead of threading an onClick through each. Only the
// *click* is detected — whatever the link does next is untouched.
export function installLinkTracking() {
  function onClick(e) {
    const el = e.target.closest?.('a, button');
    if (!el) return;
    const href = el.getAttribute('href');
    if (href && href.endsWith(RESUME_URL)) {
      earnBadge('scholar');
      return;
    }
    if (el.matches('.dialogue-link, .qv-email-button, .quick-view-contact a')) {
      earnBadge('quill');
    }
  }
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}

// The short "badge get" fanfare. Only plays if the visitor has already
// turned music on themselves (MusicPlayer calls setJingleEnabled) — a
// badge popping should never be the first sound a visitor hears.
let jingleEnabled = false;
let jingleCtx = null;

export function setJingleEnabled(on) {
  jingleEnabled = on;
}

const JINGLES = {
  // Rising arpeggio + held top note, loosely in the spirit of the
  // classic "obtained a badge" sting — not a transcription of it.
  badge: [
    [523.25, 0, 0.12],
    [659.25, 0.12, 0.12],
    [783.99, 0.24, 0.12],
    [1046.5, 0.36, 0.45],
  ],
  champion: [
    [523.25, 0, 0.14],
    [523.25, 0.16, 0.14],
    [523.25, 0.32, 0.14],
    [659.25, 0.48, 0.3],
    [587.33, 0.8, 0.14],
    [659.25, 0.96, 0.14],
    [783.99, 1.12, 0.7],
  ],
};

function playJingle(kind) {
  if (!jingleEnabled) return;
  try {
    jingleCtx ??= new AudioContext();
    const t0 = jingleCtx.currentTime + 0.05;
    JINGLES[kind].forEach(([freq, start, dur]) => {
      const osc = jingleCtx.createOscillator();
      const gain = jingleCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(0.05, t0 + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
      osc.connect(gain).connect(jingleCtx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + dur + 0.02);
    });
  } catch {
    // No Web Audio — the badge still shows, just silently.
  }
}
