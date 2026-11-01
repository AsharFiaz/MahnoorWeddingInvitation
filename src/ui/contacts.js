/* contacts.js — Call and WhatsApp actions for the supplied numbers. */

import { WEDDING } from '../config/wedding.js';

export function renderContacts() {
  return `
  <div class="contacts">
    <h3 class="card-h3">Contact</h3>
    ${WEDDING.contacts.map((c) => `
      <div class="contact">
        <div class="contact-name">${c.name}</div>
        <div class="contact-number">${c.display}</div>
        <div class="contact-actions">
          <a class="btn btn-ghost" href="tel:${c.e164}" aria-label="Call ${c.name} on ${c.display}">Call</a>
          <a class="btn btn-ghost" href="https://wa.me/${c.e164.replace('+', '')}" target="_blank" rel="noopener" aria-label="WhatsApp ${c.name} on ${c.display}">WhatsApp</a>
        </div>
      </div>`).join('')}
  </div>`;
}
