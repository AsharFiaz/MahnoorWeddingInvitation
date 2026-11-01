/* sky.js — a gradient dome: zenith, horizon, ground.
 *
 * Adapted from Elemental-Serenity (src/Game/World/Components/Skydome/
 * Skydome.class.js and src/Shaders/Materials/skydome/*.glsl, MIT, Sahil K
 * 2026). The inside-out sphere, the vertex shader and the three-colour
 * gradient by view direction are the original's; the sun, moon, rays,
 * stars and seasons are removed. The colours are an ivory dusk so the lawn
 * dissolves into a warm sky with no horizon line.
 */

import * as THREE from 'three';

const VERT = /* glsl */ `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = normalize(worldPosition.xyz - cameraPosition);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */ `
uniform vec3 uZenithColor;
uniform vec3 uHorizonColor;
uniform vec3 uGroundColor;
uniform float uAtmosphereIntensity;
varying vec3 vWorldPosition;
void main() {
  vec3 dir = normalize(vWorldPosition);
  float h = dir.y;
  float up = smoothstep(0.0, 0.55, h);
  float down = smoothstep(0.0, -0.25, h);
  vec3 color = mix(uHorizonColor, uZenithColor, pow(up, 0.8 * uAtmosphereIntensity));
  color = mix(color, uGroundColor, down);
  gl_FragColor = vec4(color, 1.0);
}`;

export function createSky(scene, {
  radius = 60,
  zenith = 0xeedfc8,
  horizon = 0xfbf4e7,
  ground = 0xefe4cc,
} = {}) {
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uZenithColor: { value: new THREE.Color(zenith) },
      uHorizonColor: { value: new THREE.Color(horizon) },
      uGroundColor: { value: new THREE.Color(ground) },
      uAtmosphereIntensity: { value: 1.0 },
    },
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  scene.add(mesh);
  return { mesh, material, dispose() { scene.remove(mesh); mesh.geometry.dispose(); material.dispose(); } };
}
