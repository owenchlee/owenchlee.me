// Keep Tab / Shift+Tab inside a modal dialog by wrapping at the first and last tabbable.
const TABBABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function trapTab(e, root) {
  if (!root) return;
  const items = [...root.querySelectorAll(TABBABLE)].filter((el) => el.getClientRects().length > 0);
  if (!items.length) { e.preventDefault(); return; }
  const first = items[0];
  const last = items[items.length - 1];
  const a = document.activeElement;
  if (!root.contains(a) || (e.shiftKey && a === first) || (!e.shiftKey && a === last)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  }
}
