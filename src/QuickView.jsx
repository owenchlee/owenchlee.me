import { useEffect, useRef } from 'react';
import { INTRO, PROJECTS, CONTACT } from './content';
import './QuickView.css';

// A plain, static, fully keyboard/screen-reader-operable view of the same
// content.js data the scroll-driven game world renders — for recruiters (or
// anyone) who wants the facts fast, and for keyboard-only visitors, since
// the scroll/walk experience itself isn't keyboard-operable. Reuses
// INTRO/PROJECTS/CONTACT directly rather than having App.jsx pass them down,
// same pattern sections.jsx already uses.
function QuickView({ onClose }) {
  const headingRef = useRef(null);

  // Move focus into the overlay on open so keyboard users land somewhere
  // sensible instead of on whatever was focused underneath (which is now
  // inert anyway).
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="quick-view">
      <main className="quick-view-panel">
        <button type="button" className="quick-view-close" onClick={onClose}>
          ← Back to site
        </button>

        <h1 ref={headingRef} tabIndex={-1}>
          {INTRO.name}
        </h1>
        <p className="quick-view-role">
          {INTRO.roleTitle} @ {INTRO.roleOrg}
        </p>
        {INTRO.status && <p className="quick-view-status">{INTRO.status}</p>}
        {INTRO.bio && <p className="quick-view-bio">{INTRO.bio}</p>}

        <section aria-labelledby="qv-projects-heading">
          <h2 id="qv-projects-heading">Projects</h2>
          <ul className="quick-view-projects">
            {PROJECTS.map((p) => (
              <li key={p.name}>
                <h3>{p.name}</h3>
                <span className="quick-view-date">{p.date}</span>
                <p>{p.desc}</p>
                {p.tech?.length > 0 && (
                  <ul className="project-tech">
                    {p.tech.map((t) => (
                      <li key={t} className="tech-chip">{t}</li>
                    ))}
                  </ul>
                )}
                <div className="quick-view-links">
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer">
                      Code ↗
                    </a>
                  )}
                  {p.live && (
                    <a href={p.live} target="_blank" rel="noreferrer">
                      Live Demo ↗
                    </a>
                  )}
                  {!p.link && !p.live && <span className="quick-view-nolink">No public link yet</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="qv-contact-heading">
          <h2 id="qv-contact-heading">Contact</h2>
          <p>{CONTACT.message}</p>
          <ul className="quick-view-contact">
            {CONTACT.links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  {...(l.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default QuickView;
