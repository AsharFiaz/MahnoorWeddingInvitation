/* music.js — the supplied song, on by default, with one control to turn it
 * off. The control only appears when the MP3 is actually present.
 *
 * Browsers do not let a page play sound before the guest has touched it, so
 * the song is started at once where that is allowed and otherwise at the
 * guest's first tap or key press anywhere on the page. Turning it off with
 * the button cancels that pending start. The invitation itself never waits
 * on any of this.
 */

import { WEDDING } from '../config/wedding.js';

export async function probeMusic(src = WEDDING.music.src) {
  try {
    const r = await fetch(src, { method: 'HEAD', cache: 'no-store' });
    if (!r.ok) return false;
    const type = (r.headers.get('content-type') || '').toLowerCase();
    return type.startsWith('audio/') || (/\.mp3($|\?)/.test(src) && !type.includes('text/html'));
  } catch (err) {
    return false;
  }
}

export function createMusic(button, src = WEDDING.music.src, { autoplay = WEDDING.music.autoplay !== false } = {}) {
  let audio = null;
  let on = false;
  let wantOn = autoplay;        // what the guest wants; the browser may lag behind
  let armed = false;            // a first-gesture start is waiting
  button.hidden = true;
  button.title = `${WEDDING.music.title} by ${WEDDING.music.artist}`;

  function label() {
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.classList.toggle('is-on', on);
    button.querySelector('.label').textContent = on ? 'Music on' : 'Music off';
    button.title = on ? 'Turn the music off' : 'Turn the music on';
  }

  function ensure() {
    if (audio) return audio;
    audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.7;
    return audio;
  }

  async function play() {
    try {
      await ensure().play();
      on = true;
    } catch (err) {
      on = false;
    }
    label();
    return on;
  }

  function pause() {
    if (audio) audio.pause();
    on = false;
    label();
  }

  /* The first gesture anywhere on the page starts the song, if the guest
     has not turned it off in the meantime. */
  const GESTURES = ['pointerdown', 'touchend', 'keydown'];
  function onGesture() {
    disarm();
    if (wantOn && !on) play();
  }
  function arm() {
    if (armed) return;
    armed = true;
    for (const g of GESTURES) window.addEventListener(g, onGesture, { capture: true, passive: true });
  }
  function disarm() {
    if (!armed) return;
    armed = false;
    for (const g of GESTURES) window.removeEventListener(g, onGesture, { capture: true });
  }

  async function toggle() {
    wantOn = !on;
    if (wantOn) await play(); else { pause(); disarm(); }
  }

  button.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });

  probeMusic(src).then(async (present) => {
    button.hidden = !present;
    if (!present) return;
    label();
    if (!wantOn) return;
    const started = await play();
    if (!started) arm();
  });

  document.addEventListener('visibilitychange', () => {
    if (!audio) return;
    if (document.hidden) { if (on) { audio.pause(); on = false; label(); } }
    else if (wantOn && !on) play().then((ok) => { if (!ok) arm(); });
  });

  return { toggle, play, pause, get playing() { return on; } };
}
