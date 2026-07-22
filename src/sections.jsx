import { forwardRef } from 'react';

export const IntroPanel = forwardRef(function IntroPanel({ active }, ref) {
  return (
    <div ref={ref} className={`section-panel section-panel--intro ${active ? 'visible' : ''}`}>
      <div className="section-floor section-floor--wood" />
      <div className="intro-hero section-content">
        <div className="intro-avatar">YOU</div>
        <h1>Hi, I'm [Your Name]</h1>
        <p>
          Placeholder bio — a couple of sentences about who you are, what you
          do, and what you're into. Swap this out for the real thing later.
        </p>
        <p className="scroll-hint">Keep scrolling to continue exploring ↓</p>
      </div>
    </div>
  );
});

const PROJECTS = [
  {
    name: 'Project Alpha',
    date: 'Mar 2026',
    color: '#26a8b1',
    desc: 'One or two sentences on what this project is, what problem it solves, and the stack behind it.',
  },
  {
    name: 'Project Beta',
    date: 'Jan 2026',
    color: '#4da338',
    desc: 'Placeholder case-study blurb — swap in a real screenshot and a short write-up of your role and impact.',
  },
  {
    name: 'Project Gamma',
    date: 'Nov 2025',
    color: '#a67a54',
    desc: 'A third placeholder entry. Each card is meant to hold one image and a few lines of context.',
  },
];

export const ProjectsPanel = forwardRef(function ProjectsPanel({ active }, ref) {
  return (
    <div ref={ref} className={`section-panel section-panel--projects ${active ? 'visible' : ''}`}>
      <div className="section-floor section-floor--stone" />
      <div className="section-content projects-content">
        <h2 className="projects-heading">Projects</h2>
        <div className="projects-grid">
          {PROJECTS.map((p) => (
            <article key={p.name} className="project-card">
              <div className="project-thumb" style={{ background: p.color }}>
                <span>Image placeholder</span>
              </div>
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

const HOBBIES = [
  { label: 'Photography', color: '#e8b4bc', desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Basketball', color: '#f0a94e', desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Cooking', color: '#e8877a', desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Reading', color: '#8ea9c9', desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Music', color: '#b79fd1', desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
  { label: 'Hiking', color: '#8fbf8a', desc: 'Placeholder blurb about this hobby — swap in a real photo and a line or two.' },
];

export const HobbiesPanel = forwardRef(function HobbiesPanel({ active }, ref) {
  return (
    <div ref={ref} className={`section-panel section-panel--hobbies ${active ? 'visible' : ''}`}>
      <div className="section-floor section-floor--grass" />
      <div className="section-content projects-content">
        <h2 className="projects-heading">Hobbies</h2>
        <div className="projects-grid">
          {HOBBIES.map((h) => (
            <article key={h.label} className="project-card">
              <div className="project-thumb" style={{ background: h.color }}>
                <span>Image placeholder</span>
              </div>
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

const CONTACT_LINKS = [
  { label: 'Email', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'LinkedIn', href: '#' },
];

export const ContactPanel = forwardRef(function ContactPanel({ active }, ref) {
  return (
    <div ref={ref} className={`section-panel section-panel--contact ${active ? 'visible' : ''}`}>
      <div className="section-floor section-floor--wood" />
      <div className="section-content contact-content">
        <div className="npc-portrait">?</div>
        <div className="dialogue-box">
          <p className="dialogue-text">Thanks for stopping by! Here's how to reach me:</p>
          <div className="dialogue-links">
            {CONTACT_LINKS.map((l) => (
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
