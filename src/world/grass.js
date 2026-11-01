/* grass.js — the lawn: one instanced mesh of blades bending in a shared wind.
 *
 * Adapted from Elemental-Serenity (src/Game/World/Managers/GrassManager/
 * GrassManager.class.js and src/Shaders/Chunks/grass/*.glsl, MIT, Sahil K
 * 2026). Kept: the single InstancedMesh with per-instance base scale and
 * world position attributes, the MeshStandardMaterial patched through
 * onBeforeCompile, the fbm wind field (`calculateWindVector`), the bend
 * about an axis perpendicular to the wind that grows with the square of
 * height, the camera-facing rotation of each blade, and the dark-to-light
 * colour masked up the blade. Changed: the blade is a small procedural strip
 * rather than a GLB, density comes from a radial function around the dais
 * instead of a painted map, the terrain normal map is dropped (the lawn is
 * flat), and the colours are sand, ivory and gold rather than green.
 */

import * as THREE from 'three';
import { mulberry32 } from '../core/rng.js';

const VERTEX_COMMON = /* glsl */ `
#include <common>
attribute float aBaseScale;
attribute vec2 aWorldPosition;
uniform float uTime;
uniform float uWindSpeed;
uniform float uWindAmplitude;
uniform float uWindWaveTiling;
uniform float uWindWaveStrength;
uniform float uWindBaseTiling;
uniform float uWindBaseStrength;
uniform float uBladeHeight;
varying float vBladeMask;
varying float vTip;
varying float vShade;

vec2 rotateUV(vec2 uv, float angle, vec2 center) {
  float s = sin(angle);
  float c = cos(angle);
  uv -= center;
  uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
  uv += center;
  return uv;
}
float noise2D(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float smoothNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = noise2D(i);
  float b = noise2D(i + vec2(1.0, 0.0));
  float c = noise2D(i + vec2(0.0, 1.0));
  float d = noise2D(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p, float lacunarity) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 1; i++) {
    value += amplitude * smoothNoise2D(p);
    p *= lacunarity;
    amplitude *= 0.5;
  }
  return value;
}
vec2 calculateWindVector(vec3 worldPos) {
  vec2 windWavePos = worldPos.xz * uWindWaveTiling;
  float windWaveTime = uTime * uWindSpeed;
  float wave1 = fbm(windWavePos - vec2(windWaveTime * 0.35, windWaveTime), 3.0);
  float wave2 = fbm(windWavePos - vec2(0.0, windWaveTime * 0.35), 2.0);
  float primaryWave = (wave1 + wave2) * 0.5 * uWindWaveStrength;
  vec2 windBasePos = worldPos.xz * uWindBaseTiling;
  float baseWaveTime = uTime * (uWindSpeed * 0.93);
  float baseWave = fbm(windBasePos - vec2(baseWaveTime, 0.0), 2.0) * uWindBaseStrength;
  float windStrength = (primaryWave + baseWave) * uWindAmplitude;
  vec2 windDir;
  windDir.x = windStrength;
  windDir.y = windStrength * 0.3 * sin(windWaveTime * 0.5);
  return windDir;
}
mat3 rotateAxis(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat3(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
              oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
              oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c);
}
`;

const VERTEX_BEGIN_NORMAL = /* glsl */ `
vec4 baseWorldPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
vec2 windVector = calculateWindVector(baseWorldPos.xyz);
float windMagnitude = length(windVector);
vec3 windDir3D = normalize(vec3(windVector.x, 0.0, windVector.y) + vec3(1e-5, 0.0, 0.0));
vec3 rotationAxis = cross(windDir3D, vec3(0.0, 1.0, 0.0));
float heightFactor = position.y / uBladeHeight;
float bendAngle = windMagnitude * heightFactor * heightFactor * 2.0;
vec3 terrainNormal = vec3(0.0, 1.0, 0.0);
if (windMagnitude > 0.001) {
  mat3 bendRotation = rotateAxis(rotationAxis, bendAngle);
  terrainNormal = bendRotation * terrainNormal;
}
#include <beginnormal_vertex>
/* the original's trick: every blade takes the ground's normal, so the lawn
   shades as one soft surface instead of thousands of lit slivers */
objectNormal = terrainNormal;
`;

const VERTEX_BEGIN = /* glsl */ `
#include <begin_vertex>
/* +90 degrees rather than the original's -90: the plane's front face then
   looks at the camera, so the lawn can be single-sided and always lit */
float angleToCamera = atan(baseWorldPos.z - cameraPosition.z, baseWorldPos.x - cameraPosition.x) + 1.5707963267948966;
transformed.xz = rotateUV(transformed.xz, angleToCamera, vec2(0.0));
transformed *= aBaseScale;
vBladeMask = clamp(position.y / uBladeHeight, 0.0, 1.0);
vTip = smoothstep(0.78, 1.0, vBladeMask);
/* per-blade tone from its position, so the pile has grain rather than one flat colour */
vShade = 0.72 + 0.28 * noise2D(aWorldPosition * 13.7);
if (windMagnitude > 0.001) {
  mat3 bendRotation = rotateAxis(rotationAxis, bendAngle);
  transformed = bendRotation * transformed;
}
`;

