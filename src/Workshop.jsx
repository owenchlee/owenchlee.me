import { useEffect, useRef, useState } from 'react';
import { WORKSHOP_PROJECTS } from './content';

// Inside the hidden workshop: a walk-in room like Hobbies, but a
// tinkerer's shed. Pegboard wall with tools hung on it, a work light on a
// cord, and a workbench where each hands-on build sits as a prop (an
// Arduino with its LCD, the helmet with its Micro:bit, the wooden phone
// stand). Tapping a prop opens its card above the bench. Same capture-phase
// key handling as the Trainer Card, so Escape closes this and nothing
// behind it.
function Gadget({ kind }) {
  if (kind === 'arduino') {
    return (
      <span className="gadget-arduino" aria-hidden="true">
        <span className="gadget-arduino-lcd">
          7+5=?<span className="gadget-arduino-cursor" />
        </span>
        <span className="gadget-arduino-board">
          <span className="gadget-arduino-usb" />
          <span className="gadget-arduino-chip" />
        </span>
      </span>
    );
  }
  if (kind === 'helmet') {
    return (
      <span className="gadget-helmet" aria-hidden="true">
        <span className="gadget-helmet-waves" />
        <span className="gadget-helmet-dome">
          <span className="gadget-helmet-microbit" />
        </span>
      </span>
    );
  }
  return (
    <span className="gadget-stand" aria-hidden="true">
      <span className="gadget-stand-back" />
      <span className="gadget-stand-phone" />
      <span className="gadget-stand-base" />
    </span>
  );
}

function Workshop({ onClose }) {
  const closeRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const project = selected != null ? WORKSHOP_PROJECTS[selected] : null;

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Tab') return;
      e.stopPropagation();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="workshop-room" role="dialog" aria-modal="true" aria-labelledby="workshop-title">
      <div className="workshop-wall">
        <div className="workshop-light" aria-hidden="true">
          <span className="workshop-light-bulb" />
        </div>
        <div className="workshop-tools workshop-tools--l" aria-hidden="true">
          <span className="tool-hammer" />
          <span className="tool-saw" />
        </div>
        <div className="workshop-tools workshop-tools--r" aria-hidden="true">
          <span className="tool-wrench" />
          <span className="tool-tape" />
        </div>

        <h2 id="workshop-title" className="workshop-sign">
          The Workshop
        </h2>
        <p className="workshop-note">
          You found the secret workshop! Before the apps and games, there were circuit boards and sawdust. Tap
          something on the bench.
        </p>

        <div className="workshop-detail" aria-live="polite">
          {project && (
            <div className="workshop-detail-inner" style={{ '--accent': project.color }}>
              <h3>{project.name}</h3>
              <p>{project.desc}</p>
              <ul className="project-tech">
                {project.tech.map((t) => (
                  <li key={t} className="tech-chip">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="workshop-bench">
          <div className="workshop-bench-top">
            {WORKSHOP_PROJECTS.map((p, i) => (
              <button
                key={p.name}
                type="button"
                className={`workshop-gadget ${selected === i ? 'is-selected' : ''}`}
                aria-pressed={selected === i}
                onClick={() => setSelected(selected === i ? null : i)}
              >
                <Gadget kind={p.gadget} />
                <span className="workshop-gadget-label">{p.name}</span>
              </button>
            ))}
            <span className="workshop-scope" aria-hidden="true">
              <svg className="workshop-scope-wave" viewBox="0 0 120 30" preserveAspectRatio="none">
                <path d="M0 15 Q7.5 2 15 15 T30 15 T45 15 T60 15 T75 15 T90 15 T105 15 T120 15" />
              </svg>
            </span>
          </div>
          <span className="workshop-bench-leg workshop-bench-leg--l" aria-hidden="true" />
          <span className="workshop-bench-leg workshop-bench-leg--r" aria-hidden="true" />
        </div>
      </div>
      <div className="workshop-floor" aria-hidden="true" />
      <button ref={closeRef} type="button" className="leave-house workshop-leave" onClick={onClose}>
        ← Leave Workshop
      </button>
    </div>
  );
}

export default Workshop;
