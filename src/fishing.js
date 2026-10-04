import { useSyncExternalStore } from 'react';
import { rollCatch, recordCatch } from './secrets';
import { playSplash, playBite, playMiss, playJingle } from './sfx';

// The pond minigame. Tap a pond to cast, wait for the bite, and tap again
// within BITE_WINDOW_MS of the "!" to land it. Same tiny module-store
// pattern as dialogue.js: App.jsx starts it from its pointer handler and
// FishingBox renders whatever phase it's in.
//   waiting -> bite -> caught
//   waiting -> (tapped too soon) early
//   bite    -> (too slow) missed
const BITE_MIN_MS = 1400;
const BITE_MAX_MS = 4200;
const BITE_WINDOW_MS = 850;

let state = null;
let timer = null;
const listeners = new Set();

function emit(next) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useFishing() {
  return useSyncExternalStore(subscribe, () => state);
}

export function getFishing() {
  return state;
}

function cast() {
  clearTimeout(timer);
  playSplash();
  emit({ phase: 'waiting', catchId: null, cast: (state?.cast ?? 0) + 1 });
  timer = setTimeout(() => {
    playBite();
    emit({ ...state, phase: 'bite' });
    timer = setTimeout(() => {
      playMiss();
      emit({ ...state, phase: 'missed' });
    }, BITE_WINDOW_MS);
  }, BITE_MIN_MS + Math.random() * (BITE_MAX_MS - BITE_MIN_MS));
}

export function startFishing() {
  if (!state) cast();
}

// The one input: tap the box or the pond, or press Enter/Space.
export function fishingAction() {
  if (!state) return;
  clearTimeout(timer);
  if (state.phase === 'waiting') {
    playMiss();
    emit({ ...state, phase: 'early' });
  } else if (state.phase === 'bite') {
    const catchId = rollCatch();
    recordCatch(catchId);
    if (catchId !== 'key') playJingle('catch');
    emit({ ...state, phase: 'caught', catchId });
  } else {
    cast();
  }
}

export function stopFishing() {
  clearTimeout(timer);
  if (state) emit(null);
}
