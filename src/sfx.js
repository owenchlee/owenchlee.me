// Little synthesized sound effects: badge stings, footsteps, doors and the
// fishing sounds. Like the music, nothing here is an audio file. They only
// play once the visitor has turned the music on themselves (MusicPlayer
// calls setSoundEnabled), so a sound effect is never the first thing a
// visitor hears, and pausing the music silences them too.
let enabled = false;
let ctx = null;
let noise = null;
let suspendId = null;

export function setSoundEnabled(on) {
  enabled = on;
}

// The shared context, woken up for a sound and put back to sleep a couple
// of seconds after the last one so the audio thread isn't left running.
function audio(holdS = 1) {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    clearTimeout(suspendId);
    suspendId = setTimeout(() => ctx.suspend(), (holdS + 1.5) * 1000);
    return ctx;
  } catch {
    return null;
  }
}

function tone(ac, { freq, start = 0, dur, type = 'square', vol = 0.05, slideTo }) {
  const t0 = ac.currentTime + 0.02 + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// A short burst of filtered noise: footsteps and splashes.
function hiss(ac, { dur, freq, q = 1, vol, start = 0 }) {
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = ac.currentTime + 0.01 + start;
  const src = ac.createBufferSource();
  src.buffer = noise;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0, Math.random() * 0.4);
  src.stop(t0 + dur + 0.02);
}

const JINGLES = {
  // Rising arpeggio + held top note, loosely in the spirit of the
  // classic "obtained a badge" sting — not a transcription of it.
  badge: [
    [523.25, 0, 0.12],
    [659.25, 0.12, 0.12],
    [783.99, 0.24, 0.12],
    [1046.5, 0.36, 0.45],
  ],
  champion: [
    [523.25, 0, 0.14],
    [523.25, 0.16, 0.14],
    [523.25, 0.32, 0.14],
    [659.25, 0.48, 0.3],
    [587.33, 0.8, 0.14],
    [659.25, 0.96, 0.14],
    [783.99, 1.12, 0.7],
  ],
  catch: [
    [783.99, 0, 0.08],
    [987.77, 0.08, 0.08],
    [1174.66, 0.16, 0.25],
  ],
  // A spooky little descending-then-up figure for unlocking a secret.
  secret: [
    [392.0, 0, 0.12],
    [369.99, 0.12, 0.12],
    [311.13, 0.24, 0.12],
    [220.0, 0.36, 0.12],
    [207.65, 0.48, 0.12],
    [329.63, 0.6, 0.12],
    [415.3, 0.72, 0.12],
    [523.25, 0.84, 0.5],
  ],
};

export function playJingle(kind) {
  const ac = audio(2);
  if (!ac) return;
  JINGLES[kind].forEach(([freq, start, dur]) => tone(ac, { freq, start, dur }));
}

// Soft scuff on the stone road, a little different every step.
let stepAlt = false;
export function playStep() {
  const ac = audio();
  if (!ac) return;
  stepAlt = !stepAlt;
  hiss(ac, { dur: 0.05, freq: (stepAlt ? 1500 : 1250) + Math.random() * 200, q: 1.4, vol: 0.05 });
}

// Door creak: a low slide up going in, down coming out, and a knock-shut.
export function playDoor(entering) {
  const ac = audio();
  if (!ac) return;
  tone(ac, { freq: entering ? 180 : 260, slideTo: entering ? 260 : 180, dur: 0.18, type: 'triangle', vol: 0.06 });
  tone(ac, { freq: 90, start: 0.2, dur: 0.07, type: 'square', vol: 0.05 });
}

export function playSplash() {
  const ac = audio();
  if (!ac) return;
  hiss(ac, { dur: 0.25, freq: 900, q: 0.7, vol: 0.06 });
  tone(ac, { freq: 600, slideTo: 300, dur: 0.12, type: 'sine', vol: 0.04 });
}

export function playBite() {
  const ac = audio();
  if (!ac) return;
  tone(ac, { freq: 1318.5, dur: 0.06, vol: 0.05 });
  tone(ac, { freq: 1318.5, start: 0.09, dur: 0.06, vol: 0.05 });
}

export function playMiss() {
  const ac = audio();
  if (!ac) return;
  tone(ac, { freq: 330, slideTo: 165, dur: 0.3, type: 'triangle', vol: 0.05 });
}
