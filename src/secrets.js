import { useSyncExternalStore } from 'react';
import { FISH } from './content';
import { playJingle } from './sfx';

// Hidden extras, kept apart from the eight badges (finding these isn't
// needed to become Champion). The Trainer Card lists them as "???" until
// found. Two of them open the workshop at the end of the dirt track: the
// old cheat code, or the rusty key from one of the ponds.
export const SECRETS = [
  { id: 'konami', name: 'Old Code', hint: 'Some codes never get old.' },
  { id: 'key', name: 'Rusty Key', hint: 'Something lost at the bottom of a pond.' },
  { id: 'workshop', name: 'Workshop', hint: 'Find a way into the old workshop.' },
  { id: 'shiny', name: 'Shiny Catch', hint: 'A very rare bite.' },
];

const STORAGE_KEY = 'secrets-v1';

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && typeof parsed === 'object') {
      return { found: parsed.found ?? {}, fish: parsed.fish ?? {}, casts: parsed.casts ?? 0 };
    }
  } catch {
    // Private mode / blocked storage / corrupt JSON — start fresh.
  }
  return { found: {}, fish: {}, casts: 0 };
}

let state = load();
const listeners = new Set();

function setState(next) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-fatal: secrets just won't persist past this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSecrets() {
  return useSyncExternalStore(subscribe, () => state);
}

export function getSecrets() {
  return state;
}

export const isWorkshopOpen = (s = state) => Boolean(s.found.konami || s.found.key);

// Returns true the first time a secret is found.
export function findSecret(id) {
  if (state.found[id]) return false;
  setState({ ...state, found: { ...state.found, [id]: Date.now() } });
  playJingle('secret');
  return true;
}

// Picks what's on the line for a successful catch. The key turns up on
// the third catch or later (guaranteed by the fifth) until it's found, so
// it's reachable without luck; after that it's fish by weight.
export function rollCatch() {
  const catches = Object.values(state.fish).reduce((a, b) => a + b, 0);
  if (!state.found.key && catches >= 2 && (catches >= 4 || Math.random() < 0.35)) return 'key';
  const total = FISH.reduce((sum, f) => sum + f.weight, 0);
  let roll = Math.random() * total;
  for (const f of FISH) {
    roll -= f.weight;
    if (roll < 0) return f.id;
  }
  return FISH[0].id;
}

export function recordCatch(id) {
  if (id === 'key') {
    findSecret('key');
    return;
  }
  setState({ ...state, fish: { ...state.fish, [id]: (state.fish[id] ?? 0) + 1 } });
  if (FISH.find((f) => f.id === id)?.shiny) findSecret('shiny');
}

// ↑ ↑ ↓ ↓ ← → ← → B A, anywhere outside a text field. Calls `onUnlock`
// the first time it's entered.
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function installKonami(onUnlock) {
  let at = 0;
  function onKeyDown(e) {
    if (e.target.closest?.('input, textarea, select')) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[at]) at += 1;
    else at = key === KONAMI[0] ? 1 : 0;
    if (at === KONAMI.length) {
      at = 0;
      if (findSecret('konami')) onUnlock();
    }
  }
  window.addEventListener('keydown', onKeyDown, true);
  return () => window.removeEventListener('keydown', onKeyDown, true);
}
