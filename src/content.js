// All user-facing text and data for the site lives here — sections.jsx just
// renders whatever's in these objects/arrays. Edit this file to change what
// the site says; no JSX or layout code to touch.
//
// `image` (on PROJECTS and HOBBIES entries) is optional: point it at a real
// image — either `import myPhoto from './assets/projects/alpha.png'` up top
// and reference `myPhoto` here, or a plain string path under `public/` —
// and the card/shelf item shows it. Leave it `null` and it falls back to a
// colored placeholder instead, so entries can be filled in one at a time
// without anything looking broken in the meantime. PROJECTS entries can use
// `video` instead — a muted autoplay/loop `<video>` (see CardThumb in
// sections.jsx) rather than a still image; use it for short compressed mp4
// clips instead of raw GIFs, which are 50-100x larger for the same footage.
//
// `tech` is an optional array of stack tags rendered as chips on the card —
// keep it short and accurate, recruiters scan these for keyword matches.
// `link` is the repo/source URL; `live` (optional) is a separate deployed-
// site URL rendered as its own "Live Demo" link alongside the title link.

// Demo clips live under public/projects/ (not src/assets/) and are
// referenced by plain path — Vite's dev-server asset-import pipeline hangs
// on Range requests for video files of this size, so these skip it entirely
// and are served as static files in both dev and prod.
import basketballPixel from './assets/Hobbies/pixel/basketball.png';
import badmintonPixel from './assets/Hobbies/pixel/badminton.png';
import boardGamesPixel from './assets/Hobbies/pixel/board-games.png';
import cookingPixel from './assets/Hobbies/pixel/cooking.png';
import gamingPixel from './assets/Hobbies/pixel/gaming.png';
import runningPixel from './assets/Hobbies/pixel/running.png';
import workoutPixel from './assets/Hobbies/pixel/workout.png';
import singingPixel from './assets/Hobbies/pixel/singing.png';

const foodfindrDemo = '/projects/foodfindr-demo.mp4';
const clashmateDemo = '/projects/clashmate-demo.mp4';
const supermarketDemo = '/projects/supermarket-simulation-demo.mp4';
const vehicleSimDemo = '/projects/vehicle-simulation-demo.mp4';
const justDieDemo = '/projects/just-die-demo.mp4';
const karaokeDemo = '/projects/karaoke-demo.mp4';
const ladderGameDemo = '/projects/ladder-game-demo.mp4';

// `**word**` inside a highlight string renders as a colored tag chip (see
// Highlighted in App.jsx) instead of plain text — same "bold callout" trick
// as the pill-highlighted role below, just inline within a sentence.
//
// `bio` is one short sentence shown under the role line — keep it brief,
// the HUD textbox has a fixed height budget so it can't grow into the
// character sprite. `status` is a small availability pill (e.g. what
// you're open to right now).
export const INTRO = {
  name: 'Owen Lee',
  roleTitle: 'Systems Design Engineering',
  roleOrg: 'University of Waterloo',
  bio: "I like building things end-to-end — from computer vision to full-stack apps to game logic on a breadboard.",
  status: 'Open to internships/co-op',
  highlights: [
    'Builds **full-stack apps**, **games**, and **computer vision tools**',
    'Shipped **FoodFindr**, live at foodfindr.tech',
    'Always learning something new and **shipping side projects**',
  ],
};

