// Saved data comes from localStorage, so never trust its shape: keep only
// entries whose key and value pass the checks, from a plain object.
export const isInt = (n) => Number.isInteger(n);
export function cleanMap(obj, validKey, validVal) {
  const out = {};
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) if (validKey(k) && validVal(v)) out[k] = v;
  }
  return out;
}
