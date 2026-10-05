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
// site URL rendered as its own "Visit Live Site" link alongside the title link.

// Demo clips live under public/projects/ (not src/assets/) and are
// referenced by plain path — Vite's dev-server asset-import pipeline hangs
// on Range requests for video files of this size, so these skip it entirely
// and are served as static files in both dev and prod.
import basketballPixel from './assets/Hobbies/pixel/basketball.png';
import badmintonPixel from './assets/Hobbies/pixel/badminton.png';
import boardGamesPixel from './assets/Hobbies/pixel/board-games.png';
import cookingPixel from './assets/Hobbies/pixel/cooking.png';
import runningPixel from './assets/Hobbies/pixel/running.png';
import workoutPixel from './assets/Hobbies/pixel/workout.png';
import singingPixel from './assets/Hobbies/pixel/singing.png';
import pokemonCardsPixel from './assets/Hobbies/pixel/pokemon-cards.png';
import fitsIcon from './assets/projects/fits-icon.svg';
import thumbDetectorShot from './assets/projects/thumb-detector.webp';
import nowLog from './data/now-log.json';

const foodfindrDemo = '/projects/foodfindr-demo.mp4';
const clashmateDemo = '/projects/clashmate-demo.mp4';
const supermarketDemo = '/projects/supermarket-simulation-demo.mp4';
const vehicleSimDemo = '/projects/vehicle-simulation-demo.mp4';
const justDieDemo = '/projects/just-die-demo.mp4';
const karaokeDemo = '/projects/karaoke-demo.mp4';
const ladderGameDemo = '/projects/ladder-game-demo.mp4';

// `**word**` inside `bio` or a `highlights` entry renders as a colored tag
// chip (see Highlighted in App.jsx) instead of plain text — same "bold
// callout" trick as the pill-highlighted role below, just inline within a
// sentence.
//
// `bio` is shown under the role line in the walking HUD — keep it to one
// or two short sentences, the HUD textbox has a fixed vh-based height
// budget so it can't grow into the character sprite (see .hud-textbox in
// App.css). `highlights` is the fuller list of facts, rendered only in
// QuickView, which has no such space constraint. `status` is a small
// availability pill (e.g. what you're open to right now).
export const INTRO = {
  name: 'Owen Lee',
  roleTitle: 'Systems Design Engineering',
  roleOrg: 'University of Waterloo',
  bio: "I build things end to end, from computer vision to full-stack apps to game logic on a breadboard, and I'm always shipping something new.",
  status: 'Open to Summer 2027 co-op',
  highlights: [
    'Builds **full-stack apps**, **games**, and **computer vision** tools, plus the odd breadboard circuit',
    'Won **1st place** out of 115+ competitors at the Daydream Hackathon with Just Die',
    'President of the **Trudeau Athletic Council**, running events for ~1,800 students',
  ],
};

// Rendered by ExperiencePanel (see sections.jsx) and mirrored in QuickView —
// same data-driven pattern as PROJECTS/HOBBIES below, sourced from Owen's
// résumé (public/resume.pdf) so the site and the PDF never drift out of
// sync on the underlying facts, just the presentation.
export const EDUCATION = [
  {
    program: 'Systems Design Engineering',
    school: 'University of Waterloo',
    location: 'Waterloo, ON',
    dates: 'Sept 2026 – June 2031',
    notes: [],
  },
  {
    program: 'High School Diploma',
    school: 'Pierre Elliott Trudeau High School',
    location: 'Markham, ON',
    dates: 'Sept 2022 – June 2026',
    notes: [
      'Schulich Leader Nominee (1 of 455 students)',
      'UWaterloo Contest Distinctions: CCC, Cayley, CIMC, Fermat',
      'DECA Provincials Top 20 Overall · Science Certificate of Excellence (Physics, Chemistry, Biology)',
      'Basketball YRAA Finalist',
    ],
  },
];

