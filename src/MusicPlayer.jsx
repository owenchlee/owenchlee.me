import { useEffect, useRef, useState } from 'react';
import { createMusicEngine, TRACK_LIST } from './music';
import guideSprite from './assets/npc-c.png';
import { useDialogue } from './dialogue';
import { useFishing } from './fishing';

// Bottom-left HUD — the one corner section-nav (top-left)/quick-view-toggle
// (top-right)/minimap (bottom-right) leave free. Music never autostarts:
// Web Audio requires a user gesture before it'll make sound, and starting
// on load is bad manners besides, so the engine is only ever built lazily
// on the visitor's own first Play click. (Sound effects are separate and
// always on; this disc is only the background music.)
//
// A townsperson stands beside the player with a speech bubble pointing at
// the disc until the visitor has played music once (remembered across
// visits); tapping them toggles the music too, and they bob along while
// it plays. They're a town character, so they step away while the visitor
// is inside a room, talking to someone or fishing (anything that puts UI
// near the bottom of the screen), and the bubble itself only shows for the
// first BUBBLE_MS of a visit and never catches clicks.
const HINT_KEY = 'music-hint-done';
const BUBBLE_MS = 15000;

function readHintDone() {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

function MusicPlayer({ inRoom = false }) {
  const engineRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [trackId, setTrackId] = useState(TRACK_LIST[0].id);
  const [expanded, setExpanded] = useState(false);
  const [hintDone, setHintDone] = useState(readHintDone);
  const [bubbleTimedOut, setBubbleTimedOut] = useState(false);
  const talking = useDialogue() !== null;
  const fishing = useFishing() !== null;
  const guideAway = inRoom || talking || fishing;

  useEffect(() => () => engineRef.current?.destroy(), []);

  useEffect(() => {
    const t = setTimeout(() => setBubbleTimedOut(true), BUBBLE_MS);
    return () => clearTimeout(t);
  }, []);

  function ensureEngine() {
    if (!engineRef.current) engineRef.current = createMusicEngine();
    return engineRef.current;
  }

  function togglePlay() {
    const engine = ensureEngine();
    if (playing) {
      engine.pause();
      setPlaying(false);
    } else {
      engine.play(trackId);
      setPlaying(true);
      if (!hintDone) {
        setHintDone(true);
        try {
          localStorage.setItem(HINT_KEY, '1');
        } catch {
          // Non-fatal: the hint just shows again next visit.
        }
      }
    }
  }

  function chooseTrack(id) {
    setTrackId(id);
    if (playing) ensureEngine().setTrack(id);
  }

  return (
    <div className="music-player">
      <div className="music-row">
        <button
          type="button"
          className={`music-toggle ${playing ? 'playing' : ''}`}
          onClick={togglePlay}
          aria-label={playing ? 'Pause music' : 'Play music'}
        >
          <span className="music-disc" />
          <span className="music-play-icon" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`music-expand ${expanded ? 'active' : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={`${TRACK_LIST.find((t) => t.id === trackId)?.label}, choose track`}
        >
          {TRACK_LIST.find((t) => t.id === trackId)?.label}
        </button>
      </div>
      {expanded && (
        <div className="music-tracklist">
          {TRACK_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`music-track ${trackId === t.id ? 'active' : ''}`}
              onClick={() => chooseTrack(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className={`music-guide ${playing ? 'is-dancing' : ''} ${guideAway ? 'is-away' : ''}`}
        onClick={togglePlay}
        aria-label={playing ? 'Pause music' : 'Play music'}
        tabIndex={-1}
      >
        {!hintDone && !bubbleTimedOut && (
          <span className="music-guide-bubble">
            Psst! Tap the disc for some music <span aria-hidden="true">♪</span>
          </span>
        )}
        <img src={guideSprite} className="music-guide-sprite" alt="" />
      </button>
    </div>
  );
}

export default MusicPlayer;
