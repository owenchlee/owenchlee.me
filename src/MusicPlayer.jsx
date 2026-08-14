import { useEffect, useRef, useState } from 'react';
import { createMusicEngine, TRACK_LIST } from './music';

// Bottom-left HUD — the one corner section-nav (top-left)/quick-view-toggle
// (top-right)/minimap (bottom-right) leave free. Music never autostarts:
// Web Audio requires a user gesture before it'll make sound, and starting
// on load is bad manners besides, so the engine is only ever built lazily
// on the visitor's own first Play click.
function MusicPlayer() {
  const engineRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [trackId, setTrackId] = useState(TRACK_LIST[0].id);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => () => engineRef.current?.destroy(), []);

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
          aria-label="Choose track"
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
    </div>
  );
}

export default MusicPlayer;
