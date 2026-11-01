/* countdown.js — the time to the Mehndi, then to the Barat, then nothing.
 *
 * Pure: `countdownState(nowMs, events)` is a function of the instant and the
 * configured events, so the transitions can be tested without a browser.
 * The instant comes from `createTimeSource()`, which honours a `?now=`
 * parameter for checks and the real clock otherwise. Event instants are
 * parsed from their ISO strings with explicit offsets, so a guest's own
 * timezone cannot move them.
 */

export function countdownState(nowMs, events) {
  const list = events
    .map((e) => ({ id: e.id, name: e.name, start: Date.parse(e.start) }))
    .filter((e) => Number.isFinite(e.start))
    .sort((a, b) => a.start - b.start);
  for (const e of list) {
    if (nowMs < e.start) {
      const ms = e.start - nowMs;
      const s = Math.floor(ms / 1000);
      return {
        target: e.id,
        name: e.name,
        ms,
        days: Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        minutes: Math.floor((s % 3600) / 60),
        seconds: s % 60,
      };
    }
  }
  return { target: null };
}

export function createTimeSource(params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')) {
  const forced = params.get('now');
  const forcedMs = forced ? Date.parse(forced) : NaN;
  if (Number.isFinite(forcedMs)) {
    const base = Date.now();
    return { now: () => forcedMs + (Date.now() - base), forced: true };
  }
  return { now: () => Date.now(), forced: false };
}

/* Fill `el` once a second. Hidden entirely once both events have begun. */
export function mountCountdown(el, events, source, { intervalMs = 1000 } = {}) {
  const pad = (n) => String(n).padStart(2, '0');
  function render() {
    const st = countdownState(source.now(), events);
    if (!st.target) {
      el.hidden = true;
      el.innerHTML = '';
      return st;
    }
    el.hidden = false;
    el.innerHTML = `
      <div class="count-label">Countdown to the ${st.name}</div>
      <div class="count-row" role="timer" aria-live="off">
        <div class="count-cell"><b>${st.days}</b><span>days</span></div>
        <div class="count-cell"><b>${pad(st.hours)}</b><span>hours</span></div>
        <div class="count-cell"><b>${pad(st.minutes)}</b><span>minutes</span></div>
        <div class="count-cell"><b>${pad(st.seconds)}</b><span>seconds</span></div>
      </div>`;
    return st;
  }
  render();
  const id = setInterval(render, intervalMs);
  return { render, stop: () => clearInterval(id) };
}
