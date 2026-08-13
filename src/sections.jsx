import { forwardRef, useEffect, useRef, useState } from 'react';
import { PROJECTS, HOBBIES, CONTACT } from './content';

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
                  <h3>
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noreferrer">{p.name}</a>
                    ) : (
                      p.name
                    )}
                  </h3>
                  <span className="project-date">{p.date}</span>
                </div>
                {p.live && (
                  <a href={p.live} target="_blank" rel="noreferrer" className="project-live-link">
                    Live Demo →
                  </a>
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

// Hobbies sit on the shelf as a flex-wrap row rather than a fixed grid —
// each item's width comes from its own photo's aspect ratio at a fixed
// display height (see .hobby-item-thumb in App.css: height is set, width is
// auto), so a tall portrait photo and a wide landscape one both just sit
// naturally at their own width instead of being cropped into a square. They
// wrap across as many rows as fit the shelf's actual width, which is what
// keeps the shelf from ever overflowing its own frame regardless of viewport
// size or how many hobbies get added. Clicking an item grows the detail
// panel's flex-basis from 0, which pushes the shelf (flex: 1, so it always
// exactly fills whatever's left) out of the way in the same motion — driven
// by the actual remaining space rather than a fixed translateX distance, so
// there's no way for it to end up cutting the shelf off mid-slide.
export const HobbiesPanel = forwardRef(function HobbiesPanel({ active }, ref) {
  const [selected, setSelected] = useState(null);

  const selectedHobby = selected != null ? HOBBIES[selected] : null;

  return (
    <div ref={ref} className={`section-panel section-panel--hobbies ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-floor section-floor--grass" />
        <div className="section-content hobbies-content">
          <h2 className="projects-heading">Hobbies</h2>
          <div className="bookshelf-stage">
            <div className="bookshelf">
              <div className="shelf">
                {HOBBIES.map((h, index) => (
                  <button
                    key={h.label}
                    type="button"
                    className={`hobby-slot ${selected === index ? 'is-selected' : ''}`}
                    aria-pressed={selected === index}
                    onClick={() => setSelected(selected === index ? null : index)}
                  >
                    <span
                      className="hobby-item-thumb"
                      style={!h.image ? { width: 64, background: h.color } : undefined}
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
      {copied ? 'Copied!' : email}
    </button>
  );
}

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
              {CONTACT.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="dialogue-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
