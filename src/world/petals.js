/* petals.js — petals drifting down over the lawn.
 *
 * Adapted from Elemental-Serenity (src/Game/World/Components/FallingLeaves/
 * FallingLeavesSystem.class.js, MIT, Sahil K 2026). The instanced mesh, the
 * particle record, the respawn rule, the grow-in and the slow sideways
 * wander are the original's. The leaf GLB is replaced by a small procedural
 * petal (a bent ellipse), the season manager by one cream-and-blush colour,
 * Math.random by the seeded generator, and the bounds by two columns that
 * sit either side of the pavilion so petals never cross the book.
 */

import * as THREE from 'three';
import { mulberry32 } from '../core/rng.js';

function petalGeometry() {
  const g = new THREE.PlaneGeometry(0.075, 0.11, 2, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    const x = p.getX(i); const y = p.getY(i);
    /* a soft cup: higher toward the rim, pointed at the tip */
    p.setZ(i, (x * x) * 2.2 + (y > 0 ? y * y * 0.6 : 0));
    p.setX(i, x * (1 - Math.max(0, y) * 2.2));
  }
  g.computeVertexNormals();
  return g;
}

export function createPetals(scene, bounds, { count = 28, seed = 11, color = 0xf4dfd3 } = {}) {
  const rnd = mulberry32(seed);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(petalGeometry(), material, count);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  scene.add(mesh);

  const dummy = new THREE.Object3D();
  const particles = [];

  function respawn(p) {
    p.pos.x = bounds.originX + (rnd() - 0.5) * bounds.xRange;
    p.pos.y = bounds.yMax - rnd();
    p.pos.z = bounds.originZ + (rnd() - 0.5) * bounds.zRange;
    p.vel.set((rnd() - 0.2) * 0.012, -(rnd() * 0.004 + 0.006), (rnd() - 0.7) * 0.012);
    p.rot.set(rnd() * 3, rnd() * 3, rnd() * 3);
    p.rotSpeed.set((rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.08);
    p.scale = 0.0;
  }

  for (let i = 0; i < count; i += 1) {
    particles.push({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Euler(), rotSpeed: new THREE.Vector3(), scale: 1 });
    respawn(particles[i]);
    particles[i].pos.y = rnd() * (bounds.yMax - bounds.yMin) + bounds.yMin;
  }

  function update(dt) {
    const cappedDt = Math.min(dt, 0.1);
    const k = cappedDt * 60;
    for (let i = 0; i < count; i += 1) {
      const p = particles[i];
      p.pos.addScaledVector(p.vel, k);
      p.rot.x += p.rotSpeed.x * k;
      p.rot.y += p.rotSpeed.y * k;
      p.rot.z += p.rotSpeed.z * k;
      if (p.scale < 0.8) p.scale = THREE.MathUtils.lerp(p.scale, 0.8, Math.min(cappedDt * 2.0, 1.0));
      p.pos.z -= Math.sin(p.pos.y) * 0.0006 * k;
      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (p.pos.y < bounds.yMin) respawn(p);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function dispose() {
    scene.remove(mesh);
    mesh.geometry.dispose();
    material.dispose();
  }

  return { mesh, update, dispose };
}
