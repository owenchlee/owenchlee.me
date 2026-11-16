import { useEffect, useRef } from 'react';

// Shared across every CardThumb in a panel so playback tracks by row, not by
// individual card — a single IntersectionObserver tracks each video's
// visible ratio, videos are bucketed into rows by their live DOM top offset
// (grid rows share the same rendered top, regardless of how many columns
// the responsive grid actually laid out), and every video in whichever row
// has the highest average ratio (above MIN_RATIO) plays together; every
// video in any other row is paused, even if it's still partly on screen.
// Scrolling further just hands playback to whichever row takes the lead.
const MIN_RATIO = 0.5;
const ROW_TOLERANCE_PX = 4;
const PLAY_DWELL_MS = 1500;

export function useRowVideoPlayback() {
  const ratiosRef = useRef(new Map());
  const activeRowRef = useRef([]);
  const observerRef = useRef(null);
  const dwellRef = useRef(0);

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      clearTimeout(dwellRef.current);
    },
    []
  );

  function getObserver() {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            ratiosRef.current.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
          });

          const rows = [];
          ratiosRef.current.forEach((ratio, el) => {
            const top = el.getBoundingClientRect().top;
            let row = rows.find((r) => Math.abs(r.top - top) <= ROW_TOLERANCE_PX);
            if (!row) {
              row = { top, els: [], ratioSum: 0 };
              rows.push(row);
            }
            row.els.push(el);
            row.ratioSum += ratio;
          });

          let bestRow = null;
          let bestAvg = MIN_RATIO;
          rows.forEach((row) => {
            const avg = row.ratioSum / row.els.length;
            if (avg > bestAvg) {
              bestAvg = avg;
              bestRow = row;
            }
          });

          const nextActive = bestRow ? bestRow.els : [];
          const nextSet = new Set(nextActive);
          activeRowRef.current.forEach((el) => {
            if (!nextSet.has(el)) el.pause();
          });
          // Start new clips only after the row has stayed in view for PLAY_DWELL_MS,
          // so scrolling past a row never downloads its clip.
          const started = nextActive.filter((el) => !activeRowRef.current.includes(el));
          activeRowRef.current = nextActive;
          if (started.length) {
            clearTimeout(dwellRef.current);
            dwellRef.current = setTimeout(() => {
              activeRowRef.current.forEach((el) => el.paused && el.play().catch(() => {}));
            }, PLAY_DWELL_MS);
          }
        },
        { threshold: [0, 0.25, 0.5, 0.6, 0.75, 0.9, 1] }
      );
    }
    return observerRef.current;
  }

  return function registerVideo(el) {
    if (!el) return undefined;
    const observer = getObserver();
    observer.observe(el);
    return () => {
      observer.unobserve(el);
      ratiosRef.current.delete(el);
      activeRowRef.current = activeRowRef.current.filter((v) => v !== el);
    };
  };
}
