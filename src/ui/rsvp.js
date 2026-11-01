/* rsvp.js — an optional RSVP that opens WhatsApp with a prewritten message
 * to Ashar. No database and nothing is sent until the guest presses Send in
 * WhatsApp itself. The invitation never depends on this form.
 */

import { WEDDING, coupleNames } from '../config/wedding.js';

export function buildMessage({ name, guests, events, note }) {
  const names = events.map((id) => WEDDING.events.find((e) => e.id === id)?.name).filter(Boolean);
  const lines = [
    `Assalamu alaikum ${WEDDING.rsvp.recipient}, this is ${name.trim()}.`,
    `RSVP for the wedding of ${coupleNames(' and ', { full: true })}.`,
    `Guests: ${guests}.`,
    `Attending: ${names.join(' and ')}.`,
  ];
  if (note && note.trim()) lines.push(`Message: ${note.trim()}`);
  return lines.join('\n');
}

export function whatsappUrl(message) {
  return `https://wa.me/${WEDDING.rsvp.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/* Returns an error string, or null when the form is valid. */
export function validate({ name, guests, events }) {
  if (!name || !name.trim()) return 'Please enter your name.';
  const n = Number(guests);
  if (!Number.isInteger(n) || n < 1 || n > WEDDING.rsvp.maxGuests) return `Number of guests must be a whole number from 1 to ${WEDDING.rsvp.maxGuests}.`;
  if (!events || events.length === 0) return 'Please choose Mehndi, Barat, or both.';
  return null;
}

export function renderRsvp() {
  const max = WEDDING.rsvp.maxGuests;
  const opts = Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
  return `
  <form class="rsvp" novalidate>
    <h3 class="card-h3">RSVP on WhatsApp</h3>
    <p class="muted">Optional. This opens WhatsApp with a message to ${WEDDING.rsvp.recipient}; nothing is sent until you press Send.</p>
    <label class="field"><span>Your name</span><input name="name" type="text" autocomplete="name" required maxlength="80"></label>
    <label class="field"><span>Number of guests</span><select name="guests">${opts}</select></label>
    <fieldset class="field choices"><legend>Attending</legend>
      <label><input type="checkbox" name="events" value="mehndi" checked> Mehndi</label>
      <label><input type="checkbox" name="events" value="barat" checked> Barat</label>
    </fieldset>
    <label class="field"><span>Message (optional)</span><textarea name="note" rows="2" maxlength="300"></textarea></label>
    <p class="rsvp-error" role="alert" hidden></p>
    <button type="submit" class="btn btn-primary">Open WhatsApp</button>
  </form>`;
}

export function wireRsvp(form) {
  if (!form) return;
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || ''),
      guests: Number(data.get('guests')),
      events: data.getAll('events').map(String),
      note: String(data.get('note') || ''),
    };
    const err = form.querySelector('.rsvp-error');
    const problem = validate(payload);
    if (problem) {
      err.textContent = problem;
      err.hidden = false;
      return;
    }
    err.hidden = true;
    const url = whatsappUrl(buildMessage(payload));
    const w = window.open(url, '_blank', 'noopener');
    if (!w) location.href = url;
  });
}
