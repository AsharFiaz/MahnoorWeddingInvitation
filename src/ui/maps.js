/* maps.js — each event's exact Google Maps embed, created only when its
 * panel is on screen and removed when it leaves, so the cinematic never
 * carries idle map instances. The iframe sits in a wrapper that swallows
 * scroll and pinch only while a guest is deliberately touching the map.
 */

export function mountMap(container, event) {
  if (!container || container.querySelector('iframe')) return;
  const wrap = document.createElement('div');
  wrap.className = 'map-wrap';
  const iframe = document.createElement('iframe');
  iframe.src = event.embed;
  iframe.title = `Map of ${event.venue}`;
  /* eager: the slot is only ever created while its card is on screen */
  iframe.loading = 'eager';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.allowFullscreen = true;
  iframe.setAttribute('aria-label', `Google Maps: ${event.venue}`);
  /* A cover sits over the map until the guest taps it, so a thumb scrolling
     the panel cannot be caught by the map. */
  const cover = document.createElement('button');
  cover.type = 'button';
  cover.className = 'map-cover';
  cover.textContent = 'Tap to use the map';
  cover.addEventListener('click', () => { cover.remove(); wrap.classList.add('is-live'); });
  wrap.append(iframe, cover);
  container.appendChild(wrap);
}

export function unmountMap(container) {
  if (!container) return;
  const wrap = container.querySelector('.map-wrap');
  if (wrap) wrap.remove();
}
