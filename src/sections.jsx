import { forwardRef, useEffect, useRef, useState } from 'react';
import { PROJECTS, HOBBIES, CONTACT } from './content';
import petDogA from './assets/pet-dog-a.png';

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

function useRowVideoPlayback() {
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

// Shared by ProjectsPanel — falls back to a colored placeholder box when
// neither `video` nor `image` is set yet (see content.js), so a section can
// be filled in one entry at a time without any card looking broken.
function CardThumb({ video, image, color, alt, registerVideo }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!video) return undefined;
    return registerVideo(videoRef.current);
  }, [video, registerVideo]);

  if (video) {
    return (
      <div className="project-thumb project-thumb--image">
        <video
          ref={videoRef}
          src={video}
          className="project-thumb-img"
          controls
          muted
          loop
          playsInline
          preload="metadata"
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
      <span>Image placeholder</span>
    </div>
  );
}

export const ProjectsPanel = forwardRef(function ProjectsPanel({ active }, ref) {
  const registerVideo = useRowVideoPlayback();
  return (
    <div ref={ref} className={`section-panel section-panel--projects ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-floor section-floor--stone" />
        <div className="section-content projects-content">
          <h2 className="projects-heading">Projects</h2>
          <div className="projects-grid">
            {PROJECTS.map((p) => (
              <article key={p.name} className="project-card">
                <CardThumb video={p.video} image={p.image} color={p.color} alt={p.name} registerVideo={registerVideo} />
                <div className="project-meta">
                  <h3>{p.name}</h3>
                  <span className="project-date">{p.date}</span>
                </div>
                {(p.link || p.live) && (
                  <div className="project-links">
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer" className="project-live-link">
                        <GitHubIcon /> GitHub
                      </a>
                    )}
                    {p.live && (
                      <a href={p.live} target="_blank" rel="noreferrer" className="project-live-link">
                        Live Demo →
                      </a>
                    )}
                  </div>
                )}
                <p>{p.desc}</p>
                {p.tech?.length > 0 && (
                  <ul className="project-tech">
                    {p.tech.map((t) => (
                      <li key={t} className="tech-chip">{t}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// Hobbies sit on a stack of separate shelf boards rather than one long
// flex-wrap row — HOBBY_ROW_SIZE items per board, each board its own
// bordered `.shelf` div, so the bookshelf reads as physical tiers instead of
// a single shared lip under however many lines the items happened to wrap
// into. Within a row, items still lay out as a flex-wrap (each item's width
// comes from its own photo's aspect ratio at a fixed display height — see
// .hobby-item-thumb in App.css: height is set, width is auto), so a tall
// portrait photo and a wide landscape one both just sit naturally at their
// own width instead of being cropped into a square; on a narrow viewport a
// row can still wrap to two lines, and that row's board just grows to stay
// under all of them. Clicking an item grows the detail panel's flex-basis
// from 0, which pushes the shelf stack (flex: 1, so it always exactly fills
// whatever's left) out of the way in the same motion — driven by the actual
// remaining space rather than a fixed translateX distance, so there's no way
// for it to end up cutting the shelf off mid-slide.
const HOBBY_ROW_SIZE = 3;

function chunkHobbiesIntoRows(hobbies, rowSize) {
  const rows = [];
  for (let i = 0; i < hobbies.length; i += rowSize) {
    rows.push(hobbies.slice(i, i + rowSize).map((h, j) => ({ hobby: h, index: i + j })));
  }
  return rows;
}

export const HobbiesPanel = forwardRef(function HobbiesPanel({ active }, ref) {
  const [selected, setSelected] = useState(null);

  const selectedHobby = selected != null ? HOBBIES[selected] : null;
  const hobbyRows = chunkHobbiesIntoRows(HOBBIES, HOBBY_ROW_SIZE);

  return (
    <div ref={ref} className={`section-panel section-panel--hobbies ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-floor section-floor--house" />
        <div className="section-content hobbies-content">
          <h2 className="projects-heading">Hobbies</h2>
          <div className="house-frame house-frame--a" aria-hidden="true" />
          <div className="house-frame house-frame--b" aria-hidden="true" />
          <div className="house-frame house-frame--c" aria-hidden="true" />
          <div className="room-rug" aria-hidden="true" />
          <div className="room-lamp" aria-hidden="true">
            <span className="room-lamp-shade" />
            <span className="room-lamp-pole" />
            <span className="room-lamp-base" />
          </div>
          <div className="room-chair" aria-hidden="true">
            <span className="room-chair-back" />
            <span className="room-chair-seat" />
            <span className="room-chair-leg room-chair-leg--l" />
            <span className="room-chair-leg room-chair-leg--r" />
          </div>
          <img src={petDogA} className="room-pet" alt="" aria-hidden="true" />
          <div className="bookshelf-stage">
            <div className="bookshelf">
              {hobbyRows.map((row, rowIndex) => (
                <div className="shelf" key={rowIndex}>
                  {row.map(({ hobby: h, index }) => (
                    <button
                      key={h.label}
                      type="button"
                      className={`hobby-slot ${selected === index ? 'is-selected' : ''}`}
                      aria-pressed={selected === index}
                      onClick={() => setSelected(selected === index ? null : index)}
                    >
                      <span
                        className={`hobby-item-thumb ${!h.image ? 'hobby-item-thumb--fallback' : ''}`}
                        style={{
                          ...(h.size ? { height: h.size } : null),
                          ...(!h.image ? { width: 64, background: h.color } : null),
                        }}
                      >
                        {h.image ? (
                          <img src={h.image} alt={h.label} />
                        ) : (
                          <span className="hobby-item-fallback">{h.label[0]}</span>
                        )}
                      </span>
                      <span className="hobby-item-label">{h.label}</span>
                    </button>
                  ))}
                </div>
              ))}
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

// Standard brand marks (simple-icons paths, CC0) rendered solid in
// currentColor rather than as MailIcon's stroke line-art — GitHub/LinkedIn
// only read as themselves as a filled logo, the way every other place they
// appear renders them.
function GitHubIcon() {
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

export const ContactPanel = forwardRef(function ContactPanel({ active }, ref) {
  return (
    <div ref={ref} className={`section-panel section-panel--contact ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-floor section-floor--wood" />
        <div className="section-content contact-content">
          <div className="npc-portrait">?</div>
          <div className="dialogue-box">
            <p className="dialogue-text">{CONTACT.message}</p>
            <div className="dialogue-links">
              {CONTACT.email && <CopyEmailButton email={CONTACT.email} />}
              {CONTACT.links.map((l) => {
                const Icon = CONTACT_LINK_ICONS[l.label];
                return (
                  <a
                    key={l.label}
                    href={l.href}
                    className="dialogue-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {Icon && <Icon />}
                    {l.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
