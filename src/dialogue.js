import { useSyncExternalStore } from 'react';
import { DIALOGUE } from './content';
import { welcomeBackLines } from './visits';

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
  // A returning visitor gets a welcome-back line (and a badge hint) from
  // the spawn sign before its usual controls blurb.
  const lines = id === 'sign-welcome' ? [...welcomeBackLines(), ...entry.lines] : entry.lines;
  emit({ id, name: entry.name, lines, index: 0 });
}

// Next line, or close after the last one.
export function advanceDialogue() {
  if (!state) return;
  emit(state.index + 1 < state.lines.length ? { ...state, index: state.index + 1 } : null);
}

export function closeDialogue() {
  if (state) emit(null);
}

// Signs, boards and barricades (as opposed to people and pets): they get a
// wooden knock instead of a chirp when tapped, and a lower text blip.
export const isObjectTalk = (id) => /^(sign|barricade|now-board|notice)/.test(id ?? '');