export const PROJECTS = [
  {
    name: 'Personal Karaoke',
    date: 'Jul 2026',
    color: '#26a8b1',
    video: karaokeDemo,
    link: 'https://github.com/owenchlee/Personal-Karaoke',
    tech: ['Python', 'PyTorch', 'Demucs'],
    desc: 'A self-hosted, Rock Band-style karaoke game. Point it at any song and it separates vocals from instrumentals with Demucs, extracts a reference melody and lyrics, then scores your live mic pitch against a scrolling note highway.',
  },
  {
    name: 'FoodFindr',
    date: 'Jul 2026',
    color: '#e8877a',
    video: foodfindrDemo,
    link: 'https://github.com/owenchlee/FoodFindr',
    live: 'https://foodfindr.tech',
    tech: ['React', 'Node.js', 'PostgreSQL', 'Claude API'],
    desc: "A map-based restaurant recommender that has Claude read real Google reviews to pick one specific spot and dish for your budget, cuisine, and group size, with visit logging, streaks, and a friends leaderboard. Live at foodfindr.tech.",
  },
  {
    name: 'Ladder Game',
    date: 'Jun 2026',
    color: '#f0a94e',
    video: ladderGameDemo,
    link: null, // Physical breadboard build, no code repo — intentionally unlinked.
    tech: ['Digital Logic', 'Breadboard', 'Electronics'],
    desc: 'A physical ladder-logic game built on a breadboard, with real circuitry and components driving the gameplay instead of a screen.',
  },
  {
    name: 'Thumb Detector',
    date: 'Apr 2026',
    color: '#8ea9c9',
    image: null,
    link: 'https://github.com/owenchlee/Thumb-Detector',
    tech: ['Python', 'OpenCV', 'MediaPipe'],
    desc: 'Real-time hand-tracking with OpenCV and MediaPipe that maps thumb and finger gestures to keyboard and mouse input, letting you drive your computer with just your hand.',
  },
  {
    name: 'ClashMate',
    date: 'Jan 2026',
    color: '#6f5fa3',
    video: clashmateDemo,
    link: 'https://github.com/SaifulShaik/Clashmate',
    tech: ['Java', 'Greenfoot'],
    desc: 'A Greenfoot group project mashing up chess with Clash Royale: turn-based piece battles on a grid board, powered by an elixir bar and ability system.',
  },
  {
    name: 'Supermarket Simulation',
    date: 'Nov 2025',
    color: '#d4b23c',
    video: supermarketDemo,
    link: 'https://github.com/SaifulShaik/Supermarket-Simulation',
    tech: ['Java', 'Greenfoot'],
    desc: 'A Greenfoot group project simulating a full supermarket, with shelves, checkout lines, restocking trucks, and shopper AI ranging from bargain hunters to impulse buyers.',
  },
  {
    name: 'Vehicle Simulation',
    date: 'Oct 2025',
    color: '#a67a54',
    video: vehicleSimDemo,
    link: 'https://github.com/owenchlee/Vehicle-Simulation',
    tech: ['Java', 'Greenfoot'],
    desc: 'A Java/Greenfoot firetruck simulation built over a month of iteration: spreading fire physics, lane-based traffic, collisions, sound effects, and explosion animations.',
  },
  {
    name: 'Just Die',
    date: 'Sep 2025',
    color: '#b5495b',
    video: justDieDemo,
    link: 'https://abdullah-aloda.itch.io/just-die',
    tech: ['Game Design', 'Level Design'],
    desc: 'A puzzle-platformer made with a friend where you sacrifice yourself to shape the level: each corpse becomes a permanent block that unlocks new routes and solves puzzles.',
  },
];

// Each entry renders as a photo sitting on the shelf in HobbiesPanel —
// `color` is the fallback swatch shown until `image` is set, `label` is the
// nameplate under it. They wrap into as many shelf rows as fit (see
// HobbiesPanel in sections.jsx), each at its own photo's natural aspect
// ratio — so just add more entries here to add more items; no layout code
// to touch.
export const HOBBIES = [
  { label: 'Basketball', color: '#f0a94e', image: basketballPixel, desc: "Pickup ball whenever I can get a run going — nothing like a fast break and a clean jump shot to clear my head." },
  { label: 'Gaming', color: '#5b7a94', image: gamingPixel, desc: "Everything from competitive shooters to cozy indie titles. It's my go-to way to unwind and hang out with friends online." },
  { label: 'Badminton', color: '#4da338', image: badmintonPixel, desc: "Fast rallies and faster reflexes — one of my favorite ways to get a good sweat in with friends." },
  { label: 'Cooking', color: '#e8877a', image: cookingPixel, desc: "Always experimenting in the kitchen, from weeknight staples to trying to recreate dishes I loved somewhere." },
  { label: 'Board Games', color: '#6f5fa3', image: boardGamesPixel, desc: "Strategy games, party games, anything with a table full of friends and a bit of friendly competition." },
  { label: 'Running', color: '#26a8b1', image: runningPixel, desc: "A steady way to clear my head and stay in shape — chasing a few personal bests along the way." },
  { label: 'Working Out', color: '#8ea9c9', image: workoutPixel, desc: "Regular gym sessions to build strength and stay consistent — it's become one of my favorite daily habits." },
  { label: 'Singing', color: '#b5495b', image: singingPixel, desc: "Karaoke, car singalongs, whatever excuse I can find — also part of why I built Personal Karaoke." },
];

export const CONTACT = {
  message: "Thanks for stopping by! Here's how to reach me:",
  email: 'itsowenchlee@gmail.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/owenchlee' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/owenchlee/' },
  ],
};
