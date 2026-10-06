import { useSyncExternalStore } from 'react';
import { PROJECTS, HOBBIES } from './content';
import { findSecret } from './secrets';
import owenSprite from './assets/char/char-down-idle.png';

// The secret booster pack in the Hobbies room (tucked under the armchair
// cushion), for Pokémon fans only: it stays sealed until the visitor
// answers a bit of Pokémon trivia (FAN_QUESTIONS). Five cards a pack,
// TCG style, but the set is Owen: his Pokémon favorites, his projects as
// creatures (with HP and an attack), hobbies as energy, roles as trainers
// and a couple of his things as items. The last card is the rare slot,
// with a small chance of the Secret Rare: his grad quote. Pulled cards go
// in a binder that's remembered per visitor.
//
// rarity: common < uncommon < rare < holo < secret

const projectArt = (name) => {
  const p = PROJECTS.find((x) => x.name === name);
  if (!p) return null;
  return p.image ?? (p.video ? p.video.replace(/\.mp4$/, '-poster.webp') : null);
};
const hobbyArt = (label) => HOBBIES.find((h) => h.label === label)?.image ?? null;

export const CARDS = [
  // --- Owen's Pokémon favorites (drawn as type-colored cards, no official
  // artwork) ---
  { id: 'piplup', type: 'pokefact', rarity: 'holo', name: 'Piplup', hp: 60, color: '#4d9be6', label: 'Favorite Pokémon', move: 'Proud Peck', damage: 40, text: "Owen's favorite Pokémon. Small, Water type, and way too proud to admit it's tired." },
  { id: 'maushold', type: 'pokefact', rarity: 'holo', name: 'Maushold', hp: 70, color: '#c9b48a', label: 'Most like Owen', move: 'Family Ties', damage: 50, text: 'The Pokémon that represents Owen most: a little family of mice that does everything together.' },
  { id: 'unbroken', type: 'pokefact', rarity: 'rare', name: 'Unbroken Bonds', color: '#c9463e', label: 'Favorite Set', text: "Owen's favorite card set: Sun & Moon's Unbroken Bonds (2019), home of the Tag Team GX cards." },

  // --- Creatures: the projects ---
  { id: 'foodfindr', type: 'creature', rarity: 'holo', name: 'FoodFindr', hp: 120, color: '#e8877a', art: projectArt('FoodFindr'), move: 'One Dish Only', damage: 60, text: 'Reads the reviews, then picks exactly one spot and one dish for you.' },
  { id: 'justdie', type: 'creature', rarity: 'holo', name: 'Just Die', hp: 110, color: '#3a2a55', art: projectArt('Just Die'), move: 'Corpse Bridge', damage: 70, text: 'Knock yourself out to become a platform. Took 1st out of 115+.' },
  { id: 'singscore', type: 'creature', rarity: 'rare', name: 'Sing Score', hp: 100, color: '#26a8b1', art: projectArt('Sing Score'), move: 'Pitch Check', damage: 50, text: 'Splits the vocals out, then grades every note you sing.' },
  { id: 'fits', type: 'creature', rarity: 'rare', name: 'Fits', hp: 90, color: '#4fae7a', art: projectArt('Fits'), move: 'Free Charts', damage: 40, text: 'Shows all your progress charts. No paywall.' },
  { id: 'clashmate', type: 'creature', rarity: 'uncommon', name: 'ClashMate', hp: 80, color: '#7a4bb5', art: projectArt('ClashMate'), move: 'Elixir Check', damage: 40, text: 'Chess pieces fight it out, powered by an elixir bar.' },
  { id: 'thumb', type: 'creature', rarity: 'uncommon', name: 'Thumb Detector', hp: 70, color: '#8ea9c9', art: projectArt('Thumb Detector'), move: 'Flick', damage: 30, text: 'Flick a finger to skip to the next reel.' },
  { id: 'ladder', type: 'creature', rarity: 'uncommon', name: 'Ladder Game', hp: 60, color: '#f0a94e', art: projectArt('Ladder Game'), move: 'Breadboard Blitz', damage: 30, text: 'All circuitry, no screen.' },
  { id: 'vehicle', type: 'creature', rarity: 'common', name: 'Vehicle Simulation', hp: 70, color: '#a67a54', art: projectArt('Vehicle Simulation'), move: 'Siren Rush', damage: 30, text: 'Fire trucks weave through lane-based traffic to the blaze.' },
  { id: 'supermarket', type: 'creature', rarity: 'common', name: 'Supermarket Sim', hp: 60, color: '#e0b23c', art: projectArt('Supermarket Simulation'), move: 'Impulse Buy', damage: 20, text: 'A shopper grabs something they did not need. Flip a coin.' },

  // --- Energy: the hobbies ---
  { id: 'e-basketball', type: 'energy', rarity: 'common', name: 'Basketball Energy', color: '#f0a94e', art: hobbyArt('Basketball'), text: 'Provides 1 hustle. Works best at a pickup run.' },
  { id: 'e-badminton', type: 'energy', rarity: 'common', name: 'Badminton Energy', color: '#4da338', art: hobbyArt('Badminton'), text: 'Provides 1 speed. The birdie is already gone.' },
  { id: 'e-cooking', type: 'energy', rarity: 'common', name: 'Cooking Energy', color: '#e8877a', art: hobbyArt('Cooking'), text: 'Provides 1 flavor. Heal 20 for everyone at the table.' },
  { id: 'e-running', type: 'energy', rarity: 'common', name: 'Running Energy', color: '#26a8b1', art: hobbyArt('Running'), text: 'Provides 1 stamina. Better with a good playlist.' },
  { id: 'e-gym', type: 'energy', rarity: 'common', name: 'Gym Energy', color: '#8ea9c9', art: hobbyArt('Working Out'), text: 'Provides 1 strength. Attach one every day.' },
  { id: 'e-karaoke', type: 'energy', rarity: 'common', name: 'Karaoke Energy', color: '#b5495b', art: hobbyArt('Singing'), text: 'Provides 1 volume. Car singalongs count.' },

  // --- Trainers: the roles ---
  { id: 't-president', type: 'trainer', rarity: 'uncommon', name: 'Council President', color: '#c9463e', org: 'Trudeau Athletic Council', text: 'Rally your team of 24. Raise $5,700 for charity.' },
  { id: 't-founder', type: 'trainer', rarity: 'uncommon', name: 'Startup Founder', color: '#5b7a94', org: "Catch 'Em Crate", text: 'Ship a box of trading cards to every subscriber. Gain $1,000.' },
  { id: 't-tutor', type: 'trainer', rarity: 'common', name: 'Tutor', color: '#2f8f5a', org: 'Trudeau Tutoring & Co.', text: 'Up to 10 students on your bench each level up.' },
  { id: 't-warg', type: 'trainer', rarity: 'uncommon', name: 'Autonomy Engineer', color: '#3d6f8f', org: 'WARG', text: 'Your aircraft flies itself this turn.' },
  { id: 't-ambassador', type: 'trainer', rarity: 'uncommon', name: 'Campus Ambassador', color: '#1c1d22', org: 'ElevenLabs', text: 'Turn any course reading into audio.' },

  // --- Items: Owen's things ---
  { id: 'i-wilson', type: 'item', rarity: 'common', name: 'Wilson Evolution', color: '#3a3a40', art: hobbyArt('Basketball'), text: "A small forward's ball of choice. +10 to your next layup." },
  { id: 'i-catan', type: 'item', rarity: 'common', name: 'Catan Dice', color: '#6f5fa3', art: hobbyArt('Board Games'), text: 'Roll for wood, brick and sheep. Owen\'s current favorite.' },

  // --- The Secret Rare ---
  { id: 'secret', type: 'secret', rarity: 'secret', name: 'Owen Lee', color: '#e0b23c', art: owenSprite, quote: "If you ain't cooking then hop off the pot.", text: 'Grad quote, class of 2026.' },
];

