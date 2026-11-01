/* music.js — one optional control for the supplied song. The control only
 * appears when the MP3 is actually present, and sound starts only from the
 * guest's own tap. The invitation never waits on it.
 */

import { WEDDING } from '../config/wedding.js';

export async function probeMusic(src = WEDDING.music.src) {
  try {
    const r = await fetch(src, { method: 'HEAD', cache: 'no-store' });
    if (!r.ok) return false;
    const type = (r.headers.get('content-type') || '').toLowerCase();
    return type.startsWith('audio/') || /\.mp3($|\?)/.test(src) && !type.includes('text/html');
  } catch (err) {
    return false;
  }
}

export function createMusic(button, src = WEDDING.music.src) {
  let audio = null;
  let on = false;
  button.hidden = true;
  button.setAttribute('aria-pressed', 'false');
  button.title = `${WEDDING.music.title} by ${WEDDING.music.artist}`;

  async function toggle() {
    if (!audio) {
      audio = new Audio(src);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.7;
    }
    if (on) { audio.pause(); on = false; }
    else {
      try { await audio.play(); on = true; } catch (err) { on = false; }
    }
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.classList.toggle('is-on', on);
    button.querySelector('.label').textContent = on ? 'Music on' : 'Music';
  }

  button.addEventListener('click', toggle);
  probeMusic(src).then((present) => { button.hidden = !present; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && audio && on) { audio.pause(); on = false; button.setAttribute('aria-pressed', 'false'); button.classList.remove('is-on'); button.querySelector('.label').textContent = 'Music'; } });
  return { toggle, get playing() { return on; } };
}