// `reward` is the one-line result shown on each role's quest notice in the
// Experience room (sections.jsx); the bullets carry the full story. A role
// still underway can leave it out (its notice shows "Reward: ???").
export const EXPERIENCE = [
  {
    role: 'Campus Ambassador',
    org: 'ElevenLabs',
    reward: 'Selected for the 2026 cohort to promote ElevenReader',
    location: 'Waterloo, ON',
    dates: 'Aug 2026 – Present',
    bullets: [
      "Selected for ElevenLabs' 2026 Campus Ambassador Program, representing ElevenReader at the University of Waterloo",
      'Promoting ElevenReader, an AI app that turns course readings into audio, through campus outreach and events',
    ],
  },
  {
    role: 'Autonomy Software Member',
    org: 'Waterloo Aerial Robotics Group (WARG)',
    location: 'Waterloo, ON',
    dates: 'Sept 2026 – Present',
    bullets: ["Designing autonomy software for the team's aircraft"],
  },
  {
    role: "Founder & Web Developer",
    org: "Catch 'Em Crate",
    reward: '$1,000 revenue + a Youth Startups award',
    location: 'Markham, ON',
    dates: 'June 2025 – Sept 2025',
    bullets: [
      'Built a trading card subscription box business that generated $1,000 in revenue, earning the Markham Youth Startups award',
      'Developed the e-commerce site with HTML, CSS, JavaScript, and Shopify integrations, acquiring 200+ visitors',
    ],
  },
  {
    role: 'President',
    org: 'Trudeau Athletic Council',
    reward: '$5,700 raised for charity',
    location: 'Markham, ON',
    dates: 'Sept 2024 – June 2026',
    bullets: [
      'Lead a team of 24 members creating events for ~1,800 attendees, including a fundraiser that earned $5,700 for charity',
      'Designed and launched new initiatives, including an internal mentorship program and inclusivity efforts across events',
    ],
  },
  {
    role: 'Tutor',
    org: 'Trudeau Tutoring & Co.',
    reward: '10+ students leveled up',
    location: 'Markham, ON',
    dates: 'Sept 2024 – Feb 2025',
    bullets: [
      'Tutored 10+ high school students in math and science, building their skills and confidence in challenging topics',
      "Designed individualized learning plans adapted to each student's feedback and learning style",
    ],
  },
  {
    role: 'Treasurer & Grade Representative',
    org: 'Trudeau Student Activity Council',
    reward: '$8,000+ budget managed',
    location: 'Markham, ON',
    dates: 'Sept 2022 – June 2026',
    bullets: [
      "Managed the council's $8,000+ budget, tracking expenses and optimizing fund allocation",
      'Organized 25+ events for ~1,800 attendees while advocating for 400+ students',
    ],
  },
];

export const SKILLS = [
  { category: 'Languages', items: ['Python', 'Java', 'C++', 'JavaScript', 'HTML/CSS'] },
  { category: 'Tools & Platforms', items: ['Git', 'GitHub', 'OpenCV', 'GameMaker', 'Shopify', 'MS Office'] },
  { category: 'Soft Skills', items: ['Communication', 'Adaptability', 'Teamwork', 'Pitching'] },
];

export const RESUME_URL = '/resume.pdf';

export const PROJECTS = [
  {
    name: 'Fits',
    date: 'Aug 2026',
    color: '#4fae7a',
    image: fitsIcon,
    link: 'https://github.com/owenchlee/Fits',
    tech: ['Next.js', 'TypeScript', 'Capacitor', 'Supabase'],
    desc: 'A mobile workout-tracking app built with Next.js and Capacitor, with progress charts and history that a lot of competing apps lock behind a paywall. Here, all of it is free.',
  },
  {
    name: 'Sing Score',
    date: 'Jul 2026',
    color: '#26a8b1',
    video: karaokeDemo,
    link: 'https://github.com/owenchlee/Personal-Karaoke',
    tech: ['Python', 'PyTorch', 'FastAPI', 'React', 'TypeScript'],
    desc: 'A self-hosted, Rock Band-style karaoke game. Point it at any song and it separates vocals from instrumentals with Demucs, extracts a reference melody and lyrics, then scores your live mic pitch against a scrolling note highway.',
  },
  {
    name: 'FoodFindr',
    date: 'Jul 2026',
    color: '#e8877a',
    video: foodfindrDemo,
    link: 'https://github.com/owenchlee/FoodFindr',
    live: 'https://foodfindr.tech',
    tech: ['Node.js', 'Express', 'SQLite', 'Claude API', 'Google Maps API'],
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
    image: thumbDetectorShot,
    link: 'https://github.com/owenchlee/Flick',
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
    tech: ['GameMaker', 'Game Design', 'Level Design'],
    desc: 'A puzzle-platformer where you sacrifice yourself to shape the level: each corpse becomes a permanent block that opens new routes. Built with a team of 3, it took 1st place out of 115+ competitors at the Daydream Hackathon. I led level design, art direction, and the final pitch.',
  },
];

