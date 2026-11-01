/* pieces.js — paper-craft builders for the miniature scenes.
 *
 * Adapted from rainy-study (src/pop-up-world.js, MIT, andyhuo520 2026). The
 * canvas-drawn paper grain as a bump map, the `material`, `mesh`, `ell`,
 * `box`, `cone` and `star` helpers, the foliage cluster built from a
 * trunk and a ring of golden-angle ellipsoid leaves (`tree`), the idle sway
 * applied to wind groups and the floaters' bobbing are the original's. The
 * fox, whale and rabbit, their rooms and the private renderer are gone;
 * what is built here are pavilion-side planters, lanterns, floral domes and
 * a small arch for the book's pages, in cream, ivory and gold.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

/* rainy-study's paper grain, seeded exactly as in the original. */
const grainCanvas = document.createElement('canvas');
grainCanvas.width = grainCanvas.height = 128;
{
  const gc = grainCanvas.getContext('2d');
  gc.fillStyle = '#e9e5d9';
  gc.fillRect(0, 0, 128, 128);
  let seed = 91;
  for (let i = 0; i < 6000; i += 1) {
    seed = (seed * 16807) % 2147483647; const x = seed % 128;
    seed = (seed * 16807) % 2147483647; const y = seed % 128;
    gc.fillStyle = i % 2 ? '#bdb8a338' : '#ffffff66';
    gc.fillRect(x, y, 1, 2);
  }
}
export const grain = new THREE.CanvasTexture(grainCanvas);
grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
grain.repeat.set(3, 3);

const cache = new Map();
export function material(c, extra = {}) {
  const key = `${c}|${JSON.stringify(extra)}`;
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshStandardMaterial({ color: c, roughness: 0.87, bumpMap: grain, bumpScale: 0.022, ...extra }));
  }
  return cache.get(key);
}
export const goldMaterial = () => material('#c9a961', { metalness: 0.85, roughness: 0.3, bumpScale: 0.004 });

export function mesh(g, c, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(g, typeof c === 'string' ? material(c) : c);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function ell(c, x, y, z, sx, sy, sz, parent) {
  const m = mesh(new THREE.SphereGeometry(1, 20, 14), c, parent, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
export function box(c, x, y, z, w, h, d, parent) {
  return mesh(new THREE.BoxGeometry(w, h, d), c, parent, x, y, z);
}
export function cone(c, x, y, z, r, h, parent, n = 24) {
  return mesh(new THREE.ConeGeometry(r, h, n), c, parent, x, y, z);
}
export function cyl(c, x, y, z, r1, r2, h, parent, n = 18) {
  return mesh(new THREE.CylinderGeometry(r1, r2, h, n), c, parent, x, y, z);
}

/* rainy-study's star: a ten-point outline extruded with a small bevel. */
export function star(parent, x, y, z, size = 0.2, c = 0xffcc63) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const a = (i * Math.PI) / 5 + Math.PI / 2;
    const r = i % 2 ? size * 0.43 : size;
    const p = [Math.cos(a) * r, Math.sin(a) * r];
    if (i === 0) sh.moveTo(...p); else sh.lineTo(...p);
  }
  sh.closePath();
  return mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, steps: 1 }), c, parent, x, y, z);
}

/* rainy-study's tree, reshaped: a slender trunk, three short branches and
   a golden-angle ring of ellipsoid leaves. Palettes are passed in so the
   same builder makes a cream topiary, a sage sprig or a blush bloom. */
export function foliage(parent, wind, x, z, scale = 1, palette = ['#f1e6cf', '#e8dcc2', '#f7efdd', '#dccfae'], trunk = '#b9955a', leafCount = 25) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  parent.add(g);
  if (wind) wind.push(g);
  mesh(new THREE.CylinderGeometry(0.07, 0.13, 1.5, 12), trunk, g, 0, 0.73, 0);
  for (let j = 0; j < 3; j += 1) {
    const branch = mesh(new THREE.CylinderGeometry(0.025, 0.06, 0.65, 10), trunk, g, (j - 1) * 0.18, 1.15 + j * 0.1, 0);
    branch.rotation.z = (j - 1) * -0.7;
  }
  for (let i = 0; i < leafCount; i += 1) {
    const a = i * 2.399;
    const r = 0.16 + ((i * 7) % 11) / 18;
    const leaf = ell(palette[i % palette.length], Math.cos(a) * r, 1.5 + Math.sin(i * 1.7) * 0.23, Math.sin(a) * r, 0.27, 0.055, 0.14, g);
    leaf.rotation.set(Math.sin(i) * 0.3, a, Math.cos(i) * 0.25);
  }
  return g;
}

