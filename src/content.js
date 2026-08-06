// All user-facing text and data for the site lives here — sections.jsx just
// renders whatever's in these objects/arrays. Edit this file to change what
// the site says; no JSX or layout code to touch.
//
// `image` (on PROJECTS and HOBBIES entries) is optional: point it at a real
// image — either `import myPhoto from './assets/projects/alpha.png'` up top
// and reference `myPhoto` here, or a plain string path under `public/` —
// and the card/shelf item shows it. Leave it `null` and it falls back to a
// colored placeholder instead, so entries can be filled in one at a time
// without anything looking broken in the meantime.

import foodfindrDemo from './assets/projects/foodfindr-demo.gif';
import gestureBreakoutDemo from './assets/projects/gesture-breakout-demo.gif';
import blobbyFitDemo from './assets/projects/blobby-fit-demo.gif';

export const INTRO = {
  name: 'Owen Lee',
  bio: "I'm a Systems Design Engineer currently studying at the University of Waterloo. I love building things, learning new skills, and solving problems.",
};

export const PROJECTS = [
  {
    name: 'Personal Karaoke',
    date: 'Jul 2026',
    color: '#26a8b1',
    image: null,
    link: 'https://github.com/owenchlee/Personal-Karaoke',
    desc: 'A self-hosted, Rock Band-style karaoke game. Point it at any song and it separates vocals from instrumentals with Demucs, extracts a reference melody and lyrics, then scores your live mic pitch against a scrolling note highway.',
  },
  {
    name: 'FoodFindr',
    date: 'Jul 2026',
    color: '#e8877a',
    image: foodfindrDemo,
    link: 'https://github.com/owenchlee/FoodFindr',
    live: 'https://foodfindr.tech',
    desc: "A map-based restaurant recommender that has Claude read real Google reviews to pick one specific spot and dish for your budget, cuisine, and group size — with visit logging, streaks, and a friends leaderboard. Live at foodfindr.tech.",
  },
  {
    name: 'Beat the Bulk',
    date: 'Apr 2026',
    color: '#f0a94e',
    image: blobbyFitDemo,
    link: 'https://github.com/owenchlee/Beat-the-Bulk',
    desc: '"Blobby Fit" — a playful browser workout tracker with a mascot blob that reacts to your progress, built to make logging workouts feel less like a chore.',
  },
  {
    name: 'Gesture Breakout',
    date: 'Apr 2026',
    color: '#4da338',
    image: gestureBreakoutDemo,
    link: 'https://github.com/owenchlee/ThumbGame',
    desc: 'A browser Breakout clone controlled entirely by hand movement in front of a webcam — no mouse or keyboard, just gestures.',
  },
  {
    name: 'Thumb Detector',
    date: 'Apr 2026',
    color: '#8ea9c9',
    image: null,
    link: 'https://github.com/owenchlee/Thumb-Detector',
    desc: 'Real-time hand-tracking with OpenCV and MediaPipe that maps thumb and finger gestures to keyboard and mouse input, letting you drive your computer with just your hand.',
  },
  {
    name: 'ClashMate',
    date: 'Jan 2026',
    color: '#6f5fa3',
    image: null,
    link: null,
    desc: 'A Greenfoot group project mashing up chess with Clash Royale — turn-based piece battles on a grid board, powered by an elixir bar and ability system.',
  },
  {
    name: 'Supermarket Simulation',
    date: 'Nov 2025',
    color: '#d4b23c',
    image: null,
    link: null,
    desc: 'A Greenfoot group project simulating a full supermarket — shelves, checkout lines, restocking trucks, and shopper AI ranging from bargain hunters to impulse buyers.',
  },
  {
    name: 'Vehicle Simulation',
    date: 'Oct 2025',
    color: '#a67a54',
    image: null,
    link: 'https://github.com/owenchlee/Vehicle-Simulation',
    desc: 'A Java/Greenfoot firetruck simulation built over a month of iteration: spreading fire physics, lane-based traffic, collisions, sound effects, and explosion animations.',
  },
  {
    name: 'Just Die',
    date: 'Sep 2025',
    color: '#b5495b',
    image: null,
    link: 'https://abdullah-aloda.itch.io/just-die',
    desc: 'A puzzle-platformer made with a friend where you sacrifice yourself to shape the level — each corpse becomes a permanent block that unlocks new routes and solves puzzles.',
  },
];

// Each entry renders as an item sitting on the shelf in HobbiesPanel —
// `color` is the fallback swatch shown until `image` is set, `label` is the
// nameplate under it. They're auto-chunked into shelf rows (see
// HOBBY_COLS/HOBBY_ROWS in sections.jsx), and the shelf always shows at
// least HOBBY_ROWS rows — so just add more entries here to fill in the
// empty slots over time; no layout code to touch.
export const HOBBIES = [
  { label: 'Basketball', color: '#f0a94e', image: null, desc: "Pickup ball whenever I can get a run going — nothing like a fast break and a clean jump shot to clear my head." },
  { label: 'Gaming', color: '#5b7a94', image: null, desc: "Everything from competitive shooters to cozy indie titles. It's my go-to way to unwind and hang out with friends online." },
];

export const CONTACT = {
  message: "Thanks for stopping by! Here's how to reach me:",
  links: [
    { label: 'Email', href: 'mailto:itsowenchlee@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/owenchlee' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/owenchlee/' },
  ],
};
