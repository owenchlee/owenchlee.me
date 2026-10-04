import { useEffect, useRef, useState } from 'react';

// Types text out a character at a time, like a Pokémon dialogue box.
// `skip` jumps straight to the full line (first click on the box does this,
// the same way pressing A mid-line does in the games). `onTick`, if given,
// is called for every other letter that appears (spaces skipped): the text
// blip sound. The count lives in the effect, not a state updater, so the
// tick fires once per letter even under StrictMode.
export function useTypewriter(text, skip, onTick) {
  const [shown, setShown] = useState(skip ? text.length : 0);
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    if (skip) {
      setShown(text.length);
      return undefined;
    }
    let n = 0;
    setShown(0);
    const id = setInterval(() => {
      if (n >= text.length) {
        clearInterval(id);
        return;
      }
      if (n % 2 === 0 && text[n] !== ' ') tickRef.current?.();
      n += 1;
      setShown(n);
    }, 28);
    return () => clearInterval(id);
  }, [text, skip]);
  return text.slice(0, shown);
}
