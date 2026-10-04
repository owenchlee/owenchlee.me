import { HOUSES } from './tileMap';

// Fixed HUD in the opposite corner from the minimap, listing the same 4
// checkpoints as HOUSES so it can never drift out of sync with the actual
// world. `activeId` (App.jsx's activeHouse state) drives which entry glows —
// the same "inside this house" signal that lights up the in-world house
// label, just surfaced here too — and `introActive` lights Intro while the
// character is standing at the start of the path. Clicking walks the character straight to
// that house and in via onSelect (or back to the start for Intro), so a
// visitor doesn't have to tap their way along the whole route to reach a
// section they already know they want.
function SectionNav({ activeId, introActive, onSelect }) {
  return (
    <nav className="section-nav" aria-label="Go to section">
      <button
        type="button"
        className={`section-nav-item ${introActive ? 'active' : ''}`}
        style={{ '--section-color': '#e0714f' }}
        onClick={() => onSelect(null)}
      >
        Intro
      </button>
      {HOUSES.map((h) => (
        <button
          key={h.id}
          type="button"
          className={`section-nav-item ${activeId === h.id ? 'active' : ''}`}
          style={{ '--section-color': h.color }}
          onClick={() => onSelect(h.id)}
        >
          {h.label}
        </button>
      ))}
    </nav>
  );
}

export default SectionNav;
