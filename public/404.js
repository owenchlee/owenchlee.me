// Pixel maps drawn as SVG rects (same idea as the badge pixel maps in
// src/achievements.js). One character per pixel, '.' is empty.
const PALETTE = { o: '#1c1712', w: '#f8f0dc', g: '#cfd6e6', s: '#8e97b3', r: '#c9463e', b: '#5b7a94', k: '#e0b23c', n: '#a67a54' };
const FOE = [
  '....oooooo....',
  '..oowwwwwwoo..',
  '.owwwwwwwwwwo.',
  '.owwoowwoowwo.',
  'owwwoowwoowwwo',
  'owwwwwwwwwwwwo',
  'owwwwoooowwwwo',
  'owwwwwrrwwwwgo',
  'owwwwwwwwwwggo',
  'owwwwwwwwwwgso',
  'owgwwwgwwwgsso',
  'oggo.ogggo.oso',
  'oo....ooo....o',
];
const YOU = [
  '....oooooo....',
  '...obbbbbbo...',
  '..obbbbbbbbo..',
  '..obbbbbbbbo..',
  '..onnnnnnnno..',
  '...onnnnnno...',
  '..orrrrrrrro..',
  '.orrrrrrrrrro.',
  '.onrrrrrrrrno.',
  '.onrrrrrrrrno.',
  '..obbbbbbbbo..',
  '..obbbo.obbbo.',
  '..ooo....ooo..',
];
function draw(map) {
  const h = map.length;
  const w = map[0].length;
  let rects = '';
  map.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (PALETTE[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${PALETTE[ch]}"/>`;
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${rects}</svg>`;
}
document.getElementById('foe').innerHTML = draw(FOE);
document.getElementById('you').innerHTML = draw(YOU);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const text = document.getElementById('text');
const lines = [
  'A wild MISSING PAGE appeared!',
  `Nothing lives at ${location.pathname}. Pick a move to go somewhere real.`,
];

// Typewriter, like the dialogue box in town. The full message is in the
// HTML already, so screen readers and no-JS visitors get it at once.
function type(line) {
  return new Promise((done) => {
    if (reduced) {
      text.textContent = line;
      return done();
    }
    text.classList.add('typing');
    let i = 0;
    const tick = () => {
      text.textContent = line.slice(0, ++i);
      if (i < line.length) setTimeout(tick, 28);
      else {
        text.classList.remove('typing');
        done();
      }
    };
    tick();
  });
}

text.setAttribute('aria-live', 'polite');
(async () => {
  await type(lines[0]);
  await new Promise((r) => setTimeout(r, reduced ? 0 : 900));
  await type(lines[1]);
})();

// Pointing at any move knocks the page's HP down, purely for fun.
const hp = document.getElementById('foe-hp');
document.querySelectorAll('.moves a').forEach((a) => {
  const hit = () => {
    hp.style.width = '18%';
    hp.classList.add('hp-fill--low');
  };
  const heal = () => {
    hp.style.width = '100%';
    hp.classList.remove('hp-fill--low');
  };
  a.addEventListener('mouseenter', hit);
  a.addEventListener('focus', hit);
  a.addEventListener('mouseleave', heal);
  a.addEventListener('blur', heal);
});

// Arrow keys move between the moves, like a battle menu.
const moves = [...document.querySelectorAll('.moves a')];
document.addEventListener('keydown', (e) => {
  const i = moves.indexOf(document.activeElement);
  const step = { ArrowDown: 2, ArrowUp: -2, ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (step === undefined) return;
  e.preventDefault();
  const next = i === -1 ? 0 : Math.min(moves.length - 1, Math.max(0, i + step));
  moves[next].focus();
});
