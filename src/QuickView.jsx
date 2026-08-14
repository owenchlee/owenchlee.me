import { useEffect, useRef, useState } from 'react';
import { INTRO, PROJECTS, HOBBIES, CONTACT } from './content';
import { Highlighted } from './Highlighted';
import './QuickView.css';

function MailIcon() {
  return (
    <svg
      className="qv-mail-icon"
      viewBox="0 0 24 24"
      width="15"
      height="15"
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

// Same copy-to-clipboard behavior as sections.jsx's CopyEmailButton, kept
// as its own small copy here rather than shared — QuickView is a
// deliberately separate visual mode (see QuickView.css) with its own
// class names, and the two buttons never render at the same time anyway.
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
    <button type="button" className="qv-email-button" onClick={handleClick}>
      <MailIcon />
      {copied ? 'Copied!' : email}
    </button>
  );
}

// A plain, static, fully keyboard/screen-reader-operable view of the same
// content.js data the scroll-driven game world renders — for recruiters (or
// anyone) who wants the facts fast, and for keyboard-only visitors, since
// the scroll/walk experience itself isn't keyboard-operable. Reuses
// INTRO/PROJECTS/HOBBIES/CONTACT directly rather than having App.jsx pass
// them down, same pattern sections.jsx already uses.
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
        {INTRO.bio && (
          <p className="quick-view-bio">
            <Highlighted text={INTRO.bio} />
          </p>
        )}
        {INTRO.highlights?.length > 0 && (
          <ul className="quick-view-highlights">
            {INTRO.highlights.map((line) => (
              <li key={line}>
                <Highlighted text={line} />
              </li>
            ))}
          </ul>
        )}

        <section aria-labelledby="qv-projects-heading">
          <h2 id="qv-projects-heading">Projects</h2>
          <ul className="quick-view-projects">
            {PROJECTS.map((p) => (
              <li key={p.name} style={{ '--accent': p.color }}>
                <h3>{p.name}</h3>
                <span className="quick-view-date">{p.date}</span>
                <p>{p.desc}</p>
                {p.tech?.length > 0 && (
                  <ul className="quick-view-tech">
                    {p.tech.map((t) => (
                      <li key={t}>{t}</li>
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

        {HOBBIES?.length > 0 && (
          <section aria-labelledby="qv-hobbies-heading">
            <h2 id="qv-hobbies-heading">Hobbies</h2>
            <ul className="quick-view-hobbies">
              {HOBBIES.map((h) => (
                <li key={h.label} style={{ '--accent': h.color }}>
                  <h3>{h.label}</h3>
                  <p>{h.desc}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="qv-contact-heading">
          <h2 id="qv-contact-heading">Contact</h2>
          <p>{CONTACT.message}</p>
          <ul className="quick-view-contact">
            {CONTACT.email && (
              <li>
                <CopyEmailButton email={CONTACT.email} />
              </li>
            )}
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
