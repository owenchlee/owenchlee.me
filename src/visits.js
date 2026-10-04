import { BADGES, getAchievements } from './achievements';

// How many times this browser has visited the town, so the welcome sign
// can greet a returning visitor and point them at a badge they haven't
// found yet. A reload in the same tab is the same visit (sessionStorage
// remembers it was counted); a new tab or a later day is a new one.
const STORAGE_KEY = 'visits-v1';
const SESSION_KEY = 'visit-counted';

function recordVisit() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
    const count = Number.isInteger(saved.count) ? saved.count : 0;
    if (sessionStorage.getItem(SESSION_KEY)) return Math.max(count, 1);
    sessionStorage.setItem(SESSION_KEY, '1');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: count + 1 }));
    return count + 1;
  } catch {
    // Private mode / blocked storage — treat every visit as the first.
    return 1;
  }
}

const visitNumber = recordVisit();

export function getVisitNumber() {
  return visitNumber;
}

// Extra lines the welcome sign reads out before its usual ones, or none on
// a first visit.
export function welcomeBackLines() {
  if (visitNumber < 2) return [];
  const { earned, championAt } = getAchievements();
  const found = BADGES.filter((b) => earned[b.id]).length;
  const greeting = `Welcome back! This is visit number ${visitNumber}.`;
  if (championAt) return [greeting, "You're already the Champion. Thanks for dropping by again!"];
  const next = BADGES.find((b) => !earned[b.id]);
  return [greeting, `You have ${found} of ${BADGES.length} badges. For the next one: ${next.hint}`];
}
