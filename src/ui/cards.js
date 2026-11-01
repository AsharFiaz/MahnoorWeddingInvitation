/* cards.js — the HTML the guest reads: every card of the cinematic and the
 * same blocks again for the summary and the static fallback. All wording
 * comes from config/wedding.js, verbatim.
 */

import { WEDDING, coupleNames } from '../config/wedding.js';
import { googleCalendarUrl, icsPath } from './calendar.js';
import { renderRsvp } from './rsvp.js';
import { renderContacts } from './contacts.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function arabicBlock(arabic, translation, reference) {
  return `
    <p class="arabic" lang="ar" dir="rtl">${esc(arabic)}</p>
    <p class="translation">${esc(translation)}</p>
    ${reference ? `<p class="reference">${esc(reference)}</p>` : ''}`;
}

/* The opening card: Bismillah and the names only. The dates and venues are
   kept for their own pages, so the invitation unfolds in order. */
export function renderIntro() {
  return `
  <div class="card card-intro">
    ${arabicBlock(WEDDING.bismillah.arabic, WEDDING.bismillah.translation)}
    <h1 class="names">${esc(coupleNames(' & '))}</h1>
    <p class="eyebrow eyebrow-after">Wedding Invitation</p>
  </div>`;
}

export function renderInvitation() {
  return `
  <div class="card card-invitation">
    <p class="invitation">${esc(WEDDING.invitation)}</p>
  </div>`;
}

export function renderVerse() {
  return `
  <div class="card card-verse">
    ${arabicBlock(WEDDING.verse.arabic, WEDDING.verse.translation, WEDDING.verse.reference)}
  </div>`;
}

/* One event's details. `map`: 'inline' mounts the embed below the details
   (the chapter cards), 'toggle' adds a Show map button (the summary), 'none'
   leaves it out (the static fallback still shows both, inline). */
export function renderEvent(ev, { map = 'inline', heading = 'h2' } = {}) {
  const couple = coupleNames(' & ', { full: true });
  return `
  <section class="event event-${ev.id}" style="--accent:${ev.accent}" aria-labelledby="ev-${ev.id}-${map}">
    <${heading} class="event-name" id="ev-${ev.id}-${map}"><span class="accent-dot" aria-hidden="true"></span>${esc(ev.name)}</${heading}>
    <dl class="event-facts">
      <div><dt>Date</dt><dd>${esc(ev.dayLabel)}</dd></div>
      <div><dt>Time</dt><dd>${esc(ev.timeLabel)}</dd></div>
      <div><dt>Dinner</dt><dd>${esc(ev.dinner)}</dd></div>
      ${ev.rukhsati ? `<div><dt>Rukhsati</dt><dd>${esc(ev.rukhsati)}</dd></div>` : ''}
      <div><dt>Venue</dt><dd>${esc(ev.venue)}</dd></div>
      <div class="facts-small"><dt>Google Maps listing</dt><dd>${esc(ev.mapsAddress)}</dd></div>
    </dl>
    <div class="event-actions">
      <a class="btn btn-primary" href="${ev.directions}" target="_blank" rel="noopener">Get Directions</a>
      <a class="btn btn-ghost" href="${icsPath(ev)}" download="${ev.id}-${esc(couple).replace(/[^A-Za-z]+/g, '-')}.ics">Add to Calendar</a>
      <a class="btn btn-ghost btn-small" href="${googleCalendarUrl(ev, couple)}" target="_blank" rel="noopener">Google Calendar</a>
      ${map === 'toggle' ? `<button type="button" class="btn btn-ghost map-toggle" data-event="${ev.id}" aria-expanded="false">Show map</button>` : ''}
    </div>
    ${map !== 'none' ? `<div class="map-slot" data-event="${ev.id}" ${map === 'toggle' ? 'hidden' : ''}></div>` : ''}
  </section>`;
}

export function renderClosing() {
  return `
  <div class="card card-closing">
    ${WEDDING.closing.map((line, i) => `<p class="closing-line closing-${i}">${esc(line)}</p>`).join('')}
  </div>`;
}

export function renderSummary({ withRsvp = true } = {}) {
  return `
  <div class="card card-summary">
    <header class="summary-head">
      <p class="eyebrow">Wedding Invitation</p>
      <h2 class="names names-small">${esc(coupleNames(' & '))}</h2>
      <p class="invitation small">${esc(WEDDING.invitation)}</p>
    </header>
    <div class="countdown" data-countdown></div>
    ${WEDDING.events.map((ev) => renderEvent(ev, { map: 'toggle', heading: 'h3' })).join('')}
    ${withRsvp ? renderRsvp() : ''}
    ${renderContacts()}
    <footer class="summary-foot">
      ${WEDDING.closing.map((line) => `<p>${esc(line)}</p>`).join('')}
    </footer>
  </div>`;
}

export const CARDS = {
  intro: renderIntro,
  invitation: renderInvitation,
  verse: renderVerse,
  mehndi: () => `<div class="card card-event">${renderEvent(WEDDING.events[0], { map: 'inline' })}</div>`,
  barat: () => `<div class="card card-event">${renderEvent(WEDDING.events[1], { map: 'inline' })}</div>`,
  closing: renderClosing,
  summary: renderSummary,
};
