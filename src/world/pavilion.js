/* pavilion.js — the setting around the book: a dais, a lawn's ground and a
 * slender gold pavilion frame. Written for this invitation.
 *
 * The frame is decorative geometry in the approved concept's language and is
 * not a model of either marquee. Four columns carry a thin top frame and a
 * gently arched back beam; string lights (lights.js) hang from the beams and
 * floral pieces (popup/pieces.js) stand at the column feet.
 */

import * as THREE from 'three';
import { mulberry32 } from '../core/rng.js';

/* Two columns at the back under the arch, two at mid depth: the front of
   the pavilion is open, so the approach to the book is never crossed. */
export const COLUMNS = [[-2.9, -2.4], [2.9, -2.4], [-3.3, -0.3], [3.3, -0.3]];
export const COLUMN_H = 2.6;
export const DAIS_R = 1.78;
export const DAIS_H = 0.12;

export const GOLD = { color: 0xc9a961, metalness: 0.9, roughness: 0.32 };
export const IVORY = { color: 0xf3ebdb, metalness: 0, roughness: 0.82 };

function groundTexture(seed) {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#cbb992';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 9000; i += 1) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(150, 120, 70, 0.10)' : 'rgba(255, 250, 240, 0.22)';
    ctx.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  return t;
}

export function createPavilion(scene, { seed = 7 } = {}) {
  const group = new THREE.Group();
  group.name = 'pavilion';
  const gold = new THREE.MeshStandardMaterial(GOLD);
  const ivory = new THREE.MeshStandardMaterial(IVORY);

  /* Ground: a wide disc under the lawn. */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ map: groundTexture(seed), roughness: 1, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -DAIS_H;
  ground.receiveShadow = true;
  group.add(ground);

  /* Dais: an ivory drum with a gold rim, its top at y = 0 where the book lies. */
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(DAIS_R, DAIS_R + 0.04, DAIS_H, 72), ivory);
  dais.position.y = -DAIS_H / 2;
  dais.receiveShadow = true;
  dais.castShadow = false;
  group.add(dais);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(DAIS_R - 0.01, 0.012, 10, 96), gold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.002;
  group.add(rim);
  const rimLow = new THREE.Mesh(new THREE.TorusGeometry(DAIS_R + 0.03, 0.01, 10, 96), gold);
  rimLow.rotation.x = Math.PI / 2;
  rimLow.position.y = -DAIS_H + 0.01;
  group.add(rimLow);

  /* Columns with a small base and capital. */
  const colGeo = new THREE.CylinderGeometry(0.045, 0.05, COLUMN_H, 18);
  const baseGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.06, 20);
  const capGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.05, 18);
  for (const [x, z] of COLUMNS) {
    const col = new THREE.Mesh(colGeo, gold);
    col.position.set(x, COLUMN_H / 2 - DAIS_H, z);
    col.castShadow = true;
    group.add(col);
    const base = new THREE.Mesh(baseGeo, ivory);
    base.position.set(x, -DAIS_H + 0.03, z);
    group.add(base);
    const cap = new THREE.Mesh(capGeo, gold);
    cap.position.set(x, COLUMN_H - DAIS_H + 0.02, z);
    group.add(cap);
  }

  /* Top frame: thin beams along the sides, and an arched beam at the back. */
  const top = COLUMN_H - DAIS_H + 0.04;
  const beamR = 0.022;
  function beam(a, b) {
    const curve = new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 1, beamR, 10, false), gold);
    m.castShadow = true;
    group.add(m);
  }
  beam([-2.9, top, -2.4], [-3.3, top, -0.3]);
  beam([2.9, top, -2.4], [3.3, top, -0.3]);
  const arch = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-2.9, top, -2.4),
    new THREE.Vector3(0, top + 1.0, -2.4),
    new THREE.Vector3(2.9, top, -2.4),
  );
  const archMesh = new THREE.Mesh(new THREE.TubeGeometry(arch, 24, beamR * 1.2, 10, false), gold);
  archMesh.castShadow = true;
  group.add(archMesh);
  /* a finer inner arch, a little below, for the double-line motif of the pages */
  const arch2 = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-2.7, top - 0.2, -2.4),
    new THREE.Vector3(0, top + 0.6, -2.4),
    new THREE.Vector3(2.7, top - 0.2, -2.4),
  );
  group.add(new THREE.Mesh(new THREE.TubeGeometry(arch2, 24, beamR * 0.7, 8, false), gold));

  scene.add(group);

  /* Where string lights hang from: the side beams to the back arch's apex,
     and across the front. */
  /* Wires run behind the book from the camera's side (z below -0.6), so no
     line ever crosses the pages in frame. */
  const wires = [
    [[-2.9, top, -0.6], [0, top + 0.85, -2.4]],
    [[2.9, top, -0.6], [0, top + 0.85, -2.4]],
    [[-2.9, top, -1.5], [2.9, top, -1.5]],
  ];

  return { group, gold, ivory, wires, top };
}
