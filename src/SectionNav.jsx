import { HOUSES, WAYPOINT_FRACTIONS } from './tileMap';

// Fixed HUD in the opposite corner from the minimap, listing the same 4
// checkpoints as HOUSES so it can never drift out of sync with the actual
// world. `activeId` (App.jsx's activeHouse state) drives which entry glows —
// the same "fully open" signal that already lights up the in-world house
// label, just surfaced here too. Clicking jumps the scroll position straight
// to that house's waypoint fraction via onJump, so a visitor doesn't have to
// walk the whole route to reach a section they already know they want.
function SectionNav({ activeId, onJump }) {
  return (
    <nav className="section-nav" aria-label="Jump to section">
      <button
        type="button"
        className={`section-nav-item ${activeId == null ? 'active' : ''}`}
        style={{ '--section-color': '#e0714f' }}
        onClick={() => onJump(0)}
      >
        Intro
      </button>
      {HOUSES.map((h) => (
        <button
          key={h.id}
          type="button"
          className={`section-nav-item ${activeId === h.id ? 'active' : ''}`}
          style={{ '--section-color': h.color }}
          onClick={() => onJump(WAYPOINT_FRACTIONS[h.waypointIndex])}
        >
          {h.label}
        </button>
      ))}
    </nav>
  );
}

export default SectionNav;
