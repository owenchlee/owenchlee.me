import { useEffect, useMemo, useRef, useState } from 'react';
import { BADGES, useAchievements, dismissAnnouncement } from './achievements';
import { HOBBIES } from './content';

// Mixes a hex color toward white (amt > 0) or black (amt < 0) — enough to
// derive each badge's highlight/shadow pixels from its one base color.
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const target = amt > 0 ? 255 : 0;
  const a = Math.abs(amt);
  const ch = (v) => Math.round(v + (target - v) * a);
  const r = ch(n >> 16);
  const g = ch((n >> 8) & 0xff);
  const b = ch(n & 0xff);
  return `rgb(${r},${g},${b})`;
}

// Draws a badge's 9x9 `pixels` map (see achievements.js) as crisp SVG
// rects. Unearned badges render as a flat dark silhouette — the empty slot
// in a badge case, shape visible but not the badge itself.
export function BadgeIcon({ badge, earned = true, size = 36 }) {
  const rects = useMemo(() => {
    const fills = earned
      ? { o: '#1c1712', h: shade(badge.color, 0.45), b: badge.color, s: shade(badge.color, -0.35) }
      : { o: '#1c1712', h: '#3a2f24', b: '#3a2f24', s: '#3a2f24' };
    const out = [];
    badge.pixels.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (fills[ch]) out.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fills[ch]} />);
      });
    });
    return out;
  }, [badge, earned]);

  return (
    <svg
      className="badge-icon"
      viewBox="0 0 9 9"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}

const PARTICLE_COLORS = BADGES.map((b) => b.color).concat('#f8f0dc', '#ffe066');

// Fixed-seed-free but render-stable: generated once per burst mount.
function makeParticles(count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 140 + Math.random() * 220;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 60,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: Math.random() < 0.3 ? 12 : 8,
      delay: Math.random() * 0.15,
    };
  });
}

function ParticleBurst() {
  const [particles] = useState(() => makeParticles(48));
  return (
    <div className="badge-burst" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="badge-burst-particle"
          style={{
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--size': `${p.size}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Types text out a character at a time, like a Pokémon dialogue box.
// `skip` jumps straight to the full line (first click on the box does this,
// the same way pressing A mid-line does in the games).
function useTypewriter(text, skip) {
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

const AUTO_DISMISS_MS = 4200;

// The "You received the X BADGE!" moment: a dialogue box pinned to the
// bottom of the screen (where the games put it), with the badge itself
// glinting in a frame on the left. Plays through BadgeToast's queue one at a
// time; each one auto-advances, or click / Enter / Space to advance sooner.
export function BadgeToast() {
  const { queue } = useAchievements();
  const current = queue[0];
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [skipTyping, setSkipTyping] = useState(false);

  const badge = current?.type === 'badge' ? BADGES.find((b) => b.id === current.id) : null;
  const isChampion = current?.type === 'champion';
  const line = badge
    ? `You received the ${badge.name.toUpperCase()}!`
    : isChampion
      ? 'All 8 badges! You are the new CHAMPION!'
      : '';
  const subline = badge
    ? badge.hint
    : isChampion
      ? 'A secret note just appeared at the Contact house…'
      : '';
  const typed = useTypewriter(line, skipTyping || reducedMotion);
  const doneTyping = typed.length === line.length;

  // Reset the skip for each new announcement.
  const key = current?.uid ?? null;
  useEffect(() => {
    setSkipTyping(false);
  }, [key]);

  useEffect(() => {
    if (!current || !doneTyping) return undefined;
    const id = setTimeout(dismissAnnouncement, isChampion ? AUTO_DISMISS_MS * 1.6 : AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [current, doneTyping, isChampion]);

  if (!current) return null;

  function advance() {
    if (!doneTyping) setSkipTyping(true);
    else dismissAnnouncement();
  }

  return (
    <>
      {isChampion && !reducedMotion && <ParticleBurst />}
      <div
        key={key}
        className={`badge-toast ${isChampion ? 'badge-toast--champion' : ''}`}
        role="status"
        aria-live="polite"
        onClick={advance}
      >
        <div className="badge-toast-frame">
          {badge ? (
            <BadgeIcon badge={badge} size={54} />
          ) : (
            <div className="badge-toast-champion-grid">
              {BADGES.map((b) => (
                <BadgeIcon key={b.id} badge={b} size={20} />
              ))}
            </div>
          )}
          <span className="badge-toast-glint" aria-hidden="true" />
        </div>
        <div className="badge-toast-text">
          <p className="badge-toast-line">
            {typed}
            <span className="sr-only">{line.slice(typed.length)}</span>
          </p>
          <p className={`badge-toast-sub ${doneTyping ? 'is-shown' : ''}`}>{subline}</p>
        </div>
        {doneTyping && (
          <button
            type="button"
            className="badge-toast-next"
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation();
              dismissAnnouncement();
            }}
          >
            ▼
          </button>
        )}
      </div>
    </>
  );
}

// Top-right HUD button (under Quick View) showing the badge count, which
// opens the Trainer Card — the badge case where empty slots show as
// silhouettes with a hint, so a visitor can see what's left to find.
export function BadgeCase() {
  const { earned, hobbiesSeen, championAt } = useAchievements();
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const openerRef = useRef(null);
  const count = BADGES.filter((b) => earned[b.id]).length;

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const opener = openerRef.current;
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        className={`badge-case-toggle ${championAt ? 'is-champion' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <BadgeIcon badge={BADGES[0]} earned={count > 0} size={18} />
        Badges {count}/{BADGES.length}
      </button>

      {open && (
        <div className="trainer-card-backdrop" onClick={() => setOpen(false)}>
          <div
            className="trainer-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trainer-card-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="trainer-card-header">
              <h2 id="trainer-card-title">Trainer Card</h2>
              <button ref={closeRef} type="button" className="trainer-card-close" onClick={() => setOpen(false)}>
                Close ✕
              </button>
            </div>
            <p className="trainer-card-status">
              {championAt
                ? `★ Champion since ${new Date(championAt).toLocaleDateString()}. The secret note is waiting at the Contact house.`
                : `${count} of ${BADGES.length} badges. Collect all ${BADGES.length} to become Champion.`}
            </p>
            <ul className="trainer-card-grid">
              {BADGES.map((b) => {
                const has = Boolean(earned[b.id]);
                const progress =
                  b.id === 'curator' && !has ? ` (${hobbiesSeen.length}/${HOBBIES.length})` : '';
                return (
                  <li key={b.id} className={`trainer-card-slot ${has ? 'is-earned' : ''}`}>
                    <BadgeIcon badge={b} earned={has} size={44} />
                    <span className="trainer-card-name">{has ? b.name : '???'}</span>
                    <span className="trainer-card-hint">
                      {b.hint}
                      {progress}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
