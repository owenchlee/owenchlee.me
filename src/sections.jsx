import { forwardRef } from 'react';
import { INTRO, PROJECTS, HOBBIES, CONTACT } from './content';

export const IntroPanel = forwardRef(function IntroPanel({ active }, ref) {
  return (
    <div ref={ref} className={`section-panel section-panel--intro ${active ? 'visible' : ''}`}>
      <div className="section-floor section-floor--wood" />
      <div className="intro-hero section-content">
        <div className="intro-avatar">YOU</div>
        <h1>Hi, I'm {INTRO.name}</h1>
        <p>{INTRO.bio}</p>
        <p className="scroll-hint">Keep scrolling to continue exploring ↓</p>
      </div>
    </div>
  );
});

// Shared by ProjectsPanel/HobbiesPanel — falls back to a colored placeholder
// box when `image` isn't set yet (see content.js), so a section can be
// filled in one entry at a time without any card looking broken.
function CardThumb({ image, color, alt }) {
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
      <div className="section-floor section-floor--stone" />
      <div className="section-content projects-content">
        <h2 className="projects-heading">Projects</h2>
        <div className="projects-grid">
          {PROJECTS.map((p) => (
            <article key={p.name} className="project-card">
              <CardThumb image={p.image} color={p.color} alt={p.name} />
              <div className="project-meta">
                <h3>{p.name}</h3>
                <span className="project-date">{p.date}</span>
              </div>
              <p>{p.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
});

export const HobbiesPanel = forwardRef(function HobbiesPanel({ active }, ref) {
  return (
    <div ref={ref} className={`section-panel section-panel--hobbies ${active ? 'visible' : ''}`}>
      <div className="section-floor section-floor--grass" />
      <div className="section-content projects-content">
        <h2 className="projects-heading">Hobbies</h2>
        <div className="projects-grid">
          {HOBBIES.map((h) => (
            <article key={h.label} className="project-card">
              <CardThumb image={h.image} color={h.color} alt={h.label} />
              <div className="project-meta">
                <h3>{h.label}</h3>
              </div>
              <p>{h.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
});

export const ContactPanel = forwardRef(function ContactPanel({ active }, ref) {
  return (
    <div ref={ref} className={`section-panel section-panel--contact ${active ? 'visible' : ''}`}>
      <div className="section-floor section-floor--wood" />
      <div className="section-content contact-content">
        <div className="npc-portrait">?</div>
        <div className="dialogue-box">
          <p className="dialogue-text">{CONTACT.message}</p>
          <div className="dialogue-links">
            {CONTACT.links.map((l) => (
              <a key={l.label} href={l.href} className="dialogue-link">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
