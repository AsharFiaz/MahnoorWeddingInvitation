/* Writes public/calendar/<event>.ics from config/wedding.js using the same
   functions the page uses for the Google Calendar link. Run: node scripts/make-calendar.mjs */
import { writeFileSync, mkdirSync } from 'node:fs';
import { WEDDING, coupleNames } from '../src/config/wedding.js';
import { icsFor } from '../src/ui/calendar.js';

mkdirSync(new URL('../public/calendar/', import.meta.url), { recursive: true });
for (const ev of WEDDING.events) {
  const out = new URL(`../public/calendar/${ev.id}.ics`, import.meta.url);
  writeFileSync(out, icsFor(ev, coupleNames(' & ', { full: true })));
  console.log('wrote', out.pathname);
}
