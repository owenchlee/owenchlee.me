import { forwardRef, useEffect, useRef, useState } from 'react';
import { PROJECTS, HOBBIES, CONTACT, EDUCATION, EXPERIENCE, SKILLS, RESUME_URL, SECRET_NOTE } from './content';
import { markHobbySeen, useAchievements } from './achievements';
import petDogA from './assets/pet-dog-a.png';
import owenPortrait from './assets/owen-portrait.jpg';

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

export function useRowVideoPlayback() {
  const ratiosRef = useRef(new Map());
  const activeRowRef = useRef([]);
  const observerRef = useRef(null);

  useEffect(() => () => observerRef.current?.disconnect(), []);

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
          nextActive.forEach((el) => {
            if (!activeRowRef.current.includes(el)) el.play().catch(() => {});
          });
          activeRowRef.current = nextActive;
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

// Shared by ProjectsPanel and QuickView — falls back to a colored box with
// the project's name when neither `video` nor `image` is set yet (see
// content.js), so a section can be filled in one entry at a time without
// any card looking broken.
export function CardThumb({ video, image, color, alt, registerVideo }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!video) return undefined;
    return registerVideo(videoRef.current);
  }, [video, registerVideo]);

  if (video) {
    // preload="none" + a still poster: nothing downloads or holds a decoder
    // until the row is actually on screen and play() is called. With
    // "metadata", all seven clips buffered on page load even though they sit
    // in a closed room. Posters are a frame from each clip, generated next
    // to it as <name>-poster.webp.
    return (
      <div className="project-thumb project-thumb--image">
        <video
          ref={videoRef}
          src={video}
          poster={video.replace(/\.mp4$/, '-poster.webp')}
          className="project-thumb-img"
          controls
          muted
          loop
          playsInline
          preload="none"
        />
      </div>
    );
  }
  if (image) {
    return (
      <div className="project-thumb project-thumb--image">
        <img src={image} alt={alt} className="project-thumb-img" />
      </div>
    );
  }
  return (
    <div className="project-thumb" style={{ background: color }}>
      <span>{alt}</span>
    </div>
  );
}

// The tech tags shared by two or more projects, most used first: the
// filter row at the top of the Projects room. Tags only one project uses
// still filter when tapped on its card.
const FILTER_TAGS = (() => {
  const counts = new Map();
  PROJECTS.forEach((p) => p.tech?.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return [...counts]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
})();

// Cartridge shell colors for the arcade's tech filter, cycled in order.
const CARTRIDGE_COLORS = ['#8ec7ff', '#ffe066', '#ff9a7a', '#c8a4ff', '#7ee0c0', '#f4b860', '#e8877a', '#a8d672'];

// Projects is the town arcade (laid out like the Hobbies room): every
// project is a cabinet standing against the back wall with its demo
// looping on the screen (same row-based playback as before). The tech
// filter is a counter of game cartridges on the floor in front; pick one
// and the cabinets that don't use it power down. Tapping a cabinet opens
// it up: the clip with controls, the write-up, links and tech.
function CabinetScreen({ project, registerVideo }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!project.video) return undefined;
    return registerVideo(videoRef.current);
  }, [project.video, registerVideo]);

  if (project.video) {
    return (
      <video
        ref={videoRef}
        src={project.video}
        poster={project.video.replace(/\.mp4$/, '-poster.webp')}
        className="cabinet-screen-media"
        muted
        loop
        playsInline
        preload="none"
      />
    );
  }
  if (project.image) return <img src={project.image} alt="" className="cabinet-screen-media cabinet-screen-media--image" />;
  return <span className="cabinet-screen-fallback">{project.name}</span>;
}

