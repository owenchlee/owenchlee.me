import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROJECTS, HOBBIES, EXPERIENCE, EDUCATION, CONTACT, DIALOGUE, RESUME_URL } from '../content';
import { NPCS, PET_WALKERS, SIGNS } from '../tileMap';

const publicFile = (url) => resolve(__dirname, '../../public', url.replace(/^\//, ''));

describe('dialogue', () => {
  const speakers = [...NPCS, ...PET_WALKERS, ...SIGNS].map((e) => e.id);

  it('gives every NPC, dog walker and sign something to say', () => {
    for (const id of speakers) expect(DIALOGUE[id], id).toBeDefined();
  });

  it('has a name and at least one non-empty line per speaker', () => {
    for (const [id, entry] of Object.entries(DIALOGUE)) {
      expect(entry.name, id).toBeTruthy();
      expect(entry.lines.length, id).toBeGreaterThan(0);
      entry.lines.forEach((line) => expect(line.trim(), id).not.toBe(''));
    }
  });
});

describe('projects', () => {
  it('have unique names', () => {
    const names = PROJECTS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('each have a description, a date and a colour', () => {
    for (const p of PROJECTS) {
      expect(p.desc, p.name).toBeTruthy();
      expect(p.date, p.name).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
      expect(p.color, p.name).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('link out over https (or are deliberately unlinked)', () => {
    for (const p of PROJECTS) {
      if (p.link !== null) expect(p.link, p.name).toMatch(/^https:\/\//);
      if (p.live) expect(p.live, p.name).toMatch(/^https:\/\//);
    }
  });

  it('point demo videos and their posters at real files', () => {
    for (const p of PROJECTS.filter((p) => p.video)) {
      expect(existsSync(publicFile(p.video)), p.video).toBe(true);
      expect(existsSync(publicFile(p.video.replace(/\.mp4$/, '-poster.webp'))), `${p.name} poster`).toBe(true);
    }
  });

  it('are listed newest first', () => {
    const time = (d) => new Date(`1 ${d}`).getTime();
    for (let i = 1; i < PROJECTS.length; i++) {
      expect(time(PROJECTS[i].date), PROJECTS[i].name).toBeLessThanOrEqual(time(PROJECTS[i - 1].date));
    }
  });
});

describe('everything else', () => {
  it('ships the résumé it links to', () => {
    expect(existsSync(publicFile(RESUME_URL))).toBe(true);
  });

  it('gives every hobby an image and a description', () => {
    for (const h of HOBBIES) {
      expect(h.image, h.label).toBeTruthy();
      expect(h.desc, h.label).toBeTruthy();
    }
  });

  it('fills in every experience and education entry', () => {
    for (const e of EXPERIENCE) {
      expect(e.role && e.org && e.dates, e.org).toBeTruthy();
      expect(e.bullets.length, e.org).toBeGreaterThan(0);
    }
    for (const e of EDUCATION) expect(e.program && e.school && e.dates).toBeTruthy();
  });

  it('has a plausible contact email and https links', () => {
    expect(CONTACT.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/i);
    CONTACT.links.forEach((l) => expect(l.href).toMatch(/^https:\/\//));
  });
});