const FRAGMENT_COMMON = /* glsl */ `
#include <common>
uniform vec3 uGrassColorDark;
uniform vec3 uGrassColorLight;
uniform vec3 uShadowColor;
uniform vec3 uTipColor;
varying float vBladeMask;
varying float vTip;
varying float vShade;
`;

const FRAGMENT_COLOR = /* glsl */ `
#include <color_fragment>
vec3 grassColor = mix(uGrassColorDark, uGrassColorLight, vBladeMask);
float mask = smoothstep(0.2, 0.98, vBladeMask);
mask = pow(mask, 0.5);
grassColor = mix(uShadowColor, grassColor, clamp(mask, 0.0, 1.0));
grassColor = mix(grassColor, uTipColor, vTip * 0.55);
diffuseColor.rgb = grassColor * vShade;
`;

/* A blade: a tapered strip, three segments high, with its foot at y = 0. */
function bladeGeometry(height = 0.17, width = 0.028) {
  const g = new THREE.PlaneGeometry(width, height, 1, 3);
  g.translate(0, height / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    const y = p.getY(i) / height;
    p.setX(i, p.getX(i) * (1 - y * 0.92));
    p.setZ(i, y * y * 0.02);
  }
  g.computeVertexNormals();
  return g;
}

export function createGrass(scene, {
  seed = 5,
  count = 11000,
  innerRadius = 1.92,
  outerRadius = 7.0,
  fadeFrom = 4.6,
  y = -0.12,
  colors = { dark: 0xd0c199, light: 0xede2c9, shadow: 0xa8936a, tip: 0xd3b872 },
} = {}) {
  const rnd = mulberry32(seed);
  const height = 0.105;
  const geometry = bladeGeometry(height, 0.03);

  const uniforms = {
    uTime: { value: 0 },
    uWindSpeed: { value: 1.1 },
    uWindAmplitude: { value: 0.8 },
    uWindWaveTiling: { value: 0.9 },
    uWindWaveStrength: { value: -0.5 },
    uWindBaseTiling: { value: 0.3 },
    uWindBaseStrength: { value: 1.0 },
    uBladeHeight: { value: height },
    uGrassColorDark: { value: new THREE.Color(colors.dark) },
    uGrassColorLight: { value: new THREE.Color(colors.light) },
    uShadowColor: { value: new THREE.Color(colors.shadow) },
    uTipColor: { value: new THREE.Color(colors.tip) },
  };

  const material = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, side: THREE.FrontSide });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', VERTEX_COMMON)
      .replace('#include <beginnormal_vertex>', VERTEX_BEGIN_NORMAL)
      .replace('#include <begin_vertex>', VERTEX_BEGIN);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', FRAGMENT_COMMON)
      .replace('#include <color_fragment>', FRAGMENT_COLOR);
  };

  /* Scatter in an annulus around the dais, thinning toward the far edge so
     the lawn dissolves into the fog rather than stopping at a line. */
  const positions = [];
  const scales = [];
  const r2in = innerRadius * innerRadius;
  const r2out = outerRadius * outerRadius;
  let guard = 0;
  while (positions.length < count && guard < count * 4) {
    guard += 1;
    const r = Math.sqrt(rnd() * (r2out - r2in) + r2in);
    const keep = r < fadeFrom ? 1 : 1 - (r - fadeFrom) / (outerRadius - fadeFrom);
    if (rnd() > keep) continue;
    const a = rnd() * Math.PI * 2;
    positions.push([Math.cos(a) * r, Math.sin(a) * r]);
    scales.push(0.7 + rnd() * 0.6);
  }
  const total = positions.length;
  const mesh = new THREE.InstancedMesh(geometry, material, total);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.frustumCulled = false;
  const baseScales = new Float32Array(total);
  const worldPositions = new Float32Array(total * 2);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < total; i += 1) {
    const [x, z] = positions[i];
    baseScales[i] = scales[i];
    worldPositions[i * 2] = x;
    worldPositions[i * 2 + 1] = z;
    dummy.position.set(x, 0, z);
    dummy.rotation.y = rnd() * Math.PI;
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  geometry.setAttribute('aBaseScale', new THREE.InstancedBufferAttribute(baseScales, 1));
  geometry.setAttribute('aWorldPosition', new THREE.InstancedBufferAttribute(worldPositions, 2));
  mesh.position.y = y;
  scene.add(mesh);

  return {
    mesh,
    uniforms,
    update(time) { uniforms.uTime.value = time; },
    dispose() { scene.remove(mesh); geometry.dispose(); material.dispose(); },
  };
}
