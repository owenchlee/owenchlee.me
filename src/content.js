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
  { label: 'Making Tech Projects', color: '#26a8b1', image: null, desc: 'Building apps, games, and hardware for fun — from computer-vision tools to Arduino gadgets. It\'s my favorite way to learn.' },
  { label: 'Video Games', color: '#a67a54', image: null, desc: 'Playing and studying games of all kinds — it\'s a big part of why I got into building them too.' },
  { label: 'Working Out', color: '#f0a94e', image: null, desc: 'Hitting the gym to stay strong and clear my head.' },
  { label: 'Running', color: '#4da338', image: null, desc: 'Getting outside for a run whenever I can — a good way to reset.' },
  { label: 'Board Games', color: '#c9803f', image: null, desc: 'Gathering friends for a good strategy or party game.' },
  { label: 'Singing', color: '#b79fd1', image: null, desc: 'Singing for fun and letting loose.' },
  { label: 'Listening to Music', color: '#8ea9c9', image: null, desc: 'Always have something playing — music is the soundtrack to everything I do.' },
  { label: 'Cooking', color: '#e8877a', image: null, desc: 'Experimenting in the kitchen and cooking up something new.' },
];

export const CONTACT = {
  message: "Thanks for stopping by! Here's how to reach me:",
  links: [
    { label: 'Email', href: 'mailto:itsowenchlee@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/owenchlee' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/owenchlee/' },
  ],
};
