import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countdownState } from '../src/ui/countdown.js';
import { WEDDING } from '../src/config/wedding.js';

const T = (iso) => Date.parse(iso);

test('before the Mehndi it counts down to the Mehndi', () => {
  const st = countdownState(T('2026-12-01T12:00:00+05:00'), WEDDING.events);
  assert.equal(st.target, 'mehndi');
  assert.equal(st.days, 25);
  assert.equal(st.hours, 7);
});

test('one second before the Mehndi start it still targets the Mehndi', () => {
  const st = countdownState(T('2026-12-26T18:59:59+05:00'), WEDDING.events);
  assert.equal(st.target, 'mehndi');
  assert.equal(st.seconds, 1);
});

test('at the Mehndi start it switches to the Barat', () => {
  const st = countdownState(T('2026-12-26T19:00:00+05:00'), WEDDING.events);
  assert.equal(st.target, 'barat');
  assert.equal(st.days, 1);
  assert.equal(st.hours, 0);
});

test('after the Barat starts there is no countdown', () => {
  assert.equal(countdownState(T('2026-12-27T19:00:00+05:00'), WEDDING.events).target, null);
  assert.equal(countdownState(T('2027-01-01T00:00:00+05:00'), WEDDING.events).target, null);
});

test('the event instants are fixed in Pakistan time regardless of the host zone', () => {
  assert.equal(Date.parse(WEDDING.events[0].start), Date.parse('2026-12-26T14:00:00Z'));
  assert.equal(Date.parse(WEDDING.events[1].start), Date.parse('2026-12-27T14:00:00Z'));
});
