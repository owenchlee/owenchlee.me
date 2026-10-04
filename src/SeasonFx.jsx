import { useMemo } from 'react';
import { SEASON } from './season';

// A few things drifting down over the town for the season: leaves in
// autumn, snow in winter, petals in spring (nothing in summer). A dozen or
// so small squares on transform-only animations, so they run on the
// compositor. Left out entirely for reduced motion.
const COUNT = { autumn: 12, winter: 22, spring: 12 };
const COLORS = {
  autumn: ['#d9772b', '#c9463e', '#e8b93c', '#b5562a'],
  winter: ['#ffffff', '#eef4f8'],
  spring: ['#f6b3cf', '#ef8fb5', '#fbe1ec'],
};

function SeasonFx() {
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const flakes = useMemo(() => {
    const n = COUNT[SEASON] ?? 0;
    return Array.from({ length: n }, (_, i) => ({
      left: `${((i + Math.random() * 0.8) / n) * 100}%`,
      size: SEASON === 'winter' ? 3 + Math.round(Math.random() * 3) : 6,
      duration: (SEASON === 'winter' ? 9 : 12) + Math.random() * 8,
      delay: -Math.random() * 20,
      sway: 0.5 + Math.random(),
      color: COLORS[SEASON][i % COLORS[SEASON].length],
    }));
  }, []);

  if (reducedMotion || flakes.length === 0) return null;
  return (
    <div className={`season-fx season-fx--${SEASON}`} aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="season-flake"
          style={{
            left: f.left,
            '--size': `${f.size}px`,
            '--sway': f.sway,
            background: f.color,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default SeasonFx;
