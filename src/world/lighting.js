/* lighting.js — key, fill, rim and ambient light with one shadow map.
 *
 * Adapted from Elemental-Serenity (src/Game/World/Components/Lighting/
 * Lighting.class.js, MIT, Sahil K 2026). The four-light rig, the preset
 * table and the shadow-camera setup are the original's; the day and night
 * presets, the season manager, the environment cube maps and the debug GUI
 * are gone. One preset remains, a warm late-afternoon light for cream, ivory
 * and gold, and the shadow frustum is sized to the book and the dais rather
 * than a campsite.
 */

import * as THREE from 'three';

const PRESET = {
  key: { color: 0xffeccf, intensity: 2.6, position: [-3.2, 4.6, 3.4], castShadow: true },
  fill: { color: 0xf7e3c4, intensity: 0.75, position: [3.4, 2.6, 2.2], castShadow: false },
  rim: { color: 0xffd9a6, intensity: 0.55, position: [1.5, 3.2, -4.5], castShadow: false },
  ambient: { color: 0xfff4e6, intensity: 0.3 },
  hemisphere: { sky: 0xfff3e2, ground: 0xcdb68c, intensity: 0.45 },
};

export function createLighting(scene, { shadows = true, shadowSize = 1024 } = {}) {
  const lights = {};

  lights.key = new THREE.DirectionalLight(PRESET.key.color, PRESET.key.intensity);
  lights.key.name = 'keyLight';
  lights.key.position.set(...PRESET.key.position);
  lights.key.castShadow = shadows && PRESET.key.castShadow;
  scene.add(lights.key);
  scene.add(lights.key.target);

  lights.fill = new THREE.DirectionalLight(PRESET.fill.color, PRESET.fill.intensity);
  lights.fill.name = 'fillLight';
  lights.fill.position.set(...PRESET.fill.position);
  scene.add(lights.fill);

  lights.rim = new THREE.DirectionalLight(PRESET.rim.color, PRESET.rim.intensity);
  lights.rim.name = 'rimLight';
  lights.rim.position.set(...PRESET.rim.position);
  scene.add(lights.rim);

  lights.ambient = new THREE.AmbientLight(PRESET.ambient.color, PRESET.ambient.intensity);
  scene.add(lights.ambient);

  lights.hemi = new THREE.HemisphereLight(PRESET.hemisphere.sky, PRESET.hemisphere.ground, PRESET.hemisphere.intensity);
  scene.add(lights.hemi);

  /* configureShadows(), with the frustum pulled in to the dais. */
  if (lights.key.castShadow) {
    const frustum = 3.2;
    lights.key.shadow.mapSize.set(shadowSize, shadowSize);
    lights.key.shadow.camera.left = -frustum;
    lights.key.shadow.camera.right = frustum;
    lights.key.shadow.camera.top = frustum;
    lights.key.shadow.camera.bottom = -frustum;
    lights.key.shadow.camera.near = 0.5;
    lights.key.shadow.camera.far = 14;
    lights.key.shadow.bias = -0.0002;
    lights.key.shadow.normalBias = 0.02;
    lights.key.shadow.radius = 2;
  }

  return lights;
}
