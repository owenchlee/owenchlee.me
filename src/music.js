// Tiny procedural ambient music engine — no audio files. Every "track" is a
// short chord loop synthesized at runtime from oscillators, so there's
// nothing to source, license, or credit, and the bundle doesn't grow by
// megabytes of audio. The three moods echo the site's own day -> dusk ->
// night lighting cycle (see getLightingTint in tileMap.js) without being
// tied to scroll position — picking a track here is a separate,
// visitor-driven choice.
//
// Each bar (eight eighth-note steps) layers four voices over one chord:
//   pad    — the chord held softly under everything, slow swell in and out
//   bass   — the chord's root on the downbeat (and the "and" of 3)
//   arp    — plucked chord tones following the track's step pattern
//   melody — a sparse pentatonic line that moves stepwise and lands on
//            chord tones on strong beats, so it wanders without clashing
// All notes are MIDI numbers (60 = middle C).
const TRACKS = {
  daybreak: {
    label: 'Daybreak',
    tempo: 92,
    gain: 0.16,
    filterFreq: 3200,
    // C – G/B – Am – F: bright, open, and it loops back to C cleanly.
    chords: [
      { bass: 48, notes: [60, 64, 67, 71] },
      { bass: 47, notes: [59, 62, 67, 69] },
      { bass: 45, notes: [57, 60, 64, 67] },
      { bass: 41, notes: [57, 60, 64, 65] },
    ],
    arp: [0, 2, 1, 3, 2, 1, 3, 2],
    arpLevel: 0.11,
    padLevel: 0.05,
    scale: [72, 74, 76, 79, 81, 84, 86],
    melodySteps: [0, 3, 4, 6],
    melodyChance: 0.6,
    melodyLevel: 0.07,
  },
  twilight: {
    label: 'Twilight',
    tempo: 74,
    gain: 0.15,
    filterFreq: 2000,
    // Am7 – Fmaj7 – C – G: the same key turned wistful.
    chords: [
      { bass: 45, notes: [57, 60, 64, 67] },
      { bass: 41, notes: [57, 60, 64, 65] },
      { bass: 48, notes: [55, 60, 64, 67] },
      { bass: 43, notes: [55, 59, 62, 67] },
    ],
    arp: [0, null, 2, 1, null, 3, 2, null],
    arpLevel: 0.1,
    padLevel: 0.06,
    scale: [69, 72, 74, 76, 79, 81, 84],
    melodySteps: [0, 4, 6],
    melodyChance: 0.45,
    melodyLevel: 0.06,
  },
  nightwatch: {
    label: 'Night Watch',
    tempo: 60,
    gain: 0.15,
    filterFreq: 1300,
    // Dm7 – Bbmaj7 – Fmaj7 – Gm7, low and slow.
    chords: [
      { bass: 38, notes: [50, 53, 57, 60] },
      { bass: 46, notes: [50, 53, 57, 58] },
      { bass: 41, notes: [53, 57, 60, 64] },
      { bass: 43, notes: [53, 55, 58, 62] },
    ],
    arp: [0, null, null, 2, null, null, 3, null],
    arpLevel: 0.09,
    padLevel: 0.07,
    scale: [62, 65, 67, 69, 72, 74],
    melodySteps: [0, 4],
    melodyChance: 0.35,
    melodyLevel: 0.05,
  },
};

export const TRACK_LIST = Object.entries(TRACKS).map(([id, t]) => ({ id, label: t.label }));

const STEPS_PER_BAR = 8;
const midiToFreq = (m) => 440 * 2 ** ((m - 69) / 12);

