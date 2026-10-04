import { useEffect } from 'react';
import { useFishing, fishingAction, stopFishing } from './fishing';
import { useSecrets } from './secrets';
import { FISH, RUSTY_KEY } from './content';
import { BadgeIcon } from './Badges';

// The fishing minigame's box, in the same spot and frame as the dialogue
// box. Tap it (or the pond, or press Enter/Space) to strike or recast;
// Escape, or any other key, puts the rod away.
function FishingBox() {
  const fishing = useFishing();
  const { fish } = useSecrets();

  useEffect(() => {
    if (!fishing) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        fishingAction();
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        stopFishing();
      } else if (e.key !== 'Tab' && e.key !== 'Shift') {
        stopFishing();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [fishing]);

  if (!fishing) return null;

  const { phase, catchId } = fishing;
  const caught = phase === 'caught' ? (catchId === 'key' ? RUSTY_KEY : FISH.find((f) => f.id === catchId)) : null;
  const isNew = caught && catchId !== 'key' && fish[catchId] === 1;
  const species = FISH.filter((f) => fish[f.id]).length;

  let line;
  let sub;
  if (phase === 'waiting') {
    line = 'You cast your line...';
    sub = 'Wait for the !, then tap.';
  } else if (phase === 'bite') {
    line = "Something's biting! TAP!";
  } else if (phase === 'early') {
    line = 'Too soon! The fish swam off.';
    sub = 'Tap to cast again.';
  } else if (phase === 'missed') {
    line = 'It got away...';
    sub = 'Tap to cast again.';
  } else if (catchId === 'key') {
    line = 'You fished up a RUSTY KEY!';
    sub = caught.fact;
  } else {
    line = `You caught ${/^[aeiou]/i.test(caught.name) ? 'an' : 'a'} ${caught.name.toUpperCase()}!`;
    sub = caught.fact;
  }

  return (
    <div
      className={`talk-box fish-box fish-box--${phase} ${caught?.shiny ? 'is-shiny' : ''}`}
      role="dialog"
      aria-label="Fishing"
      onClick={fishingAction}
    >
      <span className="talk-box-name">Fishing</span>
      <div className="fish-box-art" aria-hidden="true">
        {caught ? (
          <BadgeIcon badge={caught} size={54} />
        ) : (
          <span className={`fish-bobber ${phase === 'bite' ? 'is-biting' : ''}`}>
            {phase === 'bite' && <span className="fish-alert">!</span>}
          </span>
        )}
      </div>
      <div className="fish-box-text">
        <p className="talk-box-line" aria-live="assertive">
          {line}
          {isNew && <span className="fish-new"> NEW!</span>}
        </p>
        {sub && <p className="fish-box-sub">{sub}</p>}
        <p className="fish-box-log">
          Fish log {species}/{FISH.length}
          {phase === 'caught' ? ' · tap to cast again' : ''} · Esc to stop
        </p>
      </div>
    </div>
  );
}

export default FishingBox;
