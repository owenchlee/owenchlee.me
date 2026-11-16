import { createStore } from './store';
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

let timer = null;

const store = createStore();
const { emit } = store;

export const useFishing = store.use;

export const getFishing = store.get;

function cast() {
  clearTimeout(timer);
  playSplash();
  emit({ phase: 'waiting', catchId: null, cast: (store.get()?.cast ?? 0) + 1 });
  timer = setTimeout(() => {
    playBite();
    emit({ ...store.get(), phase: 'bite' });
    timer = setTimeout(() => {
      playMiss();
      emit({ ...store.get(), phase: 'missed' });
    }, BITE_WINDOW_MS);
  }, BITE_MIN_MS + Math.random() * (BITE_MAX_MS - BITE_MIN_MS));
}

export function startFishing() {
  if (!store.get()) cast();
}

// The one input: tap the box or the pond, or press Enter/Space.
export function fishingAction() {
  if (!store.get()) return;
  clearTimeout(timer);
  if (store.get().phase === 'waiting') {
    playMiss();
    emit({ ...store.get(), phase: 'early' });
  } else if (store.get().phase === 'bite') {
    const catchId = rollCatch();
    recordCatch(catchId);
    if (catchId !== 'key') playJingle('catch');
    emit({ ...store.get(), phase: 'caught', catchId });
  } else {
    cast();
  }
}

export function stopFishing() {
  clearTimeout(timer);
  if (store.get()) emit(null);
}
