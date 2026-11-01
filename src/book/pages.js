/* pages.js — the page texture pool, drawn rather than downloaded.
 *
 * Adapted from spring-bloom (js/textures.js, MIT, Abdelrahman Shaaban 2026).
 * The pool's shape is the original's: consumers subscribe to a key such as
 * '03-left' and are called with the texture when it lands, `want(spread)`
 * keeps a window of spreads resident and disposes the rest, and the cover
 * textures live for the whole session. What changed is where a texture comes
 * from. The picture book loaded WebP spreads; this invitation paints every
 * page on a canvas: ivory paper with a seeded grain, a thin double gold rule,
 * corner flourishes and a little decorative lettering (names, a chapter
 * heading, the monogram). Every word a guest must read lives in the HTML
 * layer, never only here.
 */

import * as THREE from 'three';
import { mulberry32 } from '../core/rng.js';
import { WEDDING, coupleNames } from '../config/wedding.js';
import { LEAF_COUNT } from './leaf.js';

export const SPREADS = LEAF_COUNT;        // 0 title, 1 invitation, 2 verse, 3 mehndi, 4 barat, 5 closing
const WINDOW = 2;
const PX_W = 640;
const PX_H = 812;                          // 22 x 28 cm, like the leaf
const PAPER = '#f7f1e4';
const GOLD = '#a8843f';
const GOLD_DEEP = '#8a6a2b';
const INK = '#4a3b26';
const DISPLAY = '"Cormorant Garamond", "Times New Roman", serif';

export const spreadKey = (n, side) => `${String(n).padStart(2, '0')}-${side}`;

/* ---- drawing ------------------------------------------------------------ */

function paper(ctx, w, h, rnd) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  /* a warm vignette toward the gutter side is skipped on purpose: the book's
     real lighting does that */
  for (let i = 0; i < 2600; i += 1) {
    const x = rnd() * w; const y = rnd() * h;
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(120, 95, 60, 0.05)' : 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x, y, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
  }
}

function rule(ctx, x0, y0, x1, y1, inset, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.lineWidth = 0.9;
  ctx.strokeRect(x0 + inset, y0 + inset, x1 - x0 - 2 * inset, y1 - y0 - 2 * inset);
  ctx.restore();
}

