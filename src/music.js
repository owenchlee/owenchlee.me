// Tiny procedural ambient music engine — no audio files. Every "track" is a
// slow chord loop synthesized at runtime from oscillators + a shared
// filter/delay, so there's nothing to source, license, or credit, and the
// bundle doesn't grow by megabytes of audio. The three moods echo the
// site's own day -> dusk -> night lighting cycle (see getLightingTint in
// tileMap.js) without being tied to scroll position — picking a track here
// is a separate, visitor-driven choice.
const TRACKS = {
  daybreak: {
    label: 'Daybreak',
    tempo: 100,
    wave: 'triangle',
    filterFreq: 2400,
    gain: 0.05,
    chords: [
      [261.63, 329.63, 392.0], // C major
      [293.66, 349.23, 440.0], // D minor-ish
      [220.0, 261.63, 329.63], // A minor
      [246.94, 329.63, 392.0], // G/B-ish
    ],
  },
  twilight: {
    label: 'Twilight',
    tempo: 76,
    wave: 'sine',
    filterFreq: 1300,
    gain: 0.045,
    chords: [
      [220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66],
    ],
  },
  nightwatch: {
    label: 'Night Watch',
    tempo: 56,
    wave: 'sine',
    filterFreq: 650,
    gain: 0.038,
    chords: [
      [130.81, 196.0, 246.94],
      [146.83, 220.0, 261.63],
      [110.0, 174.61, 220.0],
      [123.47, 196.0, 246.94],
    ],
  },
};

export const TRACK_LIST = Object.entries(TRACKS).map(([id, t]) => ({ id, label: t.label }));

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
  let feedbackGain = null;
  let timerId = null;
  let trackId = TRACK_LIST[0].id;
  let beatIndex = 0;
  let nextNoteTime = 0;

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;

    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.6;

    // A gentle feedback delay is what turns bare oscillator blips into
    // something that reads as "ambient" rather than a beeping test tone.
    delayNode = ctx.createDelay(1.0);
    delayNode.delayTime.value = 0.36;
    feedbackGain = ctx.createGain();
    feedbackGain.gain.value = 0.26;

    filter.connect(master);
    filter.connect(delayNode);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(master);
    master.connect(ctx.destination);
  }

  function scheduleNote(freq, time, dur, waveType) {
    const osc = ctx.createOscillator();
    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, time);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(1, time + dur * 0.3);
    env.gain.linearRampToValueAtTime(0, time + dur);

    osc.connect(env);
    env.connect(filter);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  function tick() {
    const track = TRACKS[trackId];
    const beatDur = 60 / track.tempo;
    filter.frequency.setTargetAtTime(track.filterFreq, ctx.currentTime, 0.5);

    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      const chord = track.chords[Math.floor(beatIndex / 2) % track.chords.length];
      const note = chord[beatIndex % chord.length];
      scheduleNote(note, nextNoteTime, beatDur * 1.8, track.wave);
      // Every other bar, add an octave-up shimmer on the root for texture.
      if (beatIndex % 8 === 0) {
        scheduleNote(chord[0] * 2, nextNoteTime, beatDur * 1.2, track.wave);
      }
      nextNoteTime += beatDur;
      beatIndex += 1;
    }
    timerId = window.setTimeout(tick, LOOKAHEAD * 1000);
  }

  return {
    play(id) {
      if (!ctx) build();
      if (ctx.state === 'suspended') ctx.resume();
      if (id) trackId = id;
      if (!timerId) {
        beatIndex = 0;
        nextNoteTime = ctx.currentTime + 0.05;
        tick();
      }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(TRACKS[trackId].gain, ctx.currentTime, 0.8);
    },
    pause() {
      if (!ctx) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    },
    setTrack(id) {
      trackId = id;
      if (!ctx) return;
      // Quick dip-and-return so switching tracks doesn't pop straight from
      // one chord into an unrelated one mid-note.
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      master.gain.setTargetAtTime(TRACKS[id].gain, ctx.currentTime + 0.3, 0.4);
    },
    destroy() {
      if (timerId) window.clearTimeout(timerId);
      if (ctx) ctx.close();
      ctx = null;
      timerId = null;
    },
  };
}
