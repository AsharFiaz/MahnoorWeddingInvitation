/* rng.js — seeded randomness for anything near a render path.
 *
 * From spring-bloom (js/rng.js, MIT, Abdelrahman Shaaban 2026). Every scatter
 * and every canvas speckle goes through mulberry32 so two loads of the same
 * page paint the same lawn, the same paper and the same petals.
 */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
