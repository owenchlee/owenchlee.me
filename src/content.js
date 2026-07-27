// All user-facing text and data for the site lives here — sections.jsx just
// renders whatever's in these objects/arrays. Edit this file to change what
// the site says; no JSX or layout code to touch.
//
// `image` (on PROJECTS/HOBBIES entries) is optional: point it at a real
// image — either `import myPhoto from './assets/projects/alpha.png'` up top
// and reference `myPhoto` here, or a plain string path under `public/` — and
// the card shows it. Leave it `null` and the card falls back to a colored
// placeholder box instead, so sections can be filled in one at a time
// without anything looking broken in the meantime.

export const INTRO = {
  name: 'Owen Lee',
  bio: "I'm an incoming Systems Design Engineering student at the University of Waterloo. I love building things — web apps, games, computer-vision tools, and hardware — learning new skills, and solving problems.",
};

export const PROJECTS = [
  {
    name: 'Just Die',
    date: '2025',
    color: '#a67a54',
    image: null,
    desc: 'A puzzle-platformer built in GameMaker with a team of 3. I led level design, art direction, and the final pitch — taking 1st place out of 115+ competitors at the Daydream Hackathon.',
  },
  {
    name: 'Gesture Control App',
    date: '2025',
    color: '#26a8b1',
    image: null,
    desc: 'A computer-vision app in Python using OpenCV and MediaPipe that maps hand gestures to mouse and OS controls, with a smoothing algorithm to cut motion jitter for accurate real-time tracking.',
  },
  {
    name: "Catch 'Em Crate",
    date: 'Jun – Sept 2025',
    color: '#4da338',
    image: null,
    desc: 'A trading-card subscription-box business I founded, generating $1,000 in revenue and earning the Markham Youth Startups award. Built the e-commerce site with HTML, CSS, JavaScript, and Shopify, drawing 200+ visitors.',
  },
  {
    name: 'Hardware & Engineering Projects',
    date: '2024 – 2025',
    color: '#c9803f',
    image: null,
    desc: 'A math game on Arduino written in C++ (schematic designed in Fritzing) and a navigation helmet for the visually impaired built with Python, a Micro:bit, and radio signal alongside a team of 4.',
  },
  {
    name: 'Simulation Projects',
    date: '2024',
    color: '#8ea9c9',
    image: null,
    desc: 'Java OOP simulations modeling vehicles and animal agents with collision detection, plus a grid-based supermarket simulation that routes customer movement using node-based pathfinding.',
  },
];

export const HOBBIES = [
  { label: 'Basketball', color: '#f0a94e', image: null, desc: 'YRAA finalist — I play whenever I get the chance and love the pace and teamwork of the game.' },
  { label: 'Game Development', color: '#a67a54', image: null, desc: 'Designing and building games in GameMaker, from level design to art direction — including a 1st-place hackathon win.' },
  { label: 'Tinkering & Hardware', color: '#26a8b1', image: null, desc: 'Building with Arduino and Micro:bit, wiring up circuits, and turning ideas into physical projects.' },
  { label: 'Art & Design', color: '#e8b4bc', image: null, desc: 'Creating pixel art, posters, and visual content — and helping run the Markham Teen Art Council.' },
];

export const CONTACT = {
  message: "Thanks for stopping by! Here's how to reach me:",
  links: [
    { label: 'Email', href: 'mailto:itsowenchlee@gmail.com' },
    // TODO: add your GitHub profile URL here when ready.
    { label: 'GitHub', href: '#' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/owenchlee/' },
  ],
};
