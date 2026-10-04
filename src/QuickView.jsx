import { useEffect, useRef, useState } from 'react';
import { INTRO, PROJECTS, HOBBIES, CONTACT, EDUCATION, EXPERIENCE, SKILLS, RESUME_URL } from './content';
import { Highlighted } from './Highlighted';
import { CardThumb, useRowVideoPlayback } from './sections';
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
// as its own small copy here rather than shared — QuickView has its own
// class names (see QuickView.css), and the two buttons never render at the
// same time anyway.
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
// content.js data the game world renders — for recruiters (or anyone) who
// wants the facts fast, and for screen-reader visitors, since the walk
// experience itself is visual-first. Reuses
// INTRO/PROJECTS/HOBBIES/CONTACT directly rather than having App.jsx pass
// them down, same pattern sections.jsx already uses. Styled in the same
// pixel language as the world (tile backdrop, cream/ink cards, pixel-font
// signs) so it reads as another view of the same place, and project cards
// reuse CardThumb so the demo clips play here too.
function QuickView({ onClose, isMobileLanding }) {
  const headingRef = useRef(null);
  const registerVideo = useRowVideoPlayback();

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
          {isMobileLanding ? 'Explore the interactive world →' : '← Back to site'}
        </button>

        <header className="quick-view-hero">
          <h1 ref={headingRef} tabIndex={-1}>
            {INTRO.name}
          </h1>
          <p className="quick-view-role">
            <span className="quick-view-role-tag">{INTRO.roleTitle}</span> @ {INTRO.roleOrg}
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
          <a className="quick-view-resume" href={RESUME_URL} target="_blank" rel="noreferrer">
            View Résumé (PDF) ↗
          </a>
        </header>

        <section aria-labelledby="qv-education-heading">
          <h2 id="qv-education-heading">Education</h2>
          <ul className="quick-view-resume-list">
            {EDUCATION.map((e) => (
              <li key={e.program}>
                <div className="quick-view-card-head">
                  <h3>{e.program}</h3>
                  <span className="quick-view-date">{e.dates}</span>
                </div>
                <p className="quick-view-org">
                  {e.school}
                  {e.location ? ` — ${e.location}` : ''}
                </p>
                {e.notes?.length > 0 && (
                  <ul className="quick-view-bullets">
                    {e.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="qv-experience-heading">
          <h2 id="qv-experience-heading">Experience & Leadership</h2>
          <ul className="quick-view-resume-list">
            {EXPERIENCE.map((e) => (
              <li key={`${e.role}-${e.org}`}>
                <div className="quick-view-card-head">
                  <h3>{e.role}</h3>
                  <span className="quick-view-date">{e.dates}</span>
                </div>
                <p className="quick-view-org">
                  {e.org}
                  {e.location ? ` — ${e.location}` : ''}
                </p>
                <ul className="quick-view-bullets">
                  {e.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="qv-skills-heading">
          <h2 id="qv-skills-heading">Skills</h2>
          <div className="quick-view-skills">
            {SKILLS.map((s) => (
              <div key={s.category} className="quick-view-skills-category">
                <span className="quick-view-skills-label">{s.category}</span>
                <ul className="quick-view-tech">
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="qv-projects-heading">
          <h2 id="qv-projects-heading">Projects</h2>
          <ul className="quick-view-projects">
            {PROJECTS.map((p) => (
              <li key={p.name} style={{ '--accent': p.color }}>
                {(p.video || p.image) && (
                  <CardThumb video={p.video} image={p.image} color={p.color} alt={p.name} registerVideo={registerVideo} />
                )}
                <div className="quick-view-card-head">
                  <h3>{p.name}</h3>
                  <span className="quick-view-date">{p.date}</span>
                </div>
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
                  {h.image && <img src={h.image} alt="" className="quick-view-hobby-img" />}
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
