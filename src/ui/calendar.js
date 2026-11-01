/* calendar.js — Add to Calendar: a Google Calendar link and an .ics file
 * for each event, both in the real 7:00 pm to 10:00 pm Pakistan-time
 * interval. The .ics files are generated into public/calendar/ by
 * scripts/make-calendar.mjs from the same functions, so the two can never
 * disagree.
 */

/* 2026-12-26T19:00:00+05:00 -> 20261226T140000Z */
export function toUtcStamp(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

export function eventSummary(event, couple) {
  return `${event.name}: ${couple}`;
}

export function eventDescription(event) {
  const lines = [
    `${event.name}, ${event.dayLabel}, ${event.timeLabel} (Pakistan time).`,
    `Dinner: ${event.dinner}.`,
  ];
  if (event.rukhsati) lines.push(`Rukhsati: ${event.rukhsati}.`);
  lines.push(`Venue: ${event.venue}.`);
  lines.push(`Google Maps listing: ${event.mapsAddress}.`);
  lines.push(`Directions: ${event.directions}`);
  return lines.join('\n');
}

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function fold(line) {
  /* RFC 5545: lines over 75 octets are folded with CRLF + space */
  const out = [];
  let s = line;
  while (s.length > 73) { out.push(s.slice(0, 73)); s = ` ${s.slice(73)}`; }
  out.push(s);
  return out.join('\r\n');
}

export function icsFor(event, couple, { uidHost = 'mahnoor-shirza-wedding' } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mahnoor and Shirza Wedding//Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}-2026@${uidHost}`,
    `DTSTAMP:${toUtcStamp('2026-11-01T00:00:00Z')}`,
    `DTSTART:${toUtcStamp(event.start)}`,
    `DTEND:${toUtcStamp(event.end)}`,
    `SUMMARY:${icsEscape(eventSummary(event, couple))}`,
    `DESCRIPTION:${icsEscape(eventDescription(event))}`,
    `LOCATION:${icsEscape(`${event.venue} (${event.mapsAddress})`)}`,
    `URL:${event.directions}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

export function googleCalendarUrl(event, couple) {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventSummary(event, couple),
    dates: `${toUtcStamp(event.start)}/${toUtcStamp(event.end)}`,
    details: eventDescription(event),
    location: `${event.venue} (${event.mapsAddress})`,
    ctz: 'Asia/Karachi',
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export const icsPath = (event) => `/calendar/${event.id}.ics`;
