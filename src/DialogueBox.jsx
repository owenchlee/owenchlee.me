import { useEffect, useMemo, useState } from 'react';
import { useDialogue, advanceDialogue, closeDialogue } from './dialogue';
import { useTypewriter } from './useTypewriter';

// The box townsfolk and signs talk through: pinned to the bottom of the
// screen like the badge announcement, with the speaker's name on a tab.
// A tap (or Enter/Space) mid-line finishes typing it, the next one moves
// on, and the last line closes the box. Escape closes it straight away;
// any other key closes it and carries on, so the arrow keys still walk.
function DialogueBox() {
  const dialogue = useDialogue();
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [skipTyping, setSkipTyping] = useState(false);
  const line = dialogue ? dialogue.lines[dialogue.index] : '';
  const typed = useTypewriter(line, skipTyping || reducedMotion);
  const doneTyping = typed.length === line.length;
  const key = dialogue ? `${dialogue.id}-${dialogue.index}` : null;

  useEffect(() => {
    setSkipTyping(false);
  }, [key]);

  function advance() {
    if (!doneTyping) setSkipTyping(true);
    else advanceDialogue();
  }

  useEffect(() => {
    if (!dialogue) return undefined;
    // Capture phase so App.jsx's world keys (Enter steps into a house,
    // Escape leaves one) don't also fire while someone's talking.
    const onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        advance();
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        closeDialogue();
      } else if (e.key !== 'Tab' && e.key !== 'Shift') {
        closeDialogue();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  });

  if (!dialogue) return null;

  const isLast = dialogue.index === dialogue.lines.length - 1;
  return (
    <div key={dialogue.id} className="talk-box" role="dialog" aria-label={dialogue.name} onClick={advance}>
      <span className="talk-box-name">{dialogue.name}</span>
      <p className="talk-box-line" aria-live="polite">
        {typed}
        <span className="sr-only">{line.slice(typed.length)}</span>
      </p>
      {doneTyping && (
        <button
          type="button"
          className="talk-box-next"
          aria-label={isLast ? 'Close' : 'Next'}
          onClick={(e) => {
            e.stopPropagation();
            advanceDialogue();
          }}
        >
          {isLast ? '■' : '▼'}
        </button>
      )}
    </div>
  );
}

export default DialogueBox;