/* A floral dome in a planter: a ring of small blooms over a cream mound. */
export function planter(parent, x, z, scale = 1, { accent = '#c9a961', bloom = '#f4e9d6', pot = '#efe5d0' } = {}) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  parent.add(g);
  cyl(pot, 0, 0.16, 0, 0.26, 0.2, 0.32, g, 24);
  mesh(new THREE.TorusGeometry(0.265, 0.012, 8, 32), goldMaterial(), g, 0, 0.32, 0).rotation.x = Math.PI / 2;
  ell('#dfd3b6', 0, 0.36, 0, 0.3, 0.1, 0.3, g);
  for (let i = 0; i < 18; i += 1) {
    const a = i * 2.399;
    const r = 0.05 + ((i * 5) % 7) / 32;
    const y = 0.42 + (0.2 - r) * 0.9 + Math.sin(i) * 0.02;
    ell(i % 5 === 0 ? accent : bloom, Math.cos(a) * r, y, Math.sin(a) * r, 0.065, 0.05, 0.065, g);
  }
  return g;
}

/* A lantern: a pole, a small housing with a warm emissive pane. */
export function lantern(parent, x, z, height = 0.9, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  parent.add(g);
  const gold = goldMaterial();
  cyl(gold, 0, height / 2, 0, 0.012, 0.016, height, g, 10);
  cyl('#e9dcc1', 0, 0.015, 0, 0.07, 0.085, 0.03, g, 16);
  const housing = new THREE.Group();
  housing.position.y = height;
  g.add(housing);
  box(gold, 0, 0, 0, 0.12, 0.01, 0.12, housing);
  const pane = box('#ffe6b0', 0, 0.09, 0, 0.09, 0.16, 0.09, housing);
  pane.material = new THREE.MeshStandardMaterial({ color: '#ffe6b0', emissive: '#ffb347', emissiveIntensity: 0.9, roughness: 0.6 });
  box(gold, 0, 0.19, 0, 0.13, 0.012, 0.13, housing);
  cone(gold, 0, 0.23, 0, 0.07, 0.07, housing, 4);
  g.userData.pane = pane;
  return g;
}

/* A small gold arch on a base, the motif of the pavilion in page scale. */
export function arch(parent, x, z, width = 0.7, height = 0.62, accent = null) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  const gold = goldMaterial();
  const r = 0.014;
  const curve = new THREE.CurvePath();
  const half = width / 2;
  const straight = height - half * 0.9;
  curve.add(new THREE.LineCurve3(new THREE.Vector3(-half, 0, 0), new THREE.Vector3(-half, straight, 0)));
  curve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-half, straight, 0), new THREE.Vector3(0, height + half * 0.35, 0), new THREE.Vector3(half, straight, 0)));
  curve.add(new THREE.LineCurve3(new THREE.Vector3(half, straight, 0), new THREE.Vector3(half, 0, 0)));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r, 8, false), gold);
  tube.castShadow = true;
  g.add(tube);
  box('#efe5d0', -half, 0.02, 0, 0.09, 0.04, 0.09, g);
  box('#efe5d0', half, 0.02, 0, 0.09, 0.04, 0.09, g);
  /* a soft swag of blooms over the crown */
  for (let i = 0; i < 9; i += 1) {
    const t = (i + 0.5) / 9;
    const px = -half * 0.8 + width * 0.8 * t;
    const py = straight + Math.sin(t * Math.PI) * (half * 0.5) + 0.03;
    ell(accent && i % 4 === 1 ? accent : (i % 2 ? '#f7efe0' : '#eadcc0'), px, py, 0.02, 0.05, 0.042, 0.05, g);
  }
  return g;
}

/* Static dressing is many small meshes; merge them per material into one
   draw call each. Only for groups that never move afterwards. */
export function mergeStatic(group) {
  group.updateWorldMatrix(true, true);
  const byMat = new Map();
  const old = [];
  group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(g);
    old.push(o);
  });
  for (const o of old) o.parent.remove(o);
  const merged = new THREE.Group();
  merged.name = `${group.name}-merged`;
  for (const [mat, geos] of byMat) {
    const g = BufferGeometryUtils.mergeGeometries(geos, false);
    for (const x of geos) x.dispose();
    if (!g) continue;
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    merged.add(m);
  }
  return merged;
}

/* rainy-study's idle motion: wind groups rock, floaters bob and glow. */
export function sway(wind, u, strength = 1) {
  wind.forEach((m, i) => {
    m.rotation.z = Math.sin(u * 1.5 + i) * 0.055 * strength;
    m.rotation.x = Math.cos(u * 0.8 + i) * 0.025 * strength;
  });
}
export function bob(floaters, u) {
  floaters.forEach((m, i) => {
    const b = m.userData.base;
    if (!b) return;
    m.position.set(b.x + Math.sin(u * 0.7 + i) * 0.03, b.y + Math.sin(u * 1.3 + i) * 0.02, b.z + Math.cos(u * 0.8 + i) * 0.025);
    if (m.material.emissive) m.material.emissiveIntensity = 0.8 + Math.sin(u * 2 + i) * 0.4;
  });
}
