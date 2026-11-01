/* overlay.js — the HTML layer over the canvas: the reading panel that shows
 * each card as the timeline asks for it, and the small set of optional
 * controls (details, pause, replay, music). Nothing here gates the
 * invitation; the timeline runs whether or not a guest touches anything.
 */

import { WEDDING } from '../config/wedding.js';
import { CARDS } from './cards.js';
import { mountMap, unmountMap } from './maps.js';
import { wireRsvp } from './rsvp.js';
import { mountCountdown, createTimeSource } from './countdown.js';
import { createMusic } from './music.js';

const FADE_MS = 420;

export function createOverlay(api, root) {
  root.innerHTML = `
    <div class="topbar">
      <button type="button" class="pill pill-details" data-action="details">Event details</button>
      <div class="topbar-right">
        <button type="button" class="pill pill-icon" data-action="pause" aria-pressed="false" title="Pause"><span class="label">Pause</span></button>
        <button type="button" class="pill pill-icon" data-action="replay" title="Replay from the start"><span class="label">Replay</span></button>
        <button type="button" class="pill pill-icon pill-music" data-action="music" title="Music"><span class="label">Music</span></button>
      </div>
    </div>
    <div class="panel" aria-live="polite"><div class="panel-inner"></div></div>
    <div class="progress" aria-hidden="true"><i></i></div>
  `;
  const panel = root.querySelector('.panel');
  const inner = root.querySelector('.panel-inner');
  const progress = root.querySelector('.progress i');
  const pauseBtn = root.querySelector('[data-action="pause"]');
  const detailsBtn = root.querySelector('[data-action="details"]');
  const musicBtn = root.querySelector('[data-action="music"]');

  let current = null;
  let countdown = null;
  const timeSource = createTimeSource();

  function clearCard() {
    for (const slot of inner.querySelectorAll('.map-slot')) unmountMap(slot);
    if (countdown) { countdown.stop(); countdown = null; }
    inner.innerHTML = '';
  }

  function fill(id) {
    clearCard();
    const render = CARDS[id];
    if (!render) return;
    inner.innerHTML = render();
    panel.dataset.card = id;
    /* chapter cards carry their map inline, created now and removed when
       the card leaves */
    for (const slot of inner.querySelectorAll('.map-slot:not([hidden])')) {
      const ev = WEDDING.events.find((e) => e.id === slot.dataset.event);
      if (ev) mountMap(slot, ev);
    }
    for (const btn of inner.querySelectorAll('.map-toggle')) {
      btn.addEventListener('click', () => {
        const ev = WEDDING.events.find((e) => e.id === btn.dataset.event);
        const slot = inner.querySelector(`.map-slot[data-event="${btn.dataset.event}"]`);
        const open = slot.hidden;
        slot.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.textContent = open ? 'Hide map' : 'Show map';
        if (open) mountMap(slot, ev); else unmountMap(slot);
      });
    }
    wireRsvp(inner.querySelector('form.rsvp'));
    const cd = inner.querySelector('[data-countdown]');
    if (cd) countdown = mountCountdown(cd, WEDDING.events, timeSource);
    inner.scrollTop = 0;
  }

  let fadeTimer = 0;
  function show(id) {
    if (id === current) return;
    current = id;
    clearTimeout(fadeTimer);
    if (!id) {
      panel.classList.remove('is-visible');
      fadeTimer = setTimeout(() => { if (!current) clearCard(); }, FADE_MS);
      return;
    }
    if (panel.classList.contains('is-visible')) {
      panel.classList.remove('is-visible');
      fadeTimer = setTimeout(() => { fill(id); panel.classList.add('is-visible'); }, FADE_MS * 0.6);
    } else {
      fill(id);
      /* a forced style flush, not a frame callback: the transition still
         runs, and the card appears even where frames are throttled */
      void panel.offsetWidth;
      panel.classList.add('is-visible');
    }
  }

  /* ---- controls --------------------------------------------------------- */

  function setPaused(p) {
    api.clock.paused = p;
    pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
    pauseBtn.querySelector('.label').textContent = p ? 'Play' : 'Pause';
    pauseBtn.title = p ? 'Continue' : 'Pause';
    root.classList.toggle('is-paused', p);
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'pause') setPaused(!api.clock.paused);
    if (action === 'details') { setPaused(false); api.tour.finish(); }
    if (action === 'replay') { api.tour.replay(); setPaused(false); }
  });

  createMusic(musicBtn);

  api.events.on('caption', ({ id }) => show(id));
  api.events.on('phase', ({ id }) => {
    root.dataset.phase = id;
    const atSummary = id === 'summary';
    detailsBtn.hidden = atSummary;
    pauseBtn.hidden = atSummary;
  });

  function update(time) {
    if (api.tour && api.tour.end) {
      const k = Math.min(1, time / api.tour.end);
      progress.style.transform = `scaleX(${k.toFixed(4)})`;
    }
  }

  return { show, update, setPaused, get current() { return current; } };
}
