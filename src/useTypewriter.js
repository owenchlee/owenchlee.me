import { useEffect, useState } from 'react';

// Types text out a character at a time, like a Pokémon dialogue box.
// `skip` jumps straight to the full line (first click on the box does this,
// the same way pressing A mid-line does in the games).
export function useTypewriter(text, skip) {
  const [shown, setShown] = useState(skip ? text.length : 0);
  useEffect(() => {
    if (skip) {
      setShown(text.length);
      return undefined;
    }
    setShown(0);
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 28);
    return () => clearInterval(id);
  }, [text, skip]);
  return text.slice(0, shown);
}
