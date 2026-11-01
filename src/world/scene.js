/* scene.js — renderer, air, light and the setting, assembled.
 *
 * The renderer policy (probe the GPU string once, cap the pixel ratio on
 * integrated parts, ACES once, no shadow maps on the pages) is adapted from
 * spring-bloom (js/scene.js, MIT, Abdelrahman Shaaban 2026); the desk, lamp,
 * props and post chain are not used. The lighting, lawn, string lights,
 * petals, sky and reveal are the Elemental-Serenity ports in this folder.
 * The dais and pavilion are this project's own.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createLighting } from './lighting.js';
import { createSky } from './sky.js';
import { createGrass } from './grass.js';
import { createStringLights } from './lights.js';
import { createPetals } from './petals.js';
import { createPavilion, COLUMNS } from './pavilion.js';
import { planter, lantern, sway, mergeStatic } from '../popup/pieces.js';

const AIR = 0xf7efe0;

/* spring-bloom's GPU tier probe: decided once at boot from the GPU string. */
function probeGpu(renderer) {
  let name = '';
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) name = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
  } catch (err) {
    name = '';
  }
  let tier = 'unknown';
  if (/nvidia|geforce|quadro|\brtx\b|\bgtx\b|radeon|\bamd\b|arc\(tm\)|intel.*\barc\b/i.test(name)) tier = 'discrete';
  else if (/intel|iris|\buhd\b|mali|adreno|powervr|apple|swiftshader|llvmpipe|videocore/i.test(name)) tier = 'integrated';
  return { tier, name };
}

export function createScene({ canvas, camera, seed = 7, reduced = false }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  const gpu = probeGpu(renderer);
  const dprCap = gpu.tier === 'integrated' ? 1.5 : 2;
  if (!renderer.userData) renderer.userData = {};
  renderer.userData.gpuTier = gpu.tier;
  renderer.userData.gpuName = gpu.name;
  renderer.userData.dprCap = dprCap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(AIR);
  scene.fog = new THREE.Fog(AIR, 17, 38);

  /* A neutral room environment gives the gold something to reflect. */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const lights = createLighting(scene, { shadows: true, shadowSize: gpu.tier === 'discrete' ? 2048 : 1024 });
  const sky = createSky(scene, { ground: AIR, horizon: 0xfaf1e1, zenith: 0xecd9bd });
  const pavilion = createPavilion(scene, { seed });
  const grass = createGrass(scene, { seed: seed + 1, count: gpu.tier === 'discrete' ? 16000 : 11000 });
  const stringLights = createStringLights(scene, pavilion.wires, { seed: seed + 2 });

  /* Floral planters and lanterns at the column feet, built with the same
     paper-craft pieces that later stand on the pages, so the setting and
     the chapters share one material language. */
  const dressing = new THREE.Group();
  dressing.name = 'dressing';
  dressing.position.y = -0.12;
  const wind = [];
  for (const [x, z] of COLUMNS) {
    const inward = x > 0 ? -1 : 1;
    const forward = z > 0 ? -1 : 1;
    planter(dressing, x + inward * 0.42, z + forward * 0.1, 1.1, { accent: '#d8b97a' });
    planter(dressing, x + inward * 0.1, z + forward * 0.45, 0.8, { accent: '#f0d9b5' });
    lantern(dressing, x + inward * 0.7, z + forward * 0.55, 0.95, 1);
  }
  /* the panes stay separate so their emissive material survives the merge */
  scene.add(mergeStatic(dressing));
  const petals = reduced ? null : createPetals(scene, {
    originX: -2.0, originZ: -0.6, xRange: 1.6, zRange: 2.4, yMin: -0.1, yMax: 2.4,
  }, { seed: seed + 3, count: 18 });
  const petals2 = reduced ? null : createPetals(scene, {
    originX: 2.0, originZ: -0.6, xRange: 1.6, zRange: 2.4, yMin: -0.1, yMax: 2.4,
  }, { seed: seed + 4, count: 18 });

  function setSize(w, h, dpr) {
    const r = dpr || Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(r);
    renderer.setSize(w, h, false);
    stringLights.setPixelRatio(r);
  }

  function update(dt, time) {
    grass.update(time);
    stringLights.update(time);
    if (petals && dt > 0) { petals.update(dt); petals2.update(dt); }
    sway(wind, time, 0.5);
  }

  function render() {
    renderer.info.reset();
    renderer.render(scene, camera);
  }

  return {
    renderer,
    scene,
    gpu,
    lights,
    sky,
    pavilion,
    grass,
    stringLights,
    petals,
    setSize,
    update,
    render,
  };
}
