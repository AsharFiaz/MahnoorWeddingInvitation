/* lights.js — warm string lights hung between the pavilion columns.
 *
 * Adapted from Elemental-Serenity (src/Game/World/Components/FireFlies/
 * FireFlies.class.js and src/Shaders/Materials/fireflies/*.glsl, MIT, Sahil K
 * 2026). The Points mesh, the additive sprite material, the curl-noise flow
 * and the flicker keyed to the sprite's green channel are the original's.
 * Changed: the points sit on catenaries between the columns instead of a
 * random ring, the drift and jitter are scaled down through a uniform so the
 * bulbs shimmer rather than wander, the colours are warm gold, and the
 * sprite is drawn on a canvas instead of loaded.
 */

import * as THREE from 'three';
import { mulberry32 } from '../core/rng.js';

const VERT = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uMotion;
attribute float aScale;
varying float vColorMix;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
vec3 fbm_vec3(vec3 p, float frequency, float offset) {
  return vec3(cnoise((p + vec3(offset)) * frequency), cnoise((p + vec3(offset + 20.0)) * frequency), cnoise((p + vec3(offset - 30.0)) * frequency));
}
float hash1(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }

void main() {
  vec3 pos = position;
  float colorMix = cnoise(pos * 0.3) * 0.5 + 0.5;
  vColorMix = colorMix;
  float phase = hash1(pos) * 6.28318530718;
  float baseSize = (cnoise(pos * 0.45) * 0.5 + 0.5);
  float particleSize = 0.7 + 0.5 * baseSize;
  /* the original's drift and jitter, scaled by uMotion so a bulb on a wire
     sways a few millimetres instead of a metre */
  vec3 seedVec = fbm_vec3(pos * 0.35, 1.0, 10.0);
  float seed = hash1(pos + vec3(7.0));
  vec3 driftDir = normalize(seedVec + vec3(0.001));
  float driftFreq = 0.6 + 0.8 * seed;
  vec3 drift = driftDir * sin(uTime * driftFreq + phase * 0.5) * (0.02 * uMotion);
  vec3 jitterNoise = fbm_vec3(pos * 4.0 + vec3(uTime * 0.45), 2.0, 3.0);
  vec3 jitter = (jitterNoise - 0.5) * (0.01 * uMotion);
  vec3 particleWorld = pos + drift + jitter;
  vec4 viewPosition = viewMatrix * vec4((modelMatrix * vec4(particleWorld, 1.0)).xyz, 1.0);
  gl_Position = projectionMatrix * viewPosition;
  float finalSize = uSize * particleSize * aScale * uPixelRatio * 100.0;
  gl_PointSize = finalSize * (1.0 / -viewPosition.z);
}`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform sampler2D uTexture;
varying float vColorMix;
void main() {
  vec4 particlesTexture = texture2D(uTexture, gl_PointCoord);
  vec3 color1 = vec3(0.98, 0.78, 0.40);
  vec3 color2 = vec3(0.93, 0.62, 0.22);
  vec3 starColor = mix(color1, color2, vColorMix);
  float speed = 6.0;
  float sharpness = 3.0;
  float baseline = 0.8;
  float intensity = 1.4;
  float phase = particlesTexture.g * 6.28318530718;
  float flicker = 0.5 + 0.5 * sin(uTime * speed + phase);
  float brightness = mix(baseline, 1.0, pow(flicker, sharpness)) * intensity;
  starColor *= brightness;
  gl_FragColor = vec4(starColor, pow(particlesTexture.r, 0.7));
}`;

/* Red: a soft disc. Green: a per-sprite phase, read by the flicker. */
function spriteTexture(rnd) {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(s, s);
  const phase = Math.floor(rnd() * 255);
  for (let y = 0; y < s; y += 1) {
    for (let x = 0; x < s; x += 1) {
      const dx = (x + 0.5) / s - 0.5; const dy = (y + 0.5) / s - 0.5;
      const d = Math.sqrt(dx * dx + dy * dy) * 2;
      const a = Math.max(0, 1 - d);
      const o = (y * s + x) * 4;
      img.data[o] = Math.round(Math.pow(a, 1.6) * 255);
      img.data[o + 1] = phase;
      img.data[o + 2] = 0;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

/* Points along a sagging wire from a to b. */
function catenary(a, b, sag, n, out) {
  for (let i = 0; i < n; i += 1) {
    const t = (i + 0.5) / n;
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[2] + (b[2] - a[2]) * t;
    const y = a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t);
    out.push(x, y, z);
  }
}

export function createStringLights(scene, wires, { seed = 3, perWire = 10, sag = 0.3, size = 0.22 } = {}) {
  const rnd = mulberry32(seed);
  const pos = [];
  for (const [a, b] of wires) catenary(a, b, sag, perWire, pos);
  const count = pos.length / 3;
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i += 1) scales[i] = 0.8 + rnd() * 0.4;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: spriteTexture(rnd) },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uSize: { value: size },
      uMotion: { value: 1 },
    },
    depthWrite: false,
    depthTest: true,
    transparent: true,
    /* normal blending: additive bulbs vanish against a cream sky */
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  /* A tiny warm bulb at each point, so the lights read in daylight too; the
     shader above is their halo and flicker. */
  const bulbGeo = new THREE.SphereGeometry(0.02, 10, 8);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1cc, emissive: 0xffb95a, emissiveIntensity: 1.6, roughness: 0.4 });
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, count);
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i += 1) {
    d.position.set(pos[i * 3], pos[i * 3 + 1] - 0.012, pos[i * 3 + 2]);
    d.updateMatrix();
    bulbs.setMatrixAt(i, d.matrix);
  }
  bulbs.instanceMatrix.needsUpdate = true;
  scene.add(bulbs);

  /* The wires themselves: thin dark-gold lines so the bulbs hang from
     something. */
  const linePos = [];
  for (const [a, b] of wires) {
    const seg = 16;
    for (let i = 0; i <= seg; i += 1) {
      const t = i / seg;
      linePos.push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t);
      if (i > 0 && i < seg) linePos.push(linePos[linePos.length - 3], linePos[linePos.length - 2], linePos[linePos.length - 1]);
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
  const line = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x8a6a2b, transparent: true, opacity: 0.55 }));
  scene.add(line);

  return {
    points,
    update(time) { material.uniforms.uTime.value = time; },
    setPixelRatio(r) { material.uniforms.uPixelRatio.value = Math.min(r, 2); },
    dispose() { scene.remove(points, line, bulbs); geometry.dispose(); material.dispose(); lineGeo.dispose(); bulbGeo.dispose(); bulbMat.dispose(); },
  };
}