// Deterministic per-step dice, so the melody is varied but the same loop
// position always plays the same thing (it reads as a tune, not noise).
function rand(a, b) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Classic "tale of two clocks" scheduler (Chris Wilson's pattern): a
// setTimeout tick every `lookahead` seconds queues any notes whose start
// time falls within the next `scheduleAhead` window, so note timing comes
// from the audio clock (ctx.currentTime) rather than the imprecise
// setTimeout clock itself.
const LOOKAHEAD = 0.1;
const SCHEDULE_AHEAD = 0.25;

export function createMusicEngine() {
  let ctx = null;
  let master = null;
  let filter = null;
  let delayNode = null;
  let timerId = null;
  let suspendId = null;
  let trackId = TRACK_LIST[0].id;
  let step = 0;
  let nextStepTime = 0;
  let melodyNote = null;

  // A short generated impulse response: decaying stereo noise, which is
  // all a small-room reverb really is.
  function makeReverb() {
    const len = Math.floor(ctx.sampleRate * 2.2);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    return conv;
  }

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;

    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.5;

    // Echo synced to the tempo (a dotted eighth, set per track in tick),
    // so repeats land in the groove instead of smearing across it.
    delayNode = ctx.createDelay(2.0);
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const delayWet = ctx.createGain();
    delayWet.gain.value = 0.22;

    const reverb = makeReverb();
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.35;

    // Keeps stacked notes from ever clipping.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 6;

    filter.connect(master);
    filter.connect(delayNode);
    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(delayWet);
    delayWet.connect(master);
    filter.connect(reverb);
    reverb.connect(reverbWet);
    reverbWet.connect(master);
    master.connect(limiter);
    limiter.connect(ctx.destination);
  }

  // Plucked note: near-instant attack, exponential decay, with a quiet
  // sine an octave up for a little bell-like sparkle.
  function pluck(midi, time, decay, level) {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(level, time + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    env.connect(filter);

    [['triangle', 1, 1], ['sine', 2, 0.3]].forEach(([type, mult, mix]) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(midiToFreq(midi) * mult, time);
      const g = ctx.createGain();
      g.gain.value = mix;
      osc.connect(g);
      g.connect(env);
      osc.start(time);
      osc.stop(time + decay + 0.05);
    });
  }

  // Soft held chord: two slightly detuned triangles per note, warmed by
  // their own lowpass, swelling in and out over the bar.
  function pad(notes, time, dur, level) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(level, time + dur * 0.35);
    env.gain.setValueAtTime(level, time + dur * 0.75);
    env.gain.linearRampToValueAtTime(0.0001, time + dur * 1.15);
    lp.connect(env);
    env.connect(filter);

    notes.forEach((midi) => {
      [-6, 6].forEach((cents) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(midiToFreq(midi), time);
        osc.detune.setValueAtTime(cents, time);
        osc.connect(lp);
        osc.start(time);
        osc.stop(time + dur * 1.2);
      });
    });
  }

  function bass(midi, time, dur, level) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(midiToFreq(midi), time);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(level, time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env);
    env.connect(filter);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  // Move the melody up to two scale degrees from where it was, landing on
  // a chord tone (any octave) whenever one is in reach on a downbeat.
  function nextMelody(track, chord, bar, s) {
    const { scale } = track;
    const isChordTone = (m) => chord.notes.some((n) => (m - n) % 12 === 0);
    let idx = melodyNote === null ? Math.floor(scale.length / 2) : scale.indexOf(melodyNote);
    if (idx < 0) idx = Math.floor(scale.length / 2);
    const move = Math.floor(rand(bar, s + 50) * 5) - 2;
    let target = Math.max(0, Math.min(scale.length - 1, idx + move));
    if (s === 0) {
      const near = [target, target - 1, target + 1].filter((i) => i >= 0 && i < scale.length && isChordTone(scale[i]));
      if (near.length) target = near[0];
    }
    melodyNote = scale[target];
    return melodyNote;
  }

  function tick() {
    const track = TRACKS[trackId];
    const stepDur = 60 / track.tempo / 2;
    filter.frequency.setTargetAtTime(track.filterFreq, ctx.currentTime, 0.5);
    delayNode.delayTime.setTargetAtTime(stepDur * 1.5, ctx.currentTime, 0.1);

    while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
      const bar = Math.floor(step / STEPS_PER_BAR);
      const s = step % STEPS_PER_BAR;
      const chord = track.chords[bar % track.chords.length];
      const barDur = stepDur * STEPS_PER_BAR;
      const t = nextStepTime;

      if (s === 0) {
        pad(chord.notes, t, barDur, track.padLevel);
        bass(chord.bass, t, stepDur * 3.5, 0.22);
      }
      if (s === 5) bass(chord.bass, t, stepDur * 2.5, 0.12);

      const a = track.arp[s];
      if (a !== null && a !== undefined) {
        pluck(chord.notes[a % chord.notes.length] + 12, t, stepDur * 3, track.arpLevel);
      }

      if (track.melodySteps.includes(s) && (s === 0 || rand(bar, s) < track.melodyChance)) {
        pluck(nextMelody(track, chord, bar, s), t, stepDur * 5, track.melodyLevel);
      }

      nextStepTime += stepDur;
      step += 1;
    }
    timerId = window.setTimeout(tick, LOOKAHEAD * 1000);
  }

  return {
    play(id) {
      if (!ctx) build();
      window.clearTimeout(suspendId);
      if (ctx.state === 'suspended') ctx.resume();
      if (id) trackId = id;
      if (!timerId) {
        step = 0;
        melodyNote = null;
        nextStepTime = ctx.currentTime + 0.05;
        tick();
      }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(TRACKS[trackId].gain, ctx.currentTime, 0.8);
    },
    // Fades out, then stops scheduling notes and suspends the context, so
    // a paused player isn't still building oscillators (at zero volume)
    // and running the audio thread in the background.
    pause() {
      if (!ctx) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      window.clearTimeout(timerId);
      timerId = null;
      window.clearTimeout(suspendId);
      suspendId = window.setTimeout(() => ctx?.suspend(), 2000);
    },
    setTrack(id) {
      trackId = id;
      if (!ctx) return;
      // Quick dip-and-return so switching tracks doesn't pop straight from
      // one chord into an unrelated one mid-note; restart at bar 1 of the
      // new loop once the dip has hidden the cut.
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      master.gain.setTargetAtTime(TRACKS[id].gain, ctx.currentTime + 0.3, 0.4);
      step = 0;
      melodyNote = null;
    },
    destroy() {
      if (timerId) window.clearTimeout(timerId);
      window.clearTimeout(suspendId);
      if (ctx) ctx.close();
      ctx = null;
      timerId = null;
    },
  };
}