/* A small leaf-and-curl flourish at a corner, pointing inward. */
function flourish(ctx, x, y, sx, sy, size = 26) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.4, size * 0.05, size * 0.8, size * 0.35, size, size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.05, size * 0.4, size * 0.35, size * 0.8, size, size);
  ctx.stroke();
  for (const [lx, ly, a] of [[size * 0.45, size * 0.18, -0.4], [size * 0.18, size * 0.45, 0.4 + Math.PI / 2]]) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.16, size * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(size * 0.72, size * 0.72, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function frame(ctx, w, h, { alpha = 1 } = {}) {
  const m = 34;
  rule(ctx, m, m, w - m, h - m, 7, alpha);
  const c = m + 14;
  ctx.save();
  ctx.globalAlpha = alpha;
  flourish(ctx, c, c, 1, 1);
  flourish(ctx, w - c, c, -1, 1);
  flourish(ctx, c, h - c, 1, -1);
  flourish(ctx, w - c, h - c, -1, -1);
  ctx.restore();
}

function centred(ctx, text, x, y, font, color = GOLD_DEEP, spacing = 0) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (spacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function smallRule(ctx, x, y, half) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - half, y); ctx.lineTo(x + half, y); ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* A restrained sprig: a stem with paired leaves, in gold or an accent. */
function sprig(ctx, x, y, h, color, mirror = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(mirror, 1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(h * 0.15, -h * 0.5, 0, -h);
  ctx.stroke();
  for (let i = 1; i <= 4; i += 1) {
    const t = i / 5;
    const px = h * 0.15 * 2 * t * (1 - t);
    const py = -h * t;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(s * 0.9);
      ctx.beginPath();
      ctx.ellipse(s * h * 0.07, 0, h * 0.085, h * 0.032, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

/* What each face carries. Decorative only. */
function drawFace(ctx, key, w, h, rnd) {
  paper(ctx, w, h, rnd);
  const cx = w / 2;
  const names = coupleNames(' & ');
  switch (key) {
    case '00-left':
      frame(ctx, w, h, { alpha: 0.55 });
      centred(ctx, WEDDING.monogram, cx, h * 0.5, `500 64px ${DISPLAY}`, GOLD_DEEP, 6);
      break;
    case '00-right':
      frame(ctx, w, h);
      centred(ctx, names, cx, h * 0.42, `500 58px ${DISPLAY}`, GOLD_DEEP);
      smallRule(ctx, cx, h * 0.50, 70);
      centred(ctx, 'WEDDING INVITATION', cx, h * 0.56, `500 18px ${DISPLAY}`, INK, 5);
      break;
    case '01-left':
      frame(ctx, w, h, { alpha: 0.7 });
      sprig(ctx, cx, h * 0.62, 150, GOLD);
      break;
    case '01-right':
      frame(ctx, w, h);
      centred(ctx, 'Invitation', cx, h * 0.24, `italic 500 44px ${DISPLAY}`, GOLD_DEEP);
      smallRule(ctx, cx, h * 0.31, 60);
      break;
    case '02-left':
      frame(ctx, w, h, { alpha: 0.7 });
      sprig(ctx, cx, h * 0.62, 150, GOLD, -1);
      break;
    case '02-right':
      frame(ctx, w, h);
      centred(ctx, WEDDING.verse.reference, cx, h * 0.24, `500 30px ${DISPLAY}`, GOLD_DEEP, 2);
      smallRule(ctx, cx, h * 0.30, 60);
      break;
    case '03-left':
      frame(ctx, w, h);
      centred(ctx, 'Mehndi', cx, h * 0.26, `500 64px ${DISPLAY}`, GOLD_DEEP);
      smallRule(ctx, cx, h * 0.34, 60);
      sprig(ctx, cx - 10, h * 0.66, 120, WEDDING.events[0].accent);
      break;
    case '03-right':
      frame(ctx, w, h, { alpha: 0.6 });
      break;
    case '04-left':
      frame(ctx, w, h);
      centred(ctx, 'Barat', cx, h * 0.26, `500 64px ${DISPLAY}`, GOLD_DEEP);
      smallRule(ctx, cx, h * 0.34, 60);
      sprig(ctx, cx + 10, h * 0.66, 120, WEDDING.events[1].accent, -1);
      break;
    case '04-right':
      frame(ctx, w, h, { alpha: 0.6 });
      break;
    case '05-left':
      frame(ctx, w, h);
      centred(ctx, WEDDING.monogram, cx, h * 0.46, `500 72px ${DISPLAY}`, GOLD_DEEP, 6);
      smallRule(ctx, cx, h * 0.54, 70);
      centred(ctx, '2026', cx, h * 0.60, `500 24px ${DISPLAY}`, INK, 4);
      break;
    case '05-right':
      frame(ctx, w, h, { alpha: 0.7 });
      sprig(ctx, cx, h * 0.62, 150, GOLD);
      break;
    default:
      frame(ctx, w, h, { alpha: 0.5 });
  }
}

function drawCover(ctx, name, w, h, rnd) {
  const cx = w / 2;
  ctx.fillStyle = '#efe5d0';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i += 1) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(110, 85, 50, 0.06)' : 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  if (name === 'spine') {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w * 0.5, 40); ctx.lineTo(w * 0.5, h - 40); ctx.stroke();
    return;
  }
  const m = 40;
  rule(ctx, m, m, w - m, h - m, 9);
  const c = m + 16;
  flourish(ctx, c, c, 1, 1, 30);
  flourish(ctx, w - c, c, -1, 1, 30);
  flourish(ctx, c, h - c, 1, -1, 30);
  flourish(ctx, w - c, h - c, -1, -1, 30);
  if (name === 'front') {
    centred(ctx, WEDDING.monogram, cx, h * 0.46, `500 128px ${DISPLAY}`, GOLD_DEEP, 10);
    smallRule(ctx, cx, h * 0.57, 90);
    centred(ctx, coupleNames(' & '), cx, h * 0.63, `500 34px ${DISPLAY}`, GOLD_DEEP, 1);
  } else {
    centred(ctx, WEDDING.monogram, cx, h * 0.5, `500 48px ${DISPLAY}`, GOLD, 6);
  }
}

/* ---- the pool ------------------------------------------------------------ */

export function createTexturePool({ renderer, seed = 7 }) {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const entries = new Map();          // key -> { texture, subs:Set, loading }
  const fixed = new Map();            // cover name -> Promise<Texture>
  let wanted = new Set();
  let queue = [];
  let inFlight = 0;
  let windowSize = WINDOW;
  function setKeepAll(on) { windowSize = on ? SPREADS : WINDOW; }

  /* The display face must be resident before a page is drawn, or the canvas
     falls back to a serif the guest never sees again on the next redraw. */
  const fontsReady = (document.fonts && document.fonts.load)
    ? Promise.all([
      document.fonts.load(`500 60px ${DISPLAY}`),
      document.fonts.load(`italic 500 44px ${DISPLAY}`),
    ]).catch(() => null)
    : Promise.resolve(null);

  function prepare(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, maxAniso);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  function paint(key, draw) {
    const c = document.createElement('canvas');
    c.width = PX_W; c.height = PX_H;
    const ctx = c.getContext('2d');
    let h = 0;
    for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    draw(ctx, PX_W, PX_H, mulberry32(seed * 977 + h));
    return prepare(new THREE.CanvasTexture(c));
  }

  function entry(key) {
    if (!entries.has(key)) entries.set(key, { texture: null, subs: new Set(), loading: false });
    return entries.get(key);
  }

  /* Pages are painted one per task so the first frames are not held up by
     a dozen canvases at once. */
  function pump() {
    while (inFlight < 1 && queue.length) {
      const key = queue.shift();
      const e = entries.get(key);
      if (!e || e.texture || e.loading || !wanted.has(key)) continue;
      e.loading = true;
      inFlight += 1;
      fontsReady.then(() => new Promise((r) => setTimeout(r, 0))).then(() => {
        inFlight -= 1;
        e.loading = false;
        if (!wanted.has(key)) { pump(); return; }
        e.texture = paint(key, (ctx, w, h, rnd) => drawFace(ctx, key, w, h, rnd));
        for (const fn of e.subs) fn(e.texture);
        pump();
      });
    }
  }

  function subscribe(key, fn) {
    const e = entry(key);
    e.subs.add(fn);
    if (e.texture) fn(e.texture);
    return () => e.subs.delete(fn);
  }

  function want(spread, toward = spread) {
    const lo = Math.max(0, Math.min(spread, toward) - windowSize);
    const hi = Math.min(SPREADS - 1, Math.max(spread, toward) + windowSize);
    const next = new Set();
    const order = [];
    for (let d = 0; d <= hi - lo; d += 1) {
      for (const n of [spread + d, spread - d]) {
        if (n < lo || n > hi) continue;
        for (const side of ['right', 'left']) {
          const key = spreadKey(n, side);
          if (next.has(key)) continue;
          next.add(key);
          order.push(key);
        }
      }
    }
    for (const [key, e] of entries) {
      if (next.has(key) || !e.texture) continue;
      e.texture.dispose();
      e.texture = null;
      for (const fn of e.subs) fn(null);
    }
    wanted = next;
    queue = order.filter((key) => !entry(key).texture);
    pump();
  }

  function ready(keys) {
    return Promise.all(keys.map((key) => new Promise((resolve) => {
      const e = entry(key);
      if (e.texture) { resolve(e.texture); return; }
      const off = subscribe(key, (tex) => { if (tex) { off(); resolve(tex); } });
    })));
  }

  /* The three cover faces, painted once and never disposed. */
  function cover(name) {
    if (!fixed.has(name)) {
      fixed.set(name, fontsReady.then(() => paint(`cover-${name}`, (ctx, w, h, rnd) => drawCover(ctx, name, w, h, rnd))));
    }
    return fixed.get(name);
  }

  function resident() {
    const out = [];
    for (const [key, e] of entries) if (e.texture) out.push(key);
    return out;
  }

  function idle() {
    return new Promise((resolve) => {
      const check = () => { if (!inFlight && !queue.length) resolve(); else setTimeout(check, 30); };
      check();
    });
  }

  return { subscribe, want, ready, cover, resident, idle, prepare, setKeepAll, fontsReady };
}
