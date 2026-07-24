import { forwardRef } from 'react';

// Top-right HUD, fixed like the minimap/section nav — a sun/moon crossfade
// driven by --night (0-1, written every scroll tick in App.jsx from
// getNightAmount()), so it stays in lockstep with the same dawn/day/dusk/
// night wash that tints .lighting-overlay rather than running its own timer.
const SkyClock = forwardRef(function SkyClock(_props, ref) {
  return (
    <div className="sky-clock" ref={ref} aria-hidden="true">
      <div className="sky-clock-sun" />
      <div className="sky-clock-moon">
        <span className="sky-clock-crater sky-clock-crater--a" />
        <span className="sky-clock-crater sky-clock-crater--b" />
      </div>
    </div>
  );
});

export default SkyClock;
