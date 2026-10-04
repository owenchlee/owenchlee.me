// Cycled across `**tag**` matches in a Highlighted string so a multi-tag
// sentence reads as distinct callouts rather than one repeated color —
// pulled from the same house-color family already used in HOUSES/SectionNav,
// with the blue and red lifted a little so dark text on them stays readable
// (4.5:1 contrast).
const TAG_COLORS = ['#7393ad', '#4da338', '#da6359', '#d4b23c'];

// Renders `**word**` segments of `text` as .hud-tag pill chips, everything
// else as plain text — the inline "bold callout" look from the reference
// design, without needing a markdown dependency for one tiny pattern. Its
// own module (not exported from App.jsx) so QuickView.jsx can reuse it
// without a circular App.jsx <-> QuickView.jsx import.
export function Highlighted({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  let tagIndex = 0;
  return parts.map((part, i) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    if (!match) return part;
    const color = TAG_COLORS[tagIndex % TAG_COLORS.length];
    tagIndex += 1;
    return (
      <span key={i} className="hud-tag" style={{ '--tag-color': color }}>
        {match[1]}
      </span>
    );
  });
}
