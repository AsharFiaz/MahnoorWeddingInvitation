/* viewport.js — a window size that is never zero.
 *
 * From spring-bloom (js/viewport.js, MIT, Abdelrahman Shaaban 2026). A hidden
 * browser pane reports innerWidth and innerHeight as 0 and everything
 * downstream divides by it. The fallback is a portrait phone here, because
 * that is the frame this invitation is designed for first.
 */

const FALLBACK_W = 390;
const FALLBACK_H = 844;

export const vw = () => window.innerWidth || document.documentElement.clientWidth || FALLBACK_W;
export const vh = () => window.innerHeight || document.documentElement.clientHeight || FALLBACK_H;
export const vaspect = () => vw() / vh();