// Each entry renders as a photo sitting on the shelf in HobbiesPanel —
// `color` is the fallback swatch shown until `image` is set, `label` is the
// nameplate under it. They fill the bookcase HOBBY_COLS per row (see
// HobbiesPanel in sections.jsx), each at its own image's natural aspect
// ratio — so just add more entries here to add more items; no layout code
// to touch. The pixel images are 32px tall and drawn at a whole-number
// multiple of that (see --shelf-scale in App.css) so pixels stay square
// instead of smearing; `scale` is an optional per-item size ratio (rounded
// down to the nearest whole multiple) for items too wide to fit a cubby at
// the default, e.g. the racket.
export const HOBBIES = [
  { label: 'Basketball', color: '#f0a94e', image: basketballPixel, desc: "Pickup ball with friends whenever I can get a run going. I play small forward, and my black Wilson Evolution is my go-to ball on indoor courts." },
  { label: 'Badminton', color: '#4da338', image: badmintonPixel, scale: 0.7, desc: "Watching the birdie fly at ridiculous speeds is weirdly relaxing. It's one of my favorite ways to spend time with friends." },
  { label: 'Cooking', color: '#e8877a', image: cookingPixel, desc: "Always experimenting in the kitchen, from steak to noodles. Watching people actually enjoy what I cook is one of my favorite feelings." },
  { label: 'Board Games', color: '#6f5fa3', image: boardGamesPixel, desc: "Strategy games, party games, anything with a table full of friends and a bit of friendly competition. Catan is my current favorite." },
  { label: 'Running', color: '#26a8b1', image: runningPixel, desc: "The scenery, a good playlist, and the odd new personal best. That's what keeps getting me back out the door for another run." },
  { label: 'Working Out', color: '#8ea9c9', image: workoutPixel, desc: "Regular gym sessions to build strength and stay consistent. It's become one of my favorite daily habits." },
  { label: 'Singing', color: '#b5495b', image: singingPixel, desc: "Karaoke nights and car singalongs are when I feel most free, and I'll take any excuse for one. It's also part of why I built Sing Score, so anyone can do karaoke anywhere." },
  { label: 'Pokémon Cards', color: '#e8c547', image: pokemonCardsPixel, scale: 0.75, desc: "A huge Pokémon card fan and collector since I was a kid. Still ripping packs, hitting card shows, and admiring pulls whenever I can." },
];

export const CONTACT = {
  message: "Thanks for stopping by! Here's how to reach me:",
  email: 'itsowenchlee@gmail.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/owenchlee' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/owenchlee/' },
  ],
};

// Unlocked in the Contact house once a visitor earns all 8 badges (see
// achievements.js). DRAFT: rewrite in your own words, or swap in a fun
// fact or a hidden project, whatever you'd want the rare visitor who
// explored everything to find.
export const SECRET_NOTE = {
  title: 'You found everything!',
  body: "Thanks for exploring every corner of this little town. Most people stop after a house or two, so that makes you the Champion. Send me an email with \"Champion\" in the subject and tell me which house you liked best. I'd love to hear from you.",
};

// The notice board by the spawn point is Owen's monthly log (NowLog.jsx):
// one first-person entry per month in data/now-log.json, newest first. A
// scheduled Claude routine adds each new month and pushes it; the board
// also fetches the file live from GitHub (NOW_LOG_URL), so a new entry
// shows up without redeploying the site.
export const NOW_LOG = [...nowLog.entries].sort((a, b) => b.month.localeCompare(a.month));
export const NOW_LOG_URL = 'https://raw.githubusercontent.com/owenchlee/owenchlee.me/main/src/data/now-log.json';
// A standing note pinned under the latest entry.
export const NOW_PINNED = 'Looking for a Summer 2027 co-op. If your team is hiring, the Contact house is down the road!';

