import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, buildMessage, whatsappUrl } from '../src/ui/rsvp.js';

test('validation rejects a missing name, bad counts and no event', () => {
  assert.ok(validate({ name: '', guests: 2, events: ['mehndi'] }));
  assert.ok(validate({ name: 'A', guests: 0, events: ['mehndi'] }));
  assert.ok(validate({ name: 'A', guests: 11, events: ['mehndi'] }));
  assert.ok(validate({ name: 'A', guests: 2.5, events: ['mehndi'] }));
  assert.ok(validate({ name: 'A', guests: 2, events: [] }));
  assert.equal(validate({ name: 'Amna', guests: 10, events: ['barat'] }), null);
});

test('the WhatsApp link goes to Ashar with an encoded message', () => {
  const msg = buildMessage({ name: 'Amna & family', guests: 3, events: ['mehndi', 'barat'], note: 'See you there!' });
  const url = new URL(whatsappUrl(msg));
  assert.equal(url.origin + url.pathname, 'https://wa.me/923120874969');
  const text = url.searchParams.get('text');
  assert.match(text, /Amna & family/);
  assert.match(text, /Guests: 3/);
  assert.match(text, /Mehndi and Barat/);
  assert.match(text, /See you there!/);
  assert.ok(!url.search.includes(' '));
});
