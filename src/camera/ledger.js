/* ledger.js — the authored camera: a ledger of poses and a log of flights.
 *
 * Adapted from spring-bloom (js/ledger.js, MIT, Abdelrahman Shaaban 2026).
 * Kept from the original: rows fitted for the current aspect and rebuilt on
 * refit, a portrait ledger that pans every row so the lower band stays clear
 * for the HTML card, a log of timed flights evaluated from time alone (so a
 * seek lands on the right pose and a refit replays the same history against
 * new rows), the weighted polyline flight (`pathAt`, duat) and the smooth
 * ease. Removed: the per-cut-out rows and the recipe and text loading, which
 * belonged to the picture book. Added: a `world` row that establishes the
 * miniature setting before the camera comes to the book, a `chapter` row
 * that leaves headroom for the pieces standing on the right page, and a
 * `pose` event so the timeline can ask for a flight by name.
 */

import * as THREE from 'three';
import { BOARD_W, BOARD_H, BOARD_T, BLOCK_T } from '../book/book.js';
import {
  BOOK_CORNERS, BOOK_CORNERS_PORTRAIT, LOOK, DIR_LANDSCAPE, DIR_PORTRAIT, FOV_LANDSCAPE, FOV_PORTRAIT,
  PORTRAIT_BELOW, MARGIN, lookBasis, landscapeClears, panClears, clearFitH, clearFitV,
} from './camera.js';

export const FLY_FOCUS = 1.1;
export const FLY_RELEASE = 0.9;
export const FLY_APPROACH = 2.6;
const ARC = 0.45;

const CLOSED_DIR = new THREE.Vector3(0.55, 0.88, 1.00).normalize();
const CLOSED_DIR_PORTRAIT = new THREE.Vector3(0.30, 1.25, 1.00).normalize();
const CLOSED_LOOK = new THREE.Vector3(BOARD_W / 2, 0.03, 0.12);
const CLOSED_FILL = 0.45;
const CLOSED_FILL_PORTRAIT = 0.68;
const TITLE_DIR = new THREE.Vector3(0.30, 1.02, 1.00).normalize();
const TITLE_MARGIN = 0.94;
const CARD_CLEAR = 0.46;           // portrait: the lower band of the frame belongs to the HTML card
const CHAPTER_CLEAR = 0.44;
const CHAPTER_MARGIN = 0.90;
/* The establishing shot: lower and further out, looking a little past the
   book so the pavilion frame and the lawn fill the frame. */
const WORLD_DIR = new THREE.Vector3(0.62, 0.52, 1.00).normalize();
const WORLD_DIR_PORTRAIT = new THREE.Vector3(0.30, 0.62, 1.00).normalize();
const WORLD_LOOK = new THREE.Vector3(0.1, 0.55, -0.5);
const WORLD_MARGIN = 0.92;
const WORLD_CLEAR = 0.30;
const LOG_MAX = 240;

const REST_KINDS = new Set(['world', 'closed', 'title', 'home', 'chapter']);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

/* The shut book: boards, block and spine strip, lying to the right of x = 0. */
const CLOSED_CORNERS = [];
for (const x of [-0.01, BOARD_W]) {
  for (const y of [0, BOARD_T * 2 + BLOCK_T]) {
    for (const z of [-BOARD_H / 2, BOARD_H / 2]) CLOSED_CORNERS.push(new THREE.Vector3(x, y, z));
  }
}
/* The open book with pieces standing on its right page. */
const CHAPTER_CORNERS = [];
for (const x of [-1.07, 1.07]) for (const z of [-0.68, 0.68]) CHAPTER_CORNERS.push(new THREE.Vector3(x, 0, z));
for (const x of [0.15, 0.95]) for (const z of [-0.5, 0.4]) CHAPTER_CORNERS.push(new THREE.Vector3(x, 0.95, z));
const CHAPTER_CORNERS_PORTRAIT = CHAPTER_CORNERS.map((c) => (c.y > 0 ? new THREE.Vector3(c.x, 0.9, c.z) : c.clone()));
/* The pavilion footprint around the dais. */
const WORLD_CORNERS = [];
for (const x of [-3.5, 3.5]) for (const z of [-2.7, 0.4]) for (const y of [0, 2.75]) WORLD_CORNERS.push(new THREE.Vector3(x, y, z));