// The hands-on builds in the hidden workshop (see secrets.js for how
// visitors get in): the hardware projects from the résumé's Computer
// Engineering section, plus the woodworking-class phone stand. `gadget`
// picks which prop stands for each one on the workbench (Workshop.jsx).
export const WORKSHOP_PROJECTS = [
  {
    name: 'Arduino Math Game',
    gadget: 'arduino',
    color: '#26a8b1',
    tech: ['C++', 'Arduino', 'Fritzing'],
    desc: 'A math game written in C++ that runs on an Arduino and generates quizzes on the fly. I also designed its circuit schematic in Fritzing.',
  },
  {
    name: 'Navigation Helmet',
    gadget: 'helmet',
    color: '#e0b23c',
    tech: ['Python', 'Micro:bit', 'Radio'],
    desc: 'A helmet that helps visually impaired people find their way, using a Micro:bit and radio signals, programmed in Python with a team of 4.',
  },
  {
    name: 'Wooden Phone Stand',
    gadget: 'stand',
    color: '#b5793c',
    tech: ['Woodworking', 'Measuring', 'Hand tools'],
    desc: 'A phone stand from woodworking class. I measured and cut all the wood myself, and sized the slot so it fits all the common phone models.',
  },
];

// What can bite at the ponds (see FishingBox.jsx). `weight` is how often
// it turns up relative to the others; each one comes with a fact. The
// rusty key isn't in here: it's a one-time catch that opens the workshop.
// `pixels` is a 9x9 map in the same format as the badges.
const FISH_PIXELS = ['.........', '..oooo...', '.ohhbbo.o', 'ohobbbsoo', 'ohbbbbsso', '.obbbsoso', '..ooooo.o', '.........', '.........'];
export const FISH = [
  { id: 'perch', name: 'Pixel Perch', color: '#e0b23c', weight: 10, pixels: FISH_PIXELS, fact: "The Ladder Game in the Projects arcade runs on a real breadboard, all circuitry and no screen." },
  { id: 'bass', name: 'Byte Bass', color: '#5b7a94', weight: 10, pixels: FISH_PIXELS, fact: 'FoodFindr has Claude read real Google reviews, then picks one spot and one dish for you.' },
  { id: 'guppy', name: 'Greenfoot Guppy', color: '#4da338', weight: 10, pixels: FISH_PIXELS, fact: 'Three of the projects are Greenfoot simulations: fire trucks, a whole supermarket, and chess crossed with Clash Royale.' },
  { id: 'koi', name: 'Karaoke Koi', color: '#e8877a', weight: 6, pixels: FISH_PIXELS, fact: 'Sing Score splits any song into vocals and instrumentals, then grades your singing against the melody.' },
  { id: 'goby', name: 'Gesture Goby', color: '#8ea9c9', weight: 6, pixels: FISH_PIXELS, fact: 'Thumb Detector lets you drive a computer with hand gestures, tracked live with MediaPipe.' },
  { id: 'boot', name: 'Old Boot', color: '#a67a54', weight: 5, pixels: ['..oooo...', '..obbo...', '..obbo...', '..ohbo...', '..ohbbooo', '.ohbbbbbo', '.obbbbbso', '.ooooooo.', '.........'], fact: 'Somebody must have walked the whole road in it.' },
  { id: 'holo', name: 'Holo Carp', color: '#c88ce8', weight: 4, shiny: true, pixels: FISH_PIXELS, fact: "A shiny! About as rare as pulling a holo from a Pokémon pack." },
];

export const RUSTY_KEY = {
  id: 'key',
  name: 'Rusty Key',
  color: '#b5793c',
  pixels: ['..ooo....', '.ohhbo...', '.ob.bo...', '.obbso...', '..oso....', '..obo....', '..obooo..', '..obbso..', '..ooooo..'],
  fact: "Its tag says WORKSHOP. Didn't the dirt track past the Contact house lead to an old shed?",
};

