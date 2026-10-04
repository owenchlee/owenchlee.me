import { beforeEach, describe, expect, it, vi } from 'vitest';

// The stores only expose state through useSyncExternalStore, so outside a
// component that hook just returns the current snapshot.
vi.mock('react', () => ({ useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() }));

// achievements.js and dialogue.js are module-level stores, so each test
// re-imports a fresh copy against its own in-memory localStorage.
function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    clear: () => data.clear(),
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('localStorage', memoryStorage());
});

describe('badges', () => {
  it('awards a badge once and queues one announcement', async () => {
    const a = await import('../achievements');
    a.earnBadge('projects');
    a.earnBadge('projects');
    expect(Object.keys(readState(a).earned)).toEqual(['projects']);
    expect(readState(a).queue).toHaveLength(1);
  });

  it('ignores ids that are not badges', async () => {
    const a = await import('../achievements');
    a.earnBadge('not-a-badge');
    expect(readState(a).earned).toEqual({});
  });

  it('crowns a Champion only when all eight are earned', async () => {
    const a = await import('../achievements');
    a.BADGES.slice(0, -1).forEach((b) => a.earnBadge(b.id));
    expect(readState(a).championAt).toBeNull();
    a.earnBadge(a.BADGES.at(-1).id);
    expect(readState(a).championAt).toEqual(expect.any(Number));
    expect(readState(a).queue.at(-1).type).toBe('champion');
  });

  it('gives the Curator badge after every hobby has been looked at', async () => {
    const a = await import('../achievements');
    const { HOBBIES } = await import('../content');
    HOBBIES.forEach((_, i) => {
      expect(readState(a).earned.curator).toBeUndefined();
      a.markHobbySeen(i);
    });
    expect(readState(a).earned.curator).toEqual(expect.any(Number));
  });

  it('remembers badges across visits but not the announcement queue', async () => {
    let a = await import('../achievements');
    a.earnBadge('contact');
    vi.resetModules();
    a = await import('../achievements');
    expect(readState(a).earned.contact).toEqual(expect.any(Number));
    expect(readState(a).queue).toEqual([]);
  });

  it('starts fresh when saved data is corrupt', async () => {
    localStorage.setItem('badges-v1', '{not json');
    const a = await import('../achievements');
    expect(readState(a).earned).toEqual({});
  });

  it('gives every badge a 9x9 pixel map', async () => {
    const { BADGES } = await import('../achievements');
    expect(BADGES).toHaveLength(8);
    for (const b of BADGES) {
      expect(b.pixels, b.id).toHaveLength(9);
      b.pixels.forEach((row) => expect(row, b.id).toMatch(/^[ohbs.]{9}$/));
    }
  });
});

describe('dialogue', () => {
  it('steps through each line, then closes', async () => {
    const d = await import('../dialogue');
    const { DIALOGUE } = await import('../content');
    const id = Object.keys(DIALOGUE).find((k) => DIALOGUE[k].lines.length > 1);
    d.openDialogue(id);
    for (let i = 0; i < DIALOGUE[id].lines.length; i++) {
      expect(d.getDialogue().index).toBe(i);
      d.advanceDialogue();
    }
    expect(d.getDialogue()).toBeNull();
  });

  it('ignores unknown speakers', async () => {
    const d = await import('../dialogue');
    d.openDialogue('nobody');
    expect(d.getDialogue()).toBeNull();
  });
});

const readState = (a) => a.useAchievements();
