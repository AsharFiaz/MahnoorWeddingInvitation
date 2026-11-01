/* clock.js — the one clock. Owns `time` (seconds) for everything animated.
 *
 * Adapted from spring-bloom (js/clock.js, MIT, Abdelrahman Shaaban 2026).
 * The structure is unchanged: live mode advances from requestAnimationFrame
 * with the step clamped so a stalled tab cannot leap, the loop pauses while
 * the document is hidden, and frame(dt) steps by an exact amount for probes.
 * Capture mode is kept for frame-exact checks (`?t=`). A `paused` flag was
 * added for the guest's pause control: the loop keeps rendering so the
 * camera lean still answers the pointer, but book time stands still.
 */

const MAX_DT = 1 / 30;
const MAX_LEAP = 0.5;

export function createClock({ mode = 'live', onFrame }) {
  const clock = { time: 0, mode, running: false, paused: false };
  let raf = 0;
  let last = 0;

  function tick(now) {
    raf = 0;
    if (!clock.running) return;
    const raw = (now - last) / 1000;
    const dt = raw > 0 ? Math.min(MAX_DT, raw) : 1 / 60;
    const leap = raw > 0 ? Math.min(MAX_LEAP, raw) : 1 / 60;
    last = now;
    if (!clock.paused) clock.time += leap;
    onFrame(dt, clock.time);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (mode !== 'live' || clock.running) return;
    clock.running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    clock.running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* Step by exactly dt. Works in both modes and ignores `paused`. */
  function frame(dt = 1 / 60) {
    clock.time += dt;
    onFrame(dt, clock.time);
  }

  /* Jump to an absolute time. dt is 0 on purpose: a seek is not a step. */
  function renderAt(t) {
    clock.time = t;
    onFrame(0, clock.time);
  }

  if (mode === 'live') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });
  }

  return {
    get time() { return clock.time; },
    set time(v) { clock.time = v; },
    get mode() { return clock.mode; },
    get running() { return clock.running; },
    get paused() { return clock.paused; },
    set paused(v) { clock.paused = !!v; },
    start,
    stop,
    frame,
    renderAt,
  };
}
