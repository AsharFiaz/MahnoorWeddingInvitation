/* main.js — boot. Builds the clock, scene, book, turn, camera ledger,
 * pop-ups, timeline and HTML layer, wires the frame, and exposes everything
 * on window.__invite for checks.
 *
 * The frame and the api object follow spring-bloom's app.js (MIT,
 * Abdelrahman Shaaban 2026): one clock, every module a function of book
 * time, nothing waits on textures before the first frame.
 *
 * URL switches:
 *   ?t=<seconds>     capture mode: render one frame at that time and hold
 *   ?seed=<n>        the seed for paper grain, lawn scatter and petals
 *   ?reduced=1       force reduced motion
 *   ?now=<iso>       the countdown's idea of the present, for checks
 *   ?static=1        the plain invitation, no scene
 */

import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/amiri/400.css';
import './styles/site.css';

import { vw, vh } from './core/viewport.js';
import { createEvents } from './core/events.js';
import { createClock } from './core/clock.js';
import { createTexturePool } from './book/pages.js';
import { createCamera } from './camera/camera.js';
import { createScene } from './world/scene.js';
import { createReveal } from './world/reveal.js';
import { createBook } from './book/book.js';
import { createTurn } from './book/turn.js';
import { LEAF_COUNT } from './book/leaf.js';
import { init as initLedger } from './camera/ledger.js';
import { init as initPopup } from './popup/popup.js';
import { createTour } from './timeline/tour.js';
import { buildStoryboard } from './timeline/storyboard.js';
import { createOverlay } from './ui/overlay.js';
import { showStatic } from './fallback/static.js';
import { PORTRAIT_BELOW } from './camera/camera.js';

export function boot({ canvas, veil, ui, fallback, params = new URLSearchParams(location.search) } = {}) {
  const seed = Number(params.get('seed')) || 7;
  const capture = params.has('t');
  const mode = capture ? 'capture' : 'live';
  const live = !capture;
  const reduced = params.get('reduced') === '1'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.dataset.reduced = '1';

  /* The clock is built last (its frame callback needs every module), so the
     getters below read it through a binding that is null until then. */
  let clock = null;
  const now = () => (clock ? clock.time : 0);

  const events = createEvents();
  const camera = createCamera({ reduced, live });
  const world = createScene({ canvas, camera, seed, reduced });
  const { renderer, scene } = world;
  const pool = createTexturePool({ renderer, seed });
  if (capture) pool.setKeepAll(true);

  const api = {
    get time() { return now(); },
    mode,
    reduced,
    seed,
    scene,
    camera,
    renderer,
    events,
    pool,
    world,
    vw,
    vh,
  };

  const book = createBook({ pool, clock: { get time() { return now(); } }, events, reduced });
  book.lastSpread = LEAF_COUNT - 1;
  /* the pieces standing on a page drop real shadows onto it */
  book.group.traverse((o) => { if (o.isMesh && !o.material.transparent) o.receiveShadow = true; });
  scene.add(book.group);
  api.book = book;

  const turn = createTurn({ book, pool, clock: { get time() { return now(); } }, events, camera, canvas, reduced, live });
  api.turn = turn;

  initLedger(api);
  camera.footprint = book.footprint;
  initPopup(api);

  const reveal = reduced ? null : createReveal(veil, { duration: 3.0, delay: 0.3 });
  if (reduced && veil) veil.hidden = true;

  const story = buildStoryboard();
  const tour = createTour(api, story.events, { end: story.end });
  api.tour = tour;

  const overlay = createOverlay(api, ui);
  api.overlay = overlay;

  /* ---- frame ------------------------------------------------------------- */

  function layout() {
    const w = vw(); const h = vh();
    const aspect = w / h;
    world.setSize(w, h);
    camera.refit(aspect);
    document.documentElement.dataset.layout = aspect < PORTRAIT_BELOW ? 'portrait' : 'landscape';
  }

  function onFrame(dt, time) {
    tour.update(time);
    turn.update(dt, time);
    camera.update(dt, time);
    world.update(dt, time);
    overlay.update(time);
    world.render();
    if (reveal && !reveal.done) reveal.update(time);
  }

  clock = createClock({ mode, onFrame });
  api.clock = clock;
  api.frame = clock.frame;
  api.renderAt = clock.renderAt;
  api.forceRender = () => onFrame(0, clock.time);

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 60));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
  layout();

  /* Reduced motion: no cinematic. The book lies open at its last spread and
     the summary is on screen at once. The guest can still replay. */
  if (reduced) {
    tour.finish();
  }

  if (capture) {
    const t = Number(params.get('t')) || 0;
    clock.renderAt(t);
    pool.idle().then(() => clock.renderAt(t));
  } else {
    clock.start();
  }

  camera.attach?.(canvas);

  api.layout = layout;
  api.static = () => showStatic(fallback, { reason: '' });
  window.__invite = api;
  return api;
}
