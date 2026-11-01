/* storyboard.js — the invitation's running order, with holds sized to the
 * text each card carries. Times are book seconds; every number here can be
 * tuned without touching any other module.
 *
 * Order: Bismillah, names and dates over the miniature setting; the approach
 * to the book; the cover; the invitation wording; the verse; Mehndi; Barat;
 * the family's closing lines; the permanent summary.
 */

import { WEDDING } from '../config/wedding.js';

const TURN = 0.9;             // a page turn (book/turn.js)
const FOLD = 0.6;             // pieces folding before a turn (popup/popup.js)
const SETTLE_TO_CARD = 0.5;   // a breath after the leaf lands before the card appears

const words = (s) => String(s).trim().split(/\s+/).length;
/* About 2.6 words a second for unfamiliar names and places, plus a margin
   to find the card and settle. Never shorter than `min`. */
const hold = (text, min) => Math.max(min, words(text) / 2.6 + 2.5);

export const HOLDS = {
  intro: 7.5,
  approach: 2.6,
  title: 3.2,
  invitation: hold(WEDDING.invitation, 11),
  verse: hold(`${WEDDING.verse.translation} ${WEDDING.verse.arabic}`, 14),
  mehndi: 19,
  barat: 19,
  closing: hold(WEDDING.closing.join(' '), 9),
};

export function buildStoryboard() {
  const ev = [];
  let t = 0;
  const at = (dt, e) => { t += dt; ev.push({ t: +t.toFixed(2), ...e }); return t; };

  /* 1. Bismillah, names, dates. The camera rests on the establishing shot. */
  ev.push({ t: 0, do: 'phase', id: 'intro' });
  ev.push({ t: 0.6, do: 'caption', id: 'intro' });

  /* 2. The approach: the card fades, the camera swoops down to the book. */
  at(HOLDS.intro, { do: 'caption', id: null });
  ev.push({ t: +t.toFixed(2), do: 'phase', id: 'approach' });
  ev.push({ t: +t.toFixed(2), do: 'pose', kind: 'closed', dur: HOLDS.approach });

  /* 3. The cover opens (the camera flies to the title pose on its own). */
  at(HOLDS.approach + 0.3, { do: 'openCover' });
  ev.push({ t: +(t + 0.2).toFixed(2), do: 'phase', id: 'book' });

  /* A page. The caption lands a breath after the leaf settles. */
  const page = (id, holdS) => {
    at(TURN + FOLD + SETTLE_TO_CARD, { do: 'caption', id });
    at(holdS, { do: 'caption', id: null });
    ev.push({ t: +t.toFixed(2), do: 'next' });
  };

  /* 4. Title spread: the names on the page, no card. */
  at(1.1 + HOLDS.title, { do: 'next' });
  page('invitation', HOLDS.invitation);
  page('verse', HOLDS.verse);
  page('mehndi', HOLDS.mehndi);
  page('barat', HOLDS.barat);
  /* the closing spread is the last page: no turn after it */
  at(TURN + FOLD + SETTLE_TO_CARD, { do: 'caption', id: 'closing' });
  at(HOLDS.closing, { do: 'pose', kind: 'home', dur: 1.4 });
  const end = +(t + 0.8).toFixed(2);

  return { events: ev, end };
}
