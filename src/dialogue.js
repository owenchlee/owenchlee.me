import { useSyncExternalStore } from 'react';
import { DIALOGUE } from './content';

// The open NPC/sign conversation, if any: who's talking and which of their
// lines is showing. A tiny module store (same pattern as achievements.js)
// so App.jsx can open one from its pointer handler and DialogueBox can
// render it, without either re-rendering the other.
let state = null;
const listeners = new Set();

function emit(next) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDialogue() {
  return useSyncExternalStore(subscribe, () => state);
}

export function getDialogue() {
  return state;
}

export function openDialogue(id) {
  const entry = DIALOGUE[id];
  if (!entry) return;
  emit({ id, name: entry.name, lines: entry.lines, index: 0 });
}

// Next line, or close after the last one.
export function advanceDialogue() {
  if (!state) return;
  emit(state.index + 1 < state.lines.length ? { ...state, index: state.index + 1 } : null);
}

export function closeDialogue() {
  if (state) emit(null);
}
