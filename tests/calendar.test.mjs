import { test } from 'node:test';
import assert from 'node:assert/strict';
import { icsFor, googleCalendarUrl, toUtcStamp } from '../src/ui/calendar.js';
import { WEDDING } from '../src/config/wedding.js';

test('UTC stamps convert the +05:00 interval correctly', () => {
  assert.equal(toUtcStamp('2026-12-26T19:00:00+05:00'), '20261226T140000Z');
  assert.equal(toUtcStamp('2026-12-26T22:00:00+05:00'), '20261226T170000Z');
});

test('the Mehndi ics carries the venue and the dinner time', () => {
  const ics = icsFor(WEDDING.events[0], 'Mahnoor Fiaz & Shirza Hashmi');
  assert.match(ics, /DTSTART:20261226T140000Z/);
  assert.match(ics, /DTEND:20261226T170000Z/);
  assert.match(ics, /Elegance Marquee/);
  assert.match(ics, /Dinner: 9:00 pm/);
  assert.doesNotMatch(ics, /Rukhsati/);
  assert.doesNotMatch(ics, /Walima/);
});

test('the Barat ics carries the Rukhsati', () => {
  const ics = icsFor(WEDDING.events[1], 'Mahnoor Fiaz & Shirza Hashmi');
  assert.match(ics, /DTSTART:20261227T140000Z/);
  assert.match(ics, /Zircon Marquee/);
  assert.match(ics, /Rukhsati: 10:00 pm/);
});

test('the Google Calendar link uses the same interval and the Karachi zone', () => {
  const url = new URL(googleCalendarUrl(WEDDING.events[1], 'Mahnoor Fiaz & Shirza Hashmi'));
  assert.equal(url.searchParams.get('dates'), '20261227T140000Z/20261227T170000Z');
  assert.equal(url.searchParams.get('ctz'), 'Asia/Karachi');
  assert.match(url.searchParams.get('location'), /Kuri Road/);
});
