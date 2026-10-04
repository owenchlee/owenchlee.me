import { useSyncExternalStore } from 'react';
import { HOBBIES, RESUME_URL } from './content';
import { playJingle } from './sfx';

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
