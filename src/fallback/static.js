/* static.js — the whole invitation as a plain page, used when the browser
 * cannot draw the scene (no WebGL2, a failed boot, or `?static=1`). The same
 * cards, in order, with both maps inline. It reads fully without any 3D.
 */

import { WEDDING, coupleNames } from '../config/wedding.js';
import { renderIntro, renderInvitation, renderVerse, renderEvent, renderClosing } from '../ui/cards.js';
import { renderRsvp, wireRsvp } from '../ui/rsvp.js';
import { renderContacts } from '../ui/contacts.js';
import { mountMap } from '../ui/maps.js';
import { mountCountdown, createTimeSource } from '../ui/countdown.js';

export function showStatic(root, { reason = '' } = {}) {
  document.documentElement.dataset.mode = 'static';
  root.hidden = false;
  root.innerHTML = `
    <main class="static">
      ${renderIntro()}
      ${renderInvitation()}
      ${renderVerse()}
      <div class="card card-summary">
        <div class="countdown" data-countdown></div>
        ${WEDDING.events.map((ev) => renderEvent(ev, { map: 'inline' })).join('')}
      </div>
      ${renderClosing()}
      <div class="card">
        ${renderRsvp()}
        ${renderContacts()}
      </div>
      <p class="static-note">${reason ? `${reason} ` : ''}${coupleNames(' & ')}, ${WEDDING.events[0].shortDayLabel} and ${WEDDING.events[1].shortDayLabel}.</p>
    </main>`;
  for (const slot of root.querySelectorAll('.map-slot')) {
    const ev = WEDDING.events.find((e) => e.id === slot.dataset.event);
    if (ev) mountMap(slot, ev);
  }
  wireRsvp(root.querySelector('form.rsvp'));
  const cd = root.querySelector('[data-countdown]');
  if (cd) mountCountdown(cd, WEDDING.events, createTimeSource());
}