/* ---- paths (duat, kept from the original) -------------------------------- */

function lerpV(out, a, b, t) {
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
}

export function pathAt(out, from, via, to, f, w) {
  if (!via || !via.length) { lerpV(out, from, to, f); return; }
  const legs = via.length + 1;
  let acc = 0; let tot = 0;
  for (let k = 0; k < legs; k += 1) tot += (w && w[k]) || 1;
  const target = f * tot;
  for (let seg = 0; seg < legs; seg += 1) {
    const width = (w && w[seg]) || 1;
    if (target <= acc + width || seg === legs - 1) {
      const lf = Math.min(1, Math.max(0, (target - acc) / width));
      const A = seg === 0 ? from : via[seg - 1];
      const B = seg === legs - 1 ? to : via[seg];
      lerpV(out, A, B, lf);
      return;
    }
    acc += width;
  }
}

/* ---- init ----------------------------------------------------------------- */

export function init(api) {
  const camera = api.camera;
  const book = api.book;
  const live = api.mode === 'live';
  const reduced = !!api.reduced;

  const ledger = {
    aspect: camera.aspect || 16 / 9,
    portrait: false,
    rows: { world: null, closed: null, title: null, home: null, chapter: null },
    log: [],
    base: { kind: 'world', spread: 0 },
  };
  const log = ledger.log;

  const vA = new THREE.Vector3();
  const vCam = new THREE.Vector3();
  const vLook = new THREE.Vector3();
  const basis = { fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3() };

  const panAcc = new THREE.Vector3();
  function panClear(camV, lookV, fov, clear) {
    const d = camV.distanceTo(lookV);
    lookBasis(camV, lookV, basis);
    const shift = d * Math.tan(THREE.MathUtils.degToRad(fov) / 2) * clear;
    camV.addScaledVector(basis.up, -shift);
    lookV.addScaledVector(basis.up, -shift);
    panAcc.addScaledVector(basis.up, -shift);
  }

  function row(fov, extra) {
    lookBasis(vCam, vLook, basis);
    const pan = [panAcc.dot(basis.right), panAcc.dot(basis.up)];
    panAcc.set(0, 0, 0);
    return Object.assign({ cam: vCam.toArray(), look: vLook.toArray(), fov, pan }, extra);
  }

  function fitRow(corners, dir, look, fov, marginH, marginV, clear) {
    const lc = landscapeClears(ledger.aspect);
    const d = camera.fitDistance(corners, dir, look, fov, ledger.aspect, marginH * clearFitH(lc), marginV * (1 - clear) * clearFitV(lc));
    vCam.copy(look).addScaledVector(dir, d);
    vLook.copy(look);
    if (clear > 0) panClear(vCam, vLook, fov, clear);
    panClears(vCam, vLook, fov, ledger.aspect, d, lc, panAcc);
    return row(fov, { distance: d });
  }

  function fitWidth(corners, dir, look, fov, fill, marginV) {
    const lc = landscapeClears(ledger.aspect);
    const fillH = fill * clearFitH(lc);
    const fitV = marginV * clearFitV(lc);
    let d = camera.fitDistance(corners, dir, look, fov, ledger.aspect, fillH, fitV);
    const tanV = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
    const tanH = tanV * ledger.aspect;
    for (let i = 0; i < 6; i += 1) {
      vCam.copy(look).addScaledVector(dir, d);
      lookBasis(vCam, look, basis);
      let xMin = Infinity; let xMax = -Infinity; let yMax = 0;
      for (const c of corners) {
        vA.subVectors(c, look);
        const depth = d + vA.dot(basis.fwd);
        const x = vA.dot(basis.right) / (depth * tanH);
        xMin = Math.min(xMin, x); xMax = Math.max(xMax, x);
        yMax = Math.max(yMax, Math.abs(vA.dot(basis.up)) / (depth * tanV));
      }
      d *= Math.max((xMax - xMin) / (2 * fillH), yMax / fitV);
    }
    vCam.copy(look).addScaledVector(dir, d);
    vLook.copy(look);
    panClears(vCam, vLook, fov, ledger.aspect, d, lc, panAcc);
    return row(fov, { distance: d });
  }

  function rebuild(aspect) {
    ledger.aspect = aspect;
    ledger.portrait = aspect < PORTRAIT_BELOW;
    const p = ledger.portrait;
    const fov = p ? FOV_PORTRAIT : FOV_LANDSCAPE;
    const clear = p ? CARD_CLEAR : 0;
    ledger.rows.world = fitRow(WORLD_CORNERS, p ? WORLD_DIR_PORTRAIT : WORLD_DIR, WORLD_LOOK, fov, WORLD_MARGIN, WORLD_MARGIN, p ? WORLD_CLEAR : 0);
    ledger.rows.closed = p
      ? fitWidth(CLOSED_CORNERS, CLOSED_DIR_PORTRAIT, CLOSED_LOOK, fov, CLOSED_FILL_PORTRAIT, 0.62)
      : fitWidth(CLOSED_CORNERS, CLOSED_DIR, CLOSED_LOOK, fov, CLOSED_FILL, 0.90);
    ledger.rows.title = fitRow(p ? BOOK_CORNERS_PORTRAIT : BOOK_CORNERS, p ? DIR_PORTRAIT : TITLE_DIR, LOOK, fov, TITLE_MARGIN, TITLE_MARGIN, clear);
    ledger.rows.home = fitRow(p ? BOOK_CORNERS_PORTRAIT : BOOK_CORNERS, p ? DIR_PORTRAIT : DIR_LANDSCAPE, LOOK, fov, MARGIN, MARGIN, clear);
    ledger.rows.chapter = fitRow(p ? CHAPTER_CORNERS_PORTRAIT : CHAPTER_CORNERS, p ? DIR_PORTRAIT : DIR_LANDSCAPE, LOOK, fov, CHAPTER_MARGIN, CHAPTER_MARGIN, p ? CHAPTER_CLEAR : 0);
    /* The approach from the establishing shot swoops over the book rather
       than sliding straight in. */
    const w = ledger.rows.world.cam;
    for (const k of ['closed', 'title']) {
      const r = ledger.rows[k];
      r.via = [[(w[0] + r.cam[0]) / 2, Math.max(w[1], r.cam[1]) + ARC, (w[2] + r.cam[2]) / 2]];
      r.viaW = [1.2, 1];
    }
  }

  function rowFor(state) {
    return ledger.rows[state.kind] || ledger.rows.home;
  }

  /* ---- evaluation ------------------------------------------------------ */

  const P = { cam: [0, 0, 0], look: [0, 0, 0], fov: FOV_LANDSCAPE, held: 0, pan: [0, 0] };
  const Q = { cam: [0, 0, 0], look: [0, 0, 0], fov: FOV_LANDSCAPE, held: 0, pan: [0, 0] };

  function stateAt(time) {
    let s = ledger.base;
    for (const e of log) {
      if (e.t > time) break;
      s = e;
    }
    return s;
  }

  function evalAt(time, out) {
    let from = P;
    let cur = Q;
    const r0 = rowFor(ledger.base);
    from.cam[0] = r0.cam[0]; from.cam[1] = r0.cam[1]; from.cam[2] = r0.cam[2];
    from.look[0] = r0.look[0]; from.look[1] = r0.look[1]; from.look[2] = r0.look[2];
    from.fov = r0.fov;
    from.held = 0;
    from.pan[0] = r0.pan ? r0.pan[0] : 0;
    from.pan[1] = r0.pan ? r0.pan[1] : 0;
    for (let i = 0; i < log.length; i += 1) {
      const e = log[i];
      if (e.t > time) break;
      const target = rowFor(e);
      const next = log[i + 1];
      const until = next && next.t <= time ? next.t : time;
      const f = e.dur > 0 ? ease(clamp01((until - e.t) / e.dur)) : 1;
      /* only the approach from the establishing shot swoops */
      const via = (e.kind === 'closed' || e.kind === 'title') && stateKindBefore(i) === 'world' ? target.via : null;
      pathAt(cur.cam, from.cam, via, target.cam, f, target.viaW);
      lerpV(cur.look, from.look, target.look, f);
      cur.fov = from.fov + (target.fov - from.fov) * f;
      cur.held = 0;
      const tp0 = target.pan ? target.pan[0] : 0;
      const tp1 = target.pan ? target.pan[1] : 0;
      cur.pan[0] = from.pan[0] + (tp0 - from.pan[0]) * f;
      cur.pan[1] = from.pan[1] + (tp1 - from.pan[1]) * f;
      const swap = from; from = cur; cur = swap;
    }
    out.cam.set(from.cam[0], from.cam[1], from.cam[2]);
    out.look.set(from.look[0], from.look[1], from.look[2]);
    out.fov = from.fov;
    out.held = from.held;
    if (!out.pan) out.pan = [0, 0];
    out.pan[0] = from.pan[0];
    out.pan[1] = from.pan[1];
    return out;
  }

  function stateKindBefore(i) {
    return i > 0 ? log[i - 1].kind : ledger.base.kind;
  }

  const probe = { cam: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0, held: 0 };

  function prune(now) {
    if (log.length <= LOG_MAX) return;
    let j = -1;
    for (let i = 0; i < log.length; i += 1) if (log[i].t + log[i].dur <= now) j = i;
    if (j < 0) return;
    const e = log[j];
    ledger.base = { kind: e.kind, spread: e.spread };
    log.splice(0, j + 1);
  }

  /* Log a flight to a pose. Returns false when the camera is already bound
     there. A call at a time earlier than the last entry rewrites what came
     after it. */
  function go(kind, opts = {}) {
    if (!ledger.rows[kind]) return false;
    const t = opts.t !== undefined ? opts.t : api.time;
    const cur = stateAt(t);
    const entry = {
      kind,
      t,
      spread: opts.spread !== undefined ? opts.spread : cur.spread,
      dur: reduced ? 0 : (opts.dur !== undefined ? opts.dur : FLY_FOCUS),
    };
    if (cur.kind === entry.kind && cur.spread === entry.spread) return false;
    while (log.length && log[log.length - 1].t > t) log.pop();
    log.push(entry);
    if (live) prune(t);
    return true;
  }

  const restKind = (spread) => {
    if (spread === 0) return 'title';
    if (spread === 3 || spread === 4) return 'chapter';
    return 'home';
  };

  /* ---- the camera API --------------------------------------------------- */

  camera.ledger = ledger;
  camera.go = go;
  camera.restKind = restKind;
  camera.stateAt = stateAt;
  camera.evalAt = (time) => evalAt(time, probe);
  camera.flights = { focus: FLY_FOCUS, release: FLY_RELEASE, approach: FLY_APPROACH };
  /* Back to a rest pose with no history, for a replay. */
  camera.resetTo = (kind = 'world', spread = 0) => {
    log.length = 0;
    ledger.base = { kind: ledger.rows[kind] ? kind : 'world', spread };
    camera.resetOrbit?.();
    camera.update(0, api.time);
  };
  camera.release = ({ t } = {}) => {
    const now = t !== undefined ? t : api.time;
    const cur = stateAt(now);
    return go(restKind(cur.spread), { spread: cur.spread, t: now, dur: FLY_RELEASE });
  };
  camera.poseError = () => {
    const r = rowFor(stateAt(api.time));
    const p = camera.pose;
    const dCam = Math.hypot(p.cam.x - r.cam[0], p.cam.y - r.cam[1], p.cam.z - r.cam[2]);
    const dLook = Math.hypot(p.look.x - r.look[0], p.look.y - r.look[1], p.look.z - r.look[2]);
    return Math.max(dCam, dLook, Math.abs(p.fov - r.fov) / 100);
  };

  camera.driver = { poseAt: (time, pose) => evalAt(time, pose) };
  camera.onRefit = (aspect) => rebuild(aspect);

  /* ---- events ------------------------------------------------------------ */

  api.events.on('pose', ({ kind, dur, t, spread } = {}) => go(kind, { dur, t, spread }));
  api.events.on('cover', ({ open, t } = {}) => {
    go(open ? 'title' : 'closed', { spread: 0, t, dur: open ? FLY_FOCUS : FLY_RELEASE });
  });
  api.events.on('settle', ({ spread } = {}) => {
    go(restKind(spread), { spread, dur: FLY_RELEASE });
  });
  api.events.on('jump', ({ spread } = {}) => {
    go(book.isOpen ? restKind(spread) : 'closed', { spread, dur: 0 });
  });

  /* ---- boot -------------------------------------------------------------- */

  ledger.base = { kind: 'world', spread: 0 };
  rebuild(camera.aspect || 16 / 9);
  camera.ready = Promise.resolve(camera);
  camera.update(0, api.time);
  return camera;
}
