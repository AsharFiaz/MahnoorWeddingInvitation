/* tour.js — the autopilot: a scripted run of the book, driven by book time.
 *
 * Adapted from spring-bloom (js/tour.js, MIT, Abdelrahman Shaaban 2026). The
 * shape is the original's: a sorted list of timed events, each fired through
 * the very same calls a reader's taps would make once book time passes it,
 * and a seek backwards resets the book and replays from zero because every
 * module keeps its state as a log of timed entries. The reel's pointer and
 * narration events are gone; `pose`, `caption` and `phase` were added for
 * the camera ledger and the HTML layer, and `finish()` and `replay()` serve
 * the guest's Skip and Replay controls.
 *
 * Events (all have `t` in seconds):
 *   openCover            lift the cover
 *   next | prev          turn a page
 *   pose {kind, dur}     ask the camera ledger for a flight
 *   caption {id}         show a card in the HTML layer (null hides)
 *   phase {id}           a named stage: intro, approach, book, summary
 */

export function createTour(api, events, { end = 0 } = {}) {
  const list = [...events].sort((a, b) => a.t - b.t);
  let applied = 0;
  let lastTime = -1;
  let finished = false;

  function reset() {
    api.book.reset?.();
    api.camera.resetTo?.('world');
    applied = 0;
    finished = false;
    api.events.emit('caption', { id: null });
    api.events.emit('phase', { id: 'intro' });
  }

  function fire(e) {
    switch (e.do) {
      case 'openCover': api.book.openCover(); break;
      case 'next': api.turn.next(); break;
      case 'prev': api.turn.prev(); break;
      case 'pose': api.events.emit('pose', { kind: e.kind, dur: e.dur, t: e.t }); break;
      case 'caption': api.events.emit('caption', { id: e.id }); break;
      case 'phase': api.events.emit('phase', { id: e.id }); break;
      default: break;
    }
  }

  /* Apply every event whose time has passed. Call once per frame. */
  function update(time) {
    if (time < lastTime - 1e-6) reset();
    lastTime = time;
    while (applied < list.length && list[applied].t <= time + 1e-6) {
      fire(list[applied]);
      applied += 1;
    }
    if (!finished && end > 0 && time >= end) {
      finished = true;
      api.events.emit('phase', { id: 'summary' });
      api.events.emit('caption', { id: 'summary' });
    }
  }

  /* Skip to the end: the book lies open at its last spread with the
     summary on screen. A jump, so every module snaps rather than animates. */
  function finish() {
    const last = api.book.lastSpread ?? 0;
    api.clock.time = Math.max(api.clock.time, end);
    lastTime = api.clock.time;
    applied = list.length;
    api.book.open(last);
    finished = true;
    api.events.emit('phase', { id: 'summary' });
    api.events.emit('caption', { id: 'summary' });
  }

  /* Back to the very start. */
  function replay() {
    api.clock.time = 0;
    lastTime = 0;
    reset();
    api.clock.paused = false;
  }

  return { list, end, update, reset, finish, replay, get applied() { return applied; }, get finished() { return finished; } };
}
