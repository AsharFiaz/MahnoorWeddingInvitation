/* reveal.js — the opening: a cream veil that dissolves into the scene.
 *
 * Adapted from Elemental-Serenity (src/reveal.js and
 * src/Shaders/Materials/reveal/*.glsl, MIT, Sahil K 2026). The fbm noise,
 * the radial bias and the progress mapping are the original fragment shader;
 * the raw-WebGL program setup is the original's too, trimmed of its text
 * overlay and run from book time instead of a wall clock so a seek lands on
 * the right frame. It starts on its own; there is no button to press.
 */

const VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform float uTime;
uniform float uProgress;
uniform vec2 uResolution;
varying vec2 vUv;

float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * noise(st);
    st *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 st = vUv;
  float time = uTime * 0.3;
  float n1 = fbm(st * 4.0 + time);
  float n2 = fbm(st * 8.0 - time * 0.7);
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(st, center);
  float pattern = mix(n1, n2, 0.5) * 0.4;
  float reveal = uProgress * 1.2 + pattern - dist * 0.6;
  reveal = smoothstep(0.0, 0.3, reveal);
  float alpha = 1.0 - reveal;
  alpha = smoothstep(0.0, 0.05, alpha);
  /* the invitation's cream, where the campsite used a pale grey */
  vec3 color = vec3(0.969, 0.945, 0.902);
  gl_FragColor = vec4(color, alpha);
}`;

export function createReveal(canvas, { duration = 3.2, delay = 0.4 } = {}) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
  const api = { done: false, update, resize, dispose };
  if (!gl) { canvas.hidden = true; api.done = true; return api; }

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }
  const vs = shader(gl.VERTEX_SHADER, VERT);
  const fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.hidden = true; api.done = true; return api; }
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);
  const u = {
    time: gl.getUniformLocation(program, 'uTime'),
    progress: gl.getUniformLocation(program, 'uProgress'),
    resolution: gl.getUniformLocation(program, 'uResolution'),
  };
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.floor((window.innerWidth || 390) * dpr));
    const h = Math.max(1, Math.floor((window.innerHeight || 844) * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }

  /* `time` is book time. The veil holds for `delay`, dissolves over
     `duration`, then the canvas is removed from the layout for good. */
  function update(time) {
    if (api.done) return;
    const p = Math.min(1, Math.max(0, (time - delay) / duration));
    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.time, time);
    gl.uniform1f(u.progress, p);
    gl.uniform2f(u.resolution, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (p >= 1) { api.done = true; canvas.hidden = true; }
  }

  function dispose() {
    api.done = true;
    canvas.hidden = true;
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }

  resize();
  return api;
}