export const ProjectsPanel = forwardRef(function ProjectsPanel({ active }, ref) {
  const registerVideo = useRowVideoPlayback();
  const openRegisterVideo = useRowVideoPlayback();
  // Pick a cartridge on the counter (or a tech chip on an open cabinet) to
  // light up only the cabinets that use it; the rest power down. Pick it
  // again, or "All", to clear.
  const [tag, setTag] = useState(null);
  const [openName, setOpenName] = useState(null);
  const matches = (p) => !tag || p.tech?.includes(tag);
  const matchCount = PROJECTS.filter(matches).length;
  const toggleTag = (t) => setTag((cur) => (cur === t ? null : t));
  const filterTags = tag && !FILTER_TAGS.includes(tag) ? [...FILTER_TAGS, tag] : FILTER_TAGS;
  const open = PROJECTS.find((p) => p.name === openName);
  const highScore = PROJECTS.find((p) => p.live);

  // Escape closes an open cabinet first (capture phase, so it doesn't also
  // walk the visitor out of the room).
  useEffect(() => {
    if (!openName) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpenName(null);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [openName]);

  return (
    <div ref={ref} className={`section-panel section-panel--projects ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-content arcade-content">
          <div className="arcade">
            <div className="arcade-wall" aria-hidden="true" />
            <div className="arcade-floor" aria-hidden="true" />
            <div className="arcade-lights" aria-hidden="true" />

            {/* Neon sign: each letter its own tube so one can buzz on its
                own while the whole sign flickers off and on now and then. */}
            <h2 className="arcade-sign" aria-label="Projects">
              <span className="arcade-sign-tubes" aria-hidden="true">
                {[...'PROJECTS'].map((c, i) => (
                  <span key={i} className={i === 4 ? 'arcade-sign-buzz' : undefined}>
                    {c}
                  </span>
                ))}
              </span>
            </h2>

            {/* Back-wall decor either side of the sign: tribute posters
                for the games Owen grew up on (drawn here as homage
                pixel art, not the official logos or sprites) and two
                small neon signs. */}
            <div className="arcade-decor arcade-decor--l" aria-hidden="true">
              <span className="arcade-poster arcade-poster--smash">
                <span className="arcade-poster-art arcade-poster-art--burst" />
                <span className="arcade-poster-title">Super Smash Bros</span>
              </span>
              <span className="arcade-poster arcade-poster--fighter">
                <span className="arcade-poster-art arcade-poster-art--fireball" />
                <span className="arcade-poster-title">Street Fighter II</span>
              </span>
              <span className="arcade-neon-small arcade-neon-small--cyan">Game On</span>
            </div>
            <div className="arcade-decor arcade-decor--r" aria-hidden="true">
              <span className="arcade-neon-small arcade-neon-small--yellow">Insert Coin</span>
              <span className="arcade-poster arcade-poster--mario">
                <span className="arcade-poster-art arcade-poster-art--mushroom" />
                <span className="arcade-poster-title">Super Mario</span>
              </span>
              <span className="arcade-poster arcade-poster--kart">
                <span className="arcade-poster-art arcade-poster-art--kart" />
                <span className="arcade-poster-title">Mario Kart</span>
              </span>
            </div>

            <div className="arcade-back">
              <div className="arcade-row">
                {PROJECTS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className={`cabinet ${matches(p) ? '' : 'is-off'}`}
                    style={{ '--cab': p.color }}
                    onClick={() => setOpenName(p.name)}
                    aria-label={`${p.name}: open cabinet`}
                  >
                    <span className="cabinet-marquee">{p.name}</span>
                    <span className="cabinet-screen">
                      <CabinetScreen project={p} registerVideo={registerVideo} />
                    </span>
                    <span className="cabinet-deck" aria-hidden="true">
                      <span className="cabinet-stick" />
                      <span className="cabinet-btn cabinet-btn--a" />
                      <span className="cabinet-btn cabinet-btn--b" />
                    </span>
                    <span className="cabinet-slot" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="arcade-front">
              <div className="arcade-counter">
                <div className="arcade-cartridges" role="group" aria-label="Filter projects by technology">
                  <span className="arcade-counter-label">Pick a cartridge:</span>
                  <button
                    type="button"
                    className={`arcade-cartridge ${tag ? '' : 'is-active'}`}
                    aria-pressed={!tag}
                    onClick={() => setTag(null)}
                  >
                    All
                  </button>
                  {filterTags.map((t, i) => (
                    <button
                      key={t}
                      type="button"
                      className={`arcade-cartridge ${tag === t ? 'is-active' : ''}`}
                      style={{ '--cart': CARTRIDGE_COLORS[i % CARTRIDGE_COLORS.length] }}
                      aria-pressed={tag === t}
                      onClick={() => toggleTag(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="arcade-counter-status" aria-live="polite">
                  {tag
                    ? `${matchCount} ${matchCount === 1 ? 'cabinet runs' : 'cabinets run'} ${tag}`
                    : `${PROJECTS.length} cabinets. Tap one to play.`}
                </p>
              </div>
              {highScore && (
                <p className="arcade-highscore">
                  <span>High score</span>
                  {highScore.name}: shipped, live at {highScore.live.replace(/^https?:\/\//, '')}
                </p>
              )}
            </div>
          </div>

          {open && (
            <div className="arcade-open" role="dialog" aria-label={open.name} onClick={() => setOpenName(null)}>
              <div className="arcade-open-card" style={{ '--cab': open.color }} onClick={(e) => e.stopPropagation()}>
                <button type="button" className="hobby-detail-close" onClick={() => setOpenName(null)} aria-label="Close">
                  ✕
                </button>
                <CardThumb
                  video={open.video}
                  image={open.image}
                  color={open.color}
                  alt={open.name}
                  registerVideo={openRegisterVideo}
                />
                <div className="project-meta">
                  <h3>{open.name}</h3>
                  <span className="project-date">{open.date}</span>
                </div>
                {(open.link || open.live) && (
                  <div className="project-links">
                    {open.link && (
                      <a href={open.link} target="_blank" rel="noreferrer" className="project-live-link">
                        <GitHubIcon /> GitHub
                      </a>
                    )}
                    {open.live && (
                      <a href={open.live} target="_blank" rel="noreferrer" className="project-live-link">
                        Visit Live Site →
                      </a>
                    )}
                  </div>
                )}
                <p>{open.desc}</p>
                {open.tech?.length > 0 && (
                  <ul className="project-tech">
                    {open.tech.map((t) => (
                      <li key={t}>
                        <button
                          type="button"
                          className={`tech-chip tech-chip--button ${tag === t ? 'is-active' : ''}`}
                          aria-pressed={tag === t}
                          onClick={() => {
                            toggleTag(t);
                            setOpenName(null);
                          }}
                        >
                          {t}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Experience is an adventurers'-guild hall: each role is a quest notice
// pinned to the quest board, stamped ONGOING or COMPLETE from its dates,
// with its headline result as the reward. Tapping one unrolls the full
// notice (org, dates, bullets) over the board. Education hangs beside it as
// training scrolls, skills are the inventory, and the counter on the floor
// holds the guild membership card and the full résumé ledger. Sourced from
// the same content.js data QuickView renders (EDUCATION/EXPERIENCE/SKILLS),
// so the room and the plain view never drift apart.
const isOngoing = (dates) => /present/i.test(dates);

export const ExperiencePanel = forwardRef(function ExperiencePanel({ active }, ref) {
  const [openQuest, setOpenQuest] = useState(null);
  const quest = openQuest != null ? EXPERIENCE[openQuest] : null;

  return (
    <div ref={ref} className={`section-panel section-panel--experience ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-content guild-content">
          <div className="guild">
            <div className="guild-wall">
              <div className="guild-sign-row">
                <span className="guild-torch" aria-hidden="true" />
                <h2 className="guild-sign">Experience</h2>
                <span className="guild-torch" aria-hidden="true" />
              </div>

              <div className="guild-boards">
                <section className="guild-board guild-board--training" aria-labelledby="guild-training">
                  <h3 id="guild-training" className="guild-board-title">Training</h3>
                  {EDUCATION.map((e) => (
                    <div key={e.program} className="guild-scroll">
                      <strong>{e.program}</strong>
                      <span>{e.school}</span>
                      <span className="guild-scroll-dates">{e.dates}</span>
                      {e.notes?.length > 0 && (
                        <ul>
                          {e.notes.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </section>

                <section className="guild-board guild-board--quests" aria-labelledby="guild-quests">
                  <h3 id="guild-quests" className="guild-board-title">Quest Board</h3>
                  <div className="guild-quests">
                    {EXPERIENCE.map((e, i) => {
                      const ongoing = isOngoing(e.dates);
                      return (
                        <button
                          key={`${e.role}-${e.org}`}
                          type="button"
                          className="guild-quest"
                          style={{ '--tilt': `${[-1.5, 1, 1.5, -1][i % 4]}deg` }}
                          onClick={() => setOpenQuest(i)}
                        >
                          <span className="guild-quest-role">{e.role}</span>
                          <span className="guild-quest-org">{e.org}</span>
                          <span className="guild-quest-reward">Reward: {e.reward ?? '???'}</span>
                          <span className={`guild-stamp ${ongoing ? 'guild-stamp--ongoing' : ''}`}>
                            {ongoing ? 'Ongoing' : 'Complete'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {quest && (
                    <div className="guild-quest-open" role="dialog" aria-label={`${quest.role}, ${quest.org}`}>
                      <button type="button" className="hobby-detail-close" onClick={() => setOpenQuest(null)} aria-label="Close">
                        ✕
                      </button>
                      <span className="guild-quest-role">{quest.role}</span>
                      <span className="guild-quest-org">
                        {quest.org}
                        {quest.location ? ` · ${quest.location}` : ''}
                      </span>
                      <span className="guild-scroll-dates">{quest.dates}</span>
                      <ul>
                        {quest.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                      <span className={`guild-stamp ${isOngoing(quest.dates) ? 'guild-stamp--ongoing' : ''}`}>
                        {isOngoing(quest.dates) ? 'Ongoing' : 'Complete'}
                      </span>
                    </div>
                  )}
                </section>

                <section className="guild-board guild-board--inventory" aria-labelledby="guild-inventory">
                  <h3 id="guild-inventory" className="guild-board-title">Inventory</h3>
                  {SKILLS.map((s) => (
                    <div key={s.category} className="guild-inventory-group">
                      <span className="guild-inventory-label">{s.category}</span>
                      <ul className="project-tech">
                        {s.items.map((it) => (
                          <li key={it} className="tech-chip">
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              </div>
            </div>

            <div className="guild-floor">
              <div className="guild-counter">
                <div className="guild-card">
                  <span className="guild-card-title">Guild Member</span>
                  <span>Owen Lee</span>
                  <span>Member since 2022 · SYDE &apos;31</span>
                </div>
                <a href={RESUME_URL} target="_blank" rel="noreferrer" className="guild-ledger">
                  Guild Ledger: full résumé (PDF) ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Hobbies is a 3/4 top-down interior in the Pokémon/Stardew mold: a back
// wall (crown trim, wallpaper, wainscot, baseboard) over a plank floor,
// with the bookcase standing against the wall so its base sits on the floor
// line instead of floating mid-room. Everything else — window, hung art,
// rug, lamp, armchair, plant, dog — is grouped against the wall or on the
// floor band and casts a hard drop shadow, which is what grounds furniture
// in that style. The bookcase is one CSS grid of equal-width cubbies
// (every cubby as wide as the widest item), and the last row is padded out
// with book-stack filler cubbies so the case never ends in a gap.
const HOBBY_COLS = 3;

// The window shows the visitor's actual time of day (their local clock,
// not the world's scroll-driven lighting): dawn, day, dusk or night, each
// with its own sky and something that drifts past now and then.
function getSkyPhase(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

function useSkyPhase() {
  const [phase, setPhase] = useState(() => getSkyPhase(new Date().getHours()));
  useEffect(() => {
    const id = window.setInterval(() => setPhase(getSkyPhase(new Date().getHours())), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);
  return phase;
}

function BookStack({ variant }) {
  return (
    <div className={`shelf-cubby shelf-cubby--books shelf-cubby--books-${variant}`} aria-hidden="true">
      <span className="shelf-book" />
      <span className="shelf-book" />
      <span className="shelf-book" />
      <span className="shelf-book" />
      <span className="shelf-book shelf-book--lean" />
    </div>
  );
}

export const HobbiesPanel = forwardRef(function HobbiesPanel({ active }, ref) {
  const [selected, setSelected] = useState(null);
  const skyPhase = useSkyPhase();

  const selectedHobby = selected != null ? HOBBIES[selected] : null;
  const fillerCount = (HOBBY_COLS - (HOBBIES.length % HOBBY_COLS)) % HOBBY_COLS;

  return (
    <div ref={ref} className={`section-panel section-panel--hobbies ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-content hobbies-content">
          <div className={`room room--${skyPhase}`}>
            <div className="room-wall" aria-hidden="true">
              <div className="room-window">
                <div className="room-window-sky">
                  <span className="room-window-orb" />
                  <span className="room-window-cloud" />
                  <span className="room-window-bird" />
                  <span className="room-window-bird room-window-bird--2" />
                  <span className="room-window-shooting-star" />
                </div>
                <span className="room-window-curtain room-window-curtain--l" />
                <span className="room-window-curtain room-window-curtain--r" />
              </div>
              <div className="room-art room-art--a" />
              <div className="room-art room-art--b" />
              <div className="room-clock" />
            </div>
            <div className="room-floor" aria-hidden="true">
              <div className="room-window-light" />
              <div className="room-rug" />
              <div className="room-lamp">
                <span className="room-lamp-shade" />
                <span className="room-lamp-pole" />
                <span className="room-lamp-base" />
              </div>
              <div className="room-plant">
                <span className="room-plant-leaves" />
                <span className="room-plant-pot" />
              </div>
              <div className="room-chair">
                <span className="room-chair-back" />
                <span className="room-chair-arm room-chair-arm--l" />
                <span className="room-chair-arm room-chair-arm--r" />
                <span className="room-chair-seat" />
              </div>
              <img src={petDogA} className="room-pet" alt="" />
            </div>

            <div className="bookshelf-stage">
              <div className="bookshelf">
                <h2 className="bookshelf-sign">Hobbies</h2>
                <div className="bookshelf-grid">
                  {HOBBIES.map((h, index) => (
                    <button
                      key={h.label}
                      type="button"
                      className={`shelf-cubby hobby-slot ${selected === index ? 'is-selected' : ''}`}
                      aria-pressed={selected === index}
                      onClick={() => {
                        if (selected !== index) markHobbySeen(index);
                        setSelected(selected === index ? null : index);
                      }}
                    >
                      <span
                        className={`hobby-item-thumb ${!h.image ? 'hobby-item-thumb--fallback' : ''}`}
                        style={{
                          ...(h.scale ? { '--item-scale': h.scale } : null),
                          ...(!h.image ? { background: h.color } : null),
                        }}
                      >
                        {h.image ? (
                          <img src={h.image} alt="" />
                        ) : (
                          <span className="hobby-item-fallback">{h.label[0]}</span>
                        )}
                      </span>
                      <span className="hobby-item-label">{h.label}</span>
                    </button>
                  ))}
                  {Array.from({ length: fillerCount }, (_, i) => (
                    <BookStack key={i} variant={i % 2 === 0 ? 'a' : 'b'} />
                  ))}
                </div>
              </div>
              <div className={`hobby-detail ${selectedHobby ? 'is-open' : ''}`}>
                <div className="hobby-detail-inner">
                  {selectedHobby && (
                    <>
                      <button
                        type="button"
                        className="hobby-detail-close"
                        onClick={() => setSelected(null)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <h3 style={{ color: selectedHobby.color }}>{selectedHobby.label}</h3>
                      <p>{selectedHobby.desc}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Copying rather than linking out to a mailto: means the address shows up
// as plain readable text (recruiters can just look at it) and a click gets
// it onto the clipboard without launching whatever mail client happens to
// be registered on the visitor's machine.
function CopyEmailButton({ email }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className="dialogue-link dialogue-link--copy" onClick={handleClick}>
      {!copied && <MailIcon />}
      {copied ? 'Copied!' : email}
    </button>
  );
}

// Plain inline SVG (not an icon font glyph) so it stays crisp at this size
// and needs no extra asset — a small envelope in front of the address is
// enough to make "this is an email, click to copy" legible at a glance
// instead of relying on visitors reading it as one from the text alone.
function MailIcon() {
  return (
    <svg
      className="mail-icon"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

// Plain document/page glyph — matches MailIcon's stroke line-art style
// rather than GitHubIcon/LinkedInIcon's filled brand marks, since there's no
// brand mark for "résumé", just a generic file.
function ResumeIcon() {
  return (
    <svg
      className="mail-icon"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

// Standard brand marks (simple-icons paths, CC0) rendered solid in
// currentColor rather than as MailIcon's stroke line-art — GitHub/LinkedIn
// only read as themselves as a filled logo, the way every other place they
// appear renders them.
export function GitHubIcon() {
  return (
    <svg className="mail-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="mail-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

const CONTACT_LINK_ICONS = {
  GitHub: GitHubIcon,
  LinkedIn: LinkedInIcon,
};

// Contact is the town post office, laid out like the Hobbies room: a tall
// back wall with everything standing against it (a wide notice board with
// the GitHub/LinkedIn posters and, once earned, the secret note; Owen
// behind the clerk's window; a wall of mail cubbies), and in front, a
// counter straddling the floor line. On the counter: a stamped envelope
// with the email address (tap to copy), the résumé as a parcel, and a
// notepad that opens a sheet of letter paper; "Mail it" opens the
// visitor's own mail app with the letter addressed and filled in.
function LetterPaper({ email, onClose }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const subject = name.trim() ? `Hello from ${name.trim()}` : 'Hello from your website';
  const body = message.trim() + (name.trim() ? `\n\n- ${name.trim()}` : '');
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const ready = message.trim().length > 0;
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  return (
    <div className="po-letter-backdrop" role="dialog" aria-label="Write Owen a letter" onClick={onClose}>
      <form className="po-letter" onSubmit={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="hobby-detail-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <span className="po-letter-title">Dear Owen,</span>
        <label className="po-letter-field">
          <span>From</span>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </label>
        <label className="po-letter-field">
          <span>Message</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi Owen, ..." rows={6} />
        </label>
        <div className="po-letter-actions">
          <a
            href={ready ? href : undefined}
            className={`po-mail-it ${ready ? '' : 'is-disabled'}`}
            aria-disabled={!ready}
            onClick={(e) => {
              if (!ready) e.preventDefault();
            }}
          >
            ✉ Mail it
          </a>
          <span className="po-letter-hint">Opens your email app with this letter ready to send.</span>
        </div>
      </form>
    </div>
  );
}

export const ContactPanel = forwardRef(function ContactPanel({ active }, ref) {
  const { championAt } = useAchievements();
  const [writing, setWriting] = useState(false);
  return (
    <div ref={ref} className={`section-panel section-panel--contact ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-content po-content">
          <div className="po">
            <div className="po-wall" aria-hidden="true" />
            <div className="po-floor" aria-hidden="true" />

            <div className="po-back">
              <h2 className="po-sign">Post Office</h2>
              <div className="po-back-row">
                <aside className="po-board" aria-label="Notice board">
                  <span className="po-board-title">Notice Board</span>
                  <div className="po-board-pins">
                    <div className="po-posters">
                      {CONTACT.links.map((l, i) => {
                        const Icon = CONTACT_LINK_ICONS[l.label];
                        return (
                          <a
                            key={l.label}
                            href={l.href}
                            className="po-poster"
                            style={{ '--tilt': `${i % 2 ? 2 : -2}deg` }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {Icon && <Icon />}
                            {l.label}
                          </a>
                        );
                      })}
                    </div>
                    {championAt && (
                      <div className="po-secret" aria-label="Secret note">
                        <span className="secret-note-pin" aria-hidden="true" />
                        <h3 className="secret-note-title">{SECRET_NOTE.title}</h3>
                        <p>{SECRET_NOTE.body}</p>
                      </div>
                    )}
                  </div>
                </aside>

                <div className="po-window">
                  <div className={`npc-portrait po-clerk ${championAt ? 'npc-portrait--champion' : ''}`}>
                    <img src={owenPortrait} alt="Owen Lee" />
                    {championAt && (
                      <span className="npc-portrait-star" aria-hidden="true">
                        ★
                      </span>
                    )}
                  </div>
                  <p className="po-bubble">{CONTACT.message}</p>
                </div>

                <div className="po-slots" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, i) => (
                    <span key={i} className={`po-slot ${[1, 4, 5, 9].includes(i) ? 'has-letter' : ''}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="po-counter">
              <div className="po-counter-items">
                {CONTACT.email && (
                  <div className="po-envelope">
                    <span className="po-envelope-stamp" aria-hidden="true" />
                    <CopyEmailButton email={CONTACT.email} />
                  </div>
                )}
                <a href={RESUME_URL} className="po-parcel" target="_blank" rel="noopener noreferrer">
                  <span className="po-parcel-label">
                    <ResumeIcon /> Résumé
                  </span>
                </a>
                {CONTACT.email && (
                  <button type="button" className="po-notepad" onClick={() => setWriting(true)}>
                    <span className="po-notepad-title">Write Owen a letter</span>
                    <span className="po-notepad-pen" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <span className="po-mailbox" aria-hidden="true" />
          </div>

          {writing && <LetterPaper email={CONTACT.email} onClose={() => setWriting(false)} />}
        </div>
      </div>
    </div>
  );
});
