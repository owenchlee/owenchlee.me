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
  bio: "I'm a Systems Design Engineer currently studying at the University of Waterloo. I love building things, learning new skills, and solving problems.",
};

export const PROJECTS = [
  {
    name: 'Project Alpha',
    date: 'Mar 2026',
    color: '#26a8b1',
    image: null,
    desc: 'One or two sentences on what this project is, what problem it solves, and the stack behind it.',
  },
  {
    name: 'Project Beta',
    date: 'Jan 2026',
    color: '#4da338',
    image: null,
    desc: 'Placeholder case-study blurb — swap in a real screenshot and a short write-up of your role and impact.',
  },
  {
    name: 'Project Gamma',
    date: 'Nov 2025',
    color: '#a67a54',
    image: null,
    desc: 'A third placeholder entry. Each card is meant to hold one image and a few lines of context.',
  },
];

export const HOBBIES = [
  { label: 'Photography', color: '#e8b4bc', image: null, desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Basketball', color: '#f0a94e', image: null, desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Cooking', color: '#e8877a', image: null, desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Reading', color: '#8ea9c9', image: null, desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Music', color: '#b79fd1', image: null, desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Hiking', color: '#8fbf8a', image: null, desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
];

export const CONTACT = {
  message: "Thanks for stopping by! Here's how to reach me:",
  links: [
    { label: 'Email', href: '#' },
    { label: 'GitHub', href: '#' },
    { label: 'LinkedIn', href: '#' },
  ],
};