// What the townsfolk and signposts say when tapped, keyed by the id of the
// NPC, pet walker or sign in tileMap.js. `lines` play one at a time in the
// dialogue box at the bottom of the screen (tap or press Enter to move
// on). A mix of badge hints and facts from the sections, so chatting with
// people is a second way to find things out.
export const DIALOGUE = {
  'sign-welcome': {
    name: 'Sign',
    lines: [
      "WELCOME TO OWEN'S TOWN! Population: a few villagers, a couple of dogs, and you.",
      'Tap anywhere to walk the stone road. Tap a house to step inside. Arrow keys, WASD and Enter work too.',
      'Four houses: Projects, Experience, Hobbies and Contact. Exploring them earns badges (top right).',
      "Anyone with a speech bubble has something to say. And this town has a few secrets...",
    ],
  },
  'sign-end': {
    name: 'Sign',
    lines: [
      'END OF THE ROAD. You walked the whole thing. That has to be worth something...',
      'Scratched into the back of the sign: UP UP DOWN DOWN LEFT RIGHT LEFT RIGHT B A.',
    ],
  },
  'workshop-locked': {
    name: 'Old Workshop',
    lines: [
      "It's boarded up, and the door has a rusty padlock on it.",
      "Maybe the key got lost somewhere wet. Or maybe there's a code...",
    ],
  },
  'secret-konami': {
    name: '???',
    lines: ['Somewhere down the road, a padlock clicks open...', 'The old workshop past the Contact house is open now.'],
  },
  barricade: {
    name: 'Barricade',
    lines: ["ROAD CLOSED. Only the stone road is open. The dirt tracks just lead to people's front doors."],
  },
  'npc-1': {
    name: 'Villager',
    lines: ['Welcome to town!', "All of Owen's projects are in the lab up the road. Tap the building to go in."],
  },
  'npc-2': {
    name: 'Hiker',
    lines: [
      "I've walked this road more times than I can count.",
      "They say there's a badge waiting for anyone who follows it all the way to the end.",
    ],
  },
  'npc-3': {
    name: 'Collector',
    lines: [
      'Owen keeps a shelf of favorite things in the Hobbies house.',
      'Look at every item on it and you might earn a badge for your trouble.',
    ],
  },
  'npc-4': {
    name: 'Fisher',
    lines: [
      'Tap the water to cast a line. When the ! pops up, tap again, fast!',
      "Every fish in these ponds knows something about Owen. Some folks say there's more than fish down there, too.",
    ],
  },
  'npc-5': {
    name: 'Night Owl',
    lines: [
      'Looking for Owen? Knock on the Contact house, just back up the road.',
      'Or open the résumé. That counts for a badge too.',
    ],
  },
  'npc-6': {
    name: 'Student',
    lines: [
      "Owen's studying Systems Design Engineering at the University of Waterloo.",
      "Know anyone hiring for a Summer 2027 co-op? Owen's looking!",
    ],
  },
  'npc-7': {
    name: 'Gamer',
    lines: [
      'Did you hear Just Die took 1st place at the Daydream Hackathon? Out of 115+ competitors!',
      'Every time you die in that game, your body turns into a block you can stand on. Wild.',
    ],
  },
  'npc-8': {
    name: 'Coach',
    lines: [
      'Owen runs the Trudeau Athletic Council: 24 members, events for about 1,800 students.',
      'Their charity fundraiser brought in $5,700, too.',
    ],
  },
  'pet-1': {
    name: 'Dog Walker',
    lines: [
      'This is Biscuit. Say hi!',
      'Biscuit: Woof!',
      "Fun fact: Owen's allergic to cats, so this is strictly a dog town. Sorry, cat lovers!",
    ],
  },
  'pet-2': {
    name: 'Dog Walker',
    lines: [
      "We're out for our evening walk.",
      'Psst... collect all 8 badges and a secret note shows up at the Contact house.',
    ],
  },
  // Tapping the board opens the log itself (NowLog.jsx); these lines are
  // only the fallback.
  'now-board': {
    name: 'Notice Board',
    lines: [NOW_LOG[0]?.text ?? '', NOW_PINNED],
  },
};
