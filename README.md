# Mahnoor & Shirza | Wedding Invitation

A wedding invitation website for Mahnoor Fiaz and Shirza Hashmi: a miniature
cream-and-gold setting, an ivory book with the monogram M & S that opens and
turns its pages by itself, and small ceremony scenes that rise from the
Mehndi and Barat pages. Every essential detail is ordinary HTML beside the
scene, so a guest opening a WhatsApp link on a phone reads it without
scrolling, tapping or finding anything.

## Run it

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173/. `npm run build` writes `dist/`; `npm run preview`
serves that build. `npm test` runs the countdown, calendar and RSVP checks.

## Edit the wedding information

Everything is in [`src/config/wedding.js`](src/config/wedding.js): names and
the display order, the Arabic passages and translations, the invitation and
closing wording, both events (date labels, times, dinner, Rukhsati, venue
display name, Google Maps listing address, directions link, embed link, ISO
start and end with the +05:00 offset), the RSVP WhatsApp number, contacts,
the music file path and the sharing text. After changing an event, run
`node scripts/make-calendar.mjs` to regenerate the `.ics` files in
`public/calendar/`.

Two switches live there too:

- `nameOrder`: `'bride-first'` (Mahnoor & Shirza) or `'groom-first'`.
- `share.image`: `'names'` to use the names-in-gold preview image, `'none'`
  for text only.

## Music

The MP3 is at `public/audio/until-i-found-you.mp3`; if it is removed the
Music control disappears. With `music.autoplay` on (the default) the song
starts by itself where the browser allows and otherwise at the guest's first
tap anywhere on the page, since phones refuse sound before a touch. The
top-right button turns it off and on. Set `autoplay: false` for the older
behaviour, where nothing plays until the button is pressed.

## URL switches (for checking)

| Switch | Effect |
|---|---|
| `?now=2026-12-26T19:00:00+05:00` | The countdown's idea of the present. Before the Mehndi it counts to the Mehndi; from the Mehndi start it counts to the Barat; from the Barat start it is hidden. |
| `?reduced=1` | Reduced motion: no cinematic, the book lies open with the summary on screen. |
| `?static=1` | The plain invitation with no 3D (also shown automatically when WebGL2 is missing or the scene fails). |
| `?t=<seconds>` | Render one frame of the cinematic at that time and hold it. |
| `?seed=<n>` | The seed for paper grain, lawn scatter and petals. |

## How it fits together

One renderer, one scene, one clock. `src/timeline/storyboard.js` lists the
running order and holds; `src/timeline/tour.js` fires them as book time
passes; the camera ledger, the cover, the page turns, the rising pieces and
the HTML cards all answer to that time. See `CREDITS.md` for the adapted
sources and `docs/DEPLOY.md` for publishing.

```
src/config      wedding.js, the single source of wedding information
src/core        clock, events, viewport, seeded rng
src/book        leaf, book, turn, canvas-drawn pages
src/camera      camera rig and the pose ledger
src/world       renderer, lighting, sky, lawn, string lights, petals, pavilion, reveal
src/popup       paper-craft pieces, chapter definitions, rise-and-fold scheduler
src/timeline    storyboard and autopilot
src/ui          cards, overlay, countdown, calendar, maps, RSVP, contacts, music
src/fallback    the static invitation
```