export const RARITY_LABEL = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', holo: 'Holo Rare', secret: 'Secret Rare' };
export const TYPE_LABEL = { pokefact: "Owen's Pokédex", creature: 'Project', energy: 'Energy', trainer: 'Trainer', item: 'Item', secret: 'Secret Rare' };

// --- Fans only: answer one of these to unseal the pack (for good) ---
// Answers are compared lowercased with spaces and punctuation stripped.
export const FAN_QUESTIONS = [
  { q: 'What type is Piplup?', a: ['water'] },
  { q: "What's #001 in the National Pokédex?", a: ['bulbasaur'] },
  { q: 'Pikachu evolves into which Pokémon?', a: ['raichu'] },
  { q: 'Name a type that is super effective against Water.', a: ['grass', 'electric'] },
  { q: 'Which Pokémon is famous for knowing only Splash?', a: ['magikarp'] },
  { q: 'Who is the Normal-type Pokémon that can transform into anything?', a: ['ditto'] },
];

export const checkFanAnswer = (question, answer) => {
  const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return question.a.includes(clean(answer));
};

const UNLOCK_KEY = 'pack-unlocked-v1';
export function isPackUnlocked() {
  try {
    return localStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}
export function unlockPack() {
  try {
    localStorage.setItem(UNLOCK_KEY, '1');
  } catch {
    // Non-fatal: they'll just be asked again next visit.
  }
}

// Rare slot: the last card. Secret Rare about 1 pack in 25.
const SECRET_CHANCE = 0.04;
const HOLO_CHANCE = 0.25;

const byRarity = (r) => CARDS.filter((c) => c.rarity === r);
const pick = (pool, taken) => {
  const open = pool.filter((c) => !taken.has(c.id));
  const from = open.length ? open : pool;
  return from[Math.floor(Math.random() * from.length)];
};

export function rollPack() {
  const taken = new Set();
  const take = (pool) => {
    const c = pick(pool, taken);
    taken.add(c.id);
    return c;
  };
  const commons = byRarity('common');
  const uncommons = byRarity('uncommon');
  const r = Math.random();
  const rarePool = r < SECRET_CHANCE ? byRarity('secret') : r < SECRET_CHANCE + HOLO_CHANCE ? byRarity('holo') : byRarity('rare');
  return [take(commons), take(commons), take(commons), take(uncommons), take(rarePool)];
}

// --- The binder: how many of each card this visitor has pulled ---
const STORAGE_KEY = 'pack-binder-v1';
let binder = (() => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
})();
const listeners = new Set();

export function useBinder() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => binder,
  );
}

export function addToBinder(cards) {
  const next = { ...binder };
  cards.forEach((c) => {
    next[c.id] = (next[c.id] ?? 0) + 1;
  });
  binder = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(binder));
  } catch {
    // Non-fatal: the binder just won't survive a reload.
  }
  listeners.forEach((l) => l());
  if (cards.some((c) => c.rarity === 'secret')) findSecret('rare');
}

// --- Whether the pack opener is showing (App.jsx renders it) ---
let opener = false;
const openerListeners = new Set();
const setOpener = (v) => {
  opener = v;
  openerListeners.forEach((l) => l());
};
export const openPackOpener = () => setOpener(true);
export const closePackOpener = () => setOpener(false);
export function usePackOpener() {
  return useSyncExternalStore(
    (l) => {
      openerListeners.add(l);
      return () => openerListeners.delete(l);
    },
    () => opener,
  );
}
