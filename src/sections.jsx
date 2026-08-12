import { forwardRef, useState } from 'react';
import { PROJECTS, HOBBIES, CONTACT } from './content';

// Shared by ProjectsPanel — falls back to a colored placeholder box when
// neither `video` nor `image` is set yet (see content.js), so a section can
// be filled in one entry at a time without any card looking broken.
function CardThumb({ video, image, color, alt }) {
  // Demo clips start as a still poster frame (like a photo) with a play
  // button overlay — clicking swaps in the real <video> with controls
  // instead of autoplaying a silent background loop.
  const [playing, setPlaying] = useState(false);

  if (video) {
    if (playing) {
      return (
        <div className="project-thumb project-thumb--image">
          <video
            src={video}
            className="project-thumb-img"
            controls
            autoPlay
            playsInline
            onEnded={() => setPlaying(false)}
          />
        </div>
      );
    }
    return (
      <button
        type="button"
        className="project-thumb project-thumb--image project-thumb--video-poster"
        onClick={() => setPlaying(true)}
        aria-label={`Play demo video for ${alt}`}
      >
        <video
          src={video}
          className="project-thumb-img"
          muted
          playsInline
          preload="metadata"
        />
        <span className="project-thumb-play" aria-hidden="true">▶</span>
      </button>
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
  return (
    <div ref={ref} className={`section-panel section-panel--projects ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-floor section-floor--stone" />
        <div className="section-content projects-content">
          <h2 className="projects-heading">Projects</h2>
          <div className="projects-grid">
            {PROJECTS.map((p) => (
              <article key={p.name} className="project-card">
                <CardThumb video={p.video} image={p.image} color={p.color} alt={p.name} />
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

// Hobbies fill the whole panel as a grid of shelf slots — HOBBY_COLS wide,
// always at least HOBBY_ROWS tall (more rows appear automatically if HOBBIES
// ever outgrows that), so entries fill in a handful of slots on an otherwise
// full shelf rather than a cramped little box. Unfilled slots just render as
// empty shelf space — nothing to configure, add an entry to HOBBIES in
// content.js and it fills the next slot. Clicking an item grows the detail
// panel's flex-basis from 0, which pushes the shelf (flex: 1, so it always
// exactly fills whatever's left) out of the way in the same motion — driven
// by the actual remaining space rather than a fixed translateX distance, so
// there's no way for it to end up cutting the shelf off mid-slide.
const HOBBY_COLS = 5;
const HOBBY_ROWS = 4;

export const HobbiesPanel = forwardRef(function HobbiesPanel({ active }, ref) {
  const [selected, setSelected] = useState(null);

  const rowCount = Math.max(HOBBY_ROWS, Math.ceil(HOBBIES.length / HOBBY_COLS));
  const shelves = [];
  for (let r = 0; r < rowCount; r++) {
    const row = [];
    for (let c = 0; c < HOBBY_COLS; c++) {
      const index = r * HOBBY_COLS + c;
      row.push(index < HOBBIES.length ? { ...HOBBIES[index], index } : null);
    }
    shelves.push(row);
  }

  const selectedHobby = selected != null ? HOBBIES[selected] : null;

  return (
    <div ref={ref} className={`section-panel section-panel--hobbies ${active ? 'visible' : ''}`}>
      <div className="section-panel-inner">
        <div className="section-floor section-floor--grass" />
        <div className="section-content hobbies-content">
          <h2 className="projects-heading">Hobbies</h2>
          <div className="bookshelf-stage">
            <div className="bookshelf">
              {shelves.map((row, shelfIndex) => (
                <div className="shelf" key={shelfIndex}>
                  {row.map((h, i) =>
                    h ? (
                      <button
                        key={h.label}
                        type="button"
                        className={`hobby-slot ${selected === h.index ? 'is-selected' : ''}`}
                        aria-pressed={selected === h.index}
                        onClick={() => setSelected(selected === h.index ? null : h.index)}
                      >
                        <span
                          className="hobby-item-thumb"
                          style={!h.image ? { background: h.color } : undefined}
                        >
                          {h.image ? (
                            <img src={h.image} alt={h.label} />
                          ) : (
                            <span className="hobby-item-fallback">{h.label[0]}</span>
                          )}
                        </span>
                        <span className="hobby-item-label">{h.label}</span>
                      </button>
                    ) : (
                      <div className="hobby-slot hobby-slot--empty" key={i} />
                    )
                  )}
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
              {CONTACT.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="dialogue-link"
                  {...(l.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
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
