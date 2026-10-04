import { useEffect, useRef, useState } from 'react';
import { NOW_LOG, NOW_LOG_URL, NOW_PINNED } from './content';

// The NOW board's log: a cork board of diary notes, one per month. This
// month's note is pinned big at the top, then every earlier month grouped
// by year, so a visitor can scroll back through what Owen's been building.
// The bundled copy shows instantly; the live copy on GitHub (which the
// monthly routine pushes to) is fetched on open and wins if it has more,
// so a new month appears without the site being redeployed.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

const isValidLog = (data) =>
  Array.isArray(data?.entries) && data.entries.every((e) => /^\d{4}-\d{2}$/.test(e?.month) && typeof e?.text === 'string');

function NowLog({ onClose }) {
  const [entries, setEntries] = useState(NOW_LOG);
  const closeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(NOW_LOG_URL, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !isValidLog(data)) return;
        const live = [...data.entries].sort((a, b) => b.month.localeCompare(a.month));
        if (live.length >= NOW_LOG.length) setEntries(live);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Same capture-phase key handling as the Trainer Card and Workshop, so
  // Escape closes this and nothing behind it.
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Tab') return;
      e.stopPropagation();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      opener?.focus?.();
    };
  }, [onClose]);

  const [latest, ...older] = entries;
  const years = [];
  older.forEach((e) => {
    const y = e.month.slice(0, 4);
    if (years.at(-1)?.year !== y) years.push({ year: y, entries: [] });
    years.at(-1).entries.push(e);
  });

  return (
    <div className="nowlog-backdrop" onClick={onClose}>
      <div
        className="nowlog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nowlog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nowlog-head">
          <h2 id="nowlog-title">Now</h2>
          <button ref={closeRef} type="button" className="trainer-card-close" onClick={onClose}>
            Close ✕
          </button>
        </div>

        <div className="nowlog-scroll">
          {latest && (
            <article className="nowlog-note nowlog-note--latest">
              <span className="nowlog-pin" aria-hidden="true" />
              <h3>{monthLabel(latest.month)}</h3>
              <p>{latest.text}</p>
            </article>
          )}
          {NOW_PINNED && <p className="nowlog-pinned">{NOW_PINNED}</p>}

          {years.map((g) => (
            <section key={g.year} className="nowlog-year" aria-label={g.year}>
              <h3 className="nowlog-year-label">{g.year}</h3>
              <div className="nowlog-notes">
                {g.entries.map((e, i) => (
                  <article key={e.month} className="nowlog-note" style={{ '--tilt': `${[-1.2, 0.8, 1.4, -0.6][i % 4]}deg` }}>
                    <span className="nowlog-pin" aria-hidden="true" />
                    <h4>{monthLabel(e.month)}</h4>
                    <p>{e.text}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NowLog;
