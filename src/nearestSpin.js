// The carousel's `spin` counts cabinets and is never wrapped (so the ring
// doesn't whip the long way round). This returns the spin value closest to
// `spin` that puts cabinet `i` of `n` at the front.
export function nearestSpin(spin, i, n) {
  let d = (((i - spin) % n) + n) % n;
  if (d > n / 2) d -= n;
  return spin + d;
}
