import { useSyncExternalStore } from 'react';

// Tiny module store shared by dialogue.js and fishing.js: one state value,
// emit() to replace it, use() as the React hook, get() for non-React callers.
export function createStore(initial = null) {
  let state = initial;
  const listeners = new Set();
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  return {
    emit(next) {
      state = next;
      listeners.forEach((l) => l());
    },
    get: () => state,
    use: () => useSyncExternalStore(subscribe, () => state),
  };
}
