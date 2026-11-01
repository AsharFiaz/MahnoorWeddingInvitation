/* popup.js — the pieces that rise from the page, on spring-bloom's clock.
 *
 * Adapted from spring-bloom (js/popup.js, MIT, Abdelrahman Shaaban 2026).
 * Kept: the time-driven state (a pose at book time t is a function of t and
 * a short record list of rise, fold and snap entries, so a seek lands on the
 * right pose), the rise schedule by `order` with a stagger inside each
 * order, the back.out overshoot on the way up, the fold that runs the rise
 * backwards and answers `beforeTurn` with its duration, the blob shadow
 * under each standing piece, the gentle breathing once a piece is up, and
 * the hook on scene.onBeforeRender so no change to the frame loop is needed.
 * Changed: a piece is a 3D group from popup/chapters.js standing on its foot
 * rather than a textured cut-out hinged on its box, so the rise is a scale
 * from the foot (rainy-study's fold) with a small lean that settles, there
 * are no plates, picking, labels, sparkles or petals, and the recipes are
 * code rather than JSON.
 */

import * as THREE from 'three';
import { PAGE_W, PAGE_H, LEAF_COUNT } from '../book/leaf.js';
import { restY, BOARD_T } from '../book/book.js';
import { buildChapter, CHAPTERS } from './chapters.js';
import { sway } from './pieces.js';

export const RISE_END = 1.3;
export const FOLD_S = 0.6;
const STAGGER = 0.08;
const SHADOW_LIFT = 0.002;
const SHADOW_OPACITY = 0.32;
const BACK_S = 1.2;
const MAX_RECORDS = 32;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (k) => k * k * (3 - 2 * k);
const backOut = (k) => { const u = k - 1; return 1 + (BACK_S + 1) * u * u * u + BACK_S * u * u; };

function pageTop(s, side) {
  const k = side === 'left' ? s - 1 : s;
  if (k < 0) return BOARD_T;
  return restY(Math.min(k, LEAF_COUNT - 1), s);
}

function blobTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* Rise windows per piece, in seconds from the settle: spring-bloom's schedule. */
function schedule(pieces) {
  const seen = new Map();
  for (const L of pieces) {
    const o = Math.max(0, Math.round(L.order || 0));
    const i = seen.get(o) || 0;
    seen.set(o, i + 1);
    let t0; let dur;
    if (o === 0) { t0 = 0.1; dur = 0.7; }
    else if (o === 1) { t0 = 0.35 + STAGGER * i; dur = 0.55; }
    else if (o <= 3) { t0 = 0.6 + STAGGER * i; dur = 0.5; }
    else { t0 = 0.9 + STAGGER * i; dur = 0.4; }
    const t1 = Math.min(RISE_END, t0 + dur);
    L.t0 = Math.min(t0, t1 - 0.15);
    L.t1 = t1;
  }
}

export function init(api) {
  const { scene, events, book } = api;
  const reduced = !!api.reduced;

  const root = new THREE.Group();
  root.name = 'popups';
  book.group.add(root);

  const shadowGeo = new THREE.PlaneGeometry(1, 1);
  const shadowTex = blobTexture();
  const entries = new Map();   // spread -> { group, pieces, wind, built }

  function entryFor(n) {
    if (entries.has(n)) return entries.get(n);
    const e = { spread: n, group: null, pieces: [], wind: [], built: false };
    entries.set(n, e);
    if (!CHAPTERS[n]) return e;
    const group = new THREE.Group();
    group.name = `popup-${n}`;
    group.visible = false;
    root.add(group);
    const { pieces, wind } = buildChapter(n, group);
    for (const L of pieces) {
      const x = (L.at[0] * 2 - 1) * PAGE_W;
      const z = (L.at[1] - 0.5) * PAGE_H;
      L.foot = [x, z];
      L.group.position.set(x, 0, z);
      const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ map: shadowTex, color: 0x3a2a14, transparent: true, depthWrite: false, opacity: SHADOW_OPACITY }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.renderOrder = 1;
      shadow.position.set(x, 0, z);
      group.add(shadow);
      L.shadow = shadow;
      /* each piece's standing footprint sets its shadow size */
      const bb = new THREE.Box3().setFromObject(L.inner);
      L.height = Math.max(0.05, bb.max.y);
      L.width = Math.max(0.08, bb.max.x - bb.min.x);
      L.depth = Math.max(0.08, bb.max.z - bb.min.z);
      let h = 2166136261;
      for (const ch of `${n}:${L.id}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
      L.phase = ((h % 1000) / 1000) * Math.PI * 2;
    }
    schedule(pieces);
    e.group = group;
    e.pieces = pieces;
    e.wind = wind;
    e.built = true;
    return e;
  }

  /* ---- time ------------------------------------------------------------ */

  const records = [];
  function push(r) {
    records.push(r);
    if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
  }

  function stateAt(t) {
    let cur = null;
    let rise = null;
    for (const r of records) {
      if (r.t > t) break;
      cur = r;
      if (r.type !== 'fold') rise = r;
    }
    if (!cur) return { spread: null, phase: 'hidden', virtual: 0, since: 0, fold: 0 };
    if (cur.type === 'snap') return { spread: cur.spread, phase: 'risen', virtual: RISE_END, since: t - cur.t, fold: 0 };
    if (cur.type === 'rise') {
      const dt = t - cur.t;
      const v = reduced ? RISE_END : Math.min(RISE_END, dt);
      return { spread: cur.spread, phase: v >= RISE_END ? 'risen' : 'rising', virtual: v, since: dt, fold: 0 };
    }
    const k = cur.dur > 0 ? (t - cur.t) / cur.dur : 1;
    const since = rise ? cur.t - rise.t : 1e9;
    if (k >= 1) return { spread: cur.spread, phase: 'hidden', virtual: 0, since, fold: 1 };
    return { spread: cur.spread, phase: 'folding', virtual: cur.v0 * (1 - k), since, fold: k };
  }

  const foldDur = (v0) => (reduced ? 0 : FOLD_S * clamp01(v0 / RISE_END));

  /* ---- pose ------------------------------------------------------------ */

  function setPieces(e, st) {
    const top = pageTop(e.spread, 'right');
    for (const L of e.pieces) {
      let p;
      if (st.phase === 'hidden') p = 0;
      else if (st.phase === 'risen') p = 1;
      else {
        const k = clamp01((st.virtual - L.t0) / (L.t1 - L.t0));
        p = st.phase === 'folding' ? smooth(k) : k;
      }
      L.p = p;
      const s = st.phase === 'rising' && p > 0 ? backOut(p) : p;
      const vis = p > 0.002;
      L.group.visible = vis;
      L.shadow.visible = vis;
      if (!vis) continue;
      /* rainy-study's fold: the scenery scales in Y from its foot; the
         overshoot gives the paper a little spring */
      L.group.position.y = top + 0.0015;
      L.group.scale.set(0.6 + 0.4 * s, Math.max(0.0001, s), 0.6 + 0.4 * s);
      L.group.rotation.x = (1 - p) * -0.35;
      const sw = L.width * (0.8 + 0.5 * p);
      L.shadow.scale.set(sw * 1.3, L.depth * 1.3 + 0.04, 1);
      L.shadow.position.y = top + SHADOW_LIFT;
      L.shadow.material.opacity = SHADOW_OPACITY * p;
    }
  }

  /* Small, continuous, seeded: a scene that breathes once it stands. */
  function breathe(e, st, t) {
    if (st.phase !== 'risen' || reduced) return;
    const u = st.since;
    for (const L of e.pieces) {
      const b = 1 + Math.sin(u * 1.1 + L.phase) * 0.006;
      L.group.scale.set(1, b, 1);
      L.group.rotation.z = Math.sin(u * 0.7 + L.phase) * 0.008;
    }
    sway(e.wind, u, 0.6);
  }

  let last = { spread: null, phase: 'hidden' };
  function update(t = api.time) {
    const st = stateAt(t);
    for (const [n, e] of entries) {
      if (!e.built) continue;
      const on = st.spread === n && st.phase !== 'hidden';
      e.group.visible = on;
      if (!on) continue;
      setPieces(e, st);
      breathe(e, st, t);
    }
    last = st;
  }

  /* ---- API ------------------------------------------------------------- */

  function show(spread, at = api.time) {
    if (!CHAPTERS[spread]) return 0;
    entryFor(spread);
    push({ type: 'rise', t: at, spread });
    events.emit('rise', { spread });
    return reduced ? 0 : RISE_END;
  }

  function snap(spread, at = api.time) {
    if (!CHAPTERS[spread]) return 0;
    entryFor(spread);
    push({ type: 'snap', t: at, spread });
    return 0;
  }

  function fold(spread, at = api.time) {
    const st = stateAt(at);
    if (st.spread !== spread || (st.phase !== 'rising' && st.phase !== 'risen')) return 0;
    const v0 = st.virtual;
    const dur = foldDur(v0);
    push({ type: 'fold', t: at, spread, v0, dur });
    events.emit('fold', { spread });
    return dur;
  }

  function hide(at = api.time) {
    const st = stateAt(at);
    if (st.spread == null || st.phase === 'hidden') return 0;
    return fold(st.spread, at);
  }

  /* ---- events ----------------------------------------------------------- */

  events.on('settle', ({ spread }) => { if (CHAPTERS[spread]) show(spread); });
  events.on('beforeTurn', ({ from }) => fold(from));
  events.on('jump', ({ spread }) => {
    records.length = 0;
    if (CHAPTERS[spread]) snap(spread);
  });
  events.on('cover', ({ open }) => { if (!open) hide(); });

  /* Build both chapters now so the first rise never waits on geometry. */
  for (const n of Object.keys(CHAPTERS)) entryFor(Number(n));

  const prev = scene.onBeforeRender;
  scene.onBeforeRender = function onBeforeRender(...args) {
    if (typeof prev === 'function') prev.apply(this, args);
    update(api.time);
  };

  const popup = {
    show, fold, hide, snap, stateAt, update,
    get state() { return last; },
    pieces(spread) { const e = entries.get(spread); return e ? e.pieces.slice() : []; },
  };
  api.popup = popup;
  return popup;
}
