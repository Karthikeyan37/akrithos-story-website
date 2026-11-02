/**
 * The Akrithos work engine: one WebGL scene behind the opening story.
 *
 * What it shows, chapter by chapter (scroll drives `setProgress(0..4)`):
 *   0  The Akrithos peak (the mark from the logo) glowing at the centre, work drifting around it.
 *   1  Work arrives from everywhere: requests, invoices, calls, questions, swirling and unsorted.
 *   2  Agents take the repeat work: the swirl settles into four orbits, one per kind of agent.
 *   3  Inside your boundary: a shell closes around the system; nothing leaves it.
 *   4  Your people decide: finished work streams out through a gate a person holds, and only then turns to outcome.
 *
 * Built in code (no downloaded models or video), so it loads fast and every light is in the brand's colours.
 * Phones get fewer particles and no bloom; reduced motion gets still frames; a failed WebGL context leaves the poster.
 */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type WorldOptions = {
  lite: boolean;
  reduced: boolean;
  /** Called once per frame with each agent node's screen position, then the gate's (for the HTML labels). */
  onLabels?: (labels: Array<{ x: number; y: number; visible: boolean }>) => void;
};

export type World = {
  setProgress(p: number): void;
  setPointer(x: number, y: number): void;
  setActive(active: boolean): void;
  focusAgent(index: number | null): void;
  readonly fps: number;
  destroy(): void;
};

const COLORS = {
  bg: new THREE.Color("#0C0E11"),
  ember: new THREE.Color("#E8714A"),
  terracotta: new THREE.Color("#BE4C33"),
  gold: new THREE.Color("#D4A35F"),
  stone: new THREE.Color("#A8A396"),
};

/** Everything that drifts moves at under half its original speed: visitor feedback found the fast dots distracting. */
const CALM = 0.42;

/** Where each chapter puts the camera and how far each effect has gone. */
type Beat = { pos: [number, number, number]; look: [number, number, number]; agit: number; order: number; boundary: number; gate: number; flow: number; glow: number };
const BEATS: Beat[] = [
  { pos: [-0.6, 0.9, 10.5], look: [-2.6, 0.3, 0], agit: 0.35, order: 0.12, boundary: 0, gate: 0, flow: 0, glow: 0.75 },
  { pos: [0.4, 1.6, 12.5], look: [-2.4, 0, 0], agit: 0.55, order: 0, boundary: 0, gate: 0, flow: 0, glow: 0.35 },
  { pos: [1.4, 3.2, 10.2], look: [3.3, 0.1, 0], agit: 0.15, order: 1, boundary: 0, gate: 0, flow: 0, glow: 0.8 },
  { pos: [-0.5, 4.6, 17.5], look: [-4.2, 0, 0], agit: 0.1, order: 1, boundary: 1, gate: 0, flow: 0, glow: 0.7 },
  { pos: [1.0, 1.0, 15.5], look: [-1.2, 0.1, 0], agit: 0.05, order: 0.45, boundary: 0.35, gate: 1, flow: 1, glow: 0.8 },
];

/** The four agent orbits (radius, tilt, yaw, speed), matching the four systems in the showcase. */
const RINGS = [
  { r: 2.1, tilt: 1.18, yaw: 0.2, speed: 0.42 },
  { r: 2.65, tilt: 1.42, yaw: 1.3, speed: -0.33 },
  { r: 3.2, tilt: 1.05, yaw: 2.4, speed: 0.27 },
  { r: 3.75, tilt: 1.62, yaw: -0.7, speed: -0.22 },
];
const GATE_X = 3.2;

const PARTICLE_VERTEX = /* glsl */ `
  attribute vec4 aSeed;
  attribute float aRing;
  attribute float aPhase;
  attribute float aLane;
  uniform float uTime, uAgit, uOrder, uFlow, uSize, uFocus;
  uniform vec4 uRingR, uRingTilt, uRingYaw, uRingSpeed;
  uniform float uGateX;
  varying vec3 vColor;
  varying float vAlpha;
  uniform vec3 uChaos, uOrdered, uOut, uFocusColor;

  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
  float pick(vec4 v, float i) { return i < 0.5 ? v.x : i < 1.5 ? v.y : i < 2.5 ? v.z : v.w; }

  void main() {
    // Unsorted work: a loose cloud that churns harder when agitated.
    float th = aSeed.y * 6.2831 + uTime * (0.05 + aSeed.z * 0.12);
    float ph = acos(2.0 * aSeed.z - 1.0);
    float rad = 4.2 + aSeed.x * 4.8;
    vec3 chaos = vec3(sin(ph) * cos(th), cos(ph) * 0.62, sin(ph) * sin(th)) * rad;
    chaos += vec3(sin(uTime * 0.6 + aSeed.w * 40.0), cos(uTime * 0.5 + aSeed.x * 30.0), sin(uTime * 0.4 + aSeed.y * 20.0)) * (0.06 + 0.24 * uAgit);

    // Sorted work: riding one of the four agent orbits.
    float r = pick(uRingR, aRing), tilt = pick(uRingTilt, aRing), yaw = pick(uRingYaw, aRing), sp = pick(uRingSpeed, aRing);
    float a = aPhase + uTime * sp;
    vec3 orbit = rotY(yaw) * rotX(tilt) * vec3(cos(a) * r, (aSeed.x - 0.5) * 0.12, sin(a) * r);

    // Finished work: half the particles stream out along lanes through the gate a person holds.
    float lanes = step(0.35, aSeed.w) * uFlow;
    float x = mod(aPhase / 6.2831 * 9.0 + uTime * 0.8, 9.0) - 0.6;
    float spread = smoothstep(0.0, 2.2, x);
    float squeeze = 1.0 - 0.72 * exp(-pow(x - uGateX, 2.0) * 1.2);
    vec3 lane = vec3(x, (aLane - 0.5) * 2.4 * spread * squeeze, (aSeed.y - 0.5) * 1.2 * spread * squeeze);

    vec3 p = mix(mix(chaos, orbit, uOrder), lane, lanes);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.55 + aSeed.x * 0.9) / -mv.z;

    float passed = lanes * smoothstep(uGateX - 0.2, uGateX + 0.6, x);
    vec3 c = mix(uChaos, uOrdered, uOrder);
    c = mix(c, uOut, passed);
    float focused = uFocus >= 0.0 && abs(aRing - uFocus) < 0.5 ? 1.0 : 0.0;
    c = mix(c, uFocusColor, focused * uOrder * 0.85);
    vColor = c;
    vAlpha = (0.35 + 0.65 * aSeed.z) * smoothstep(26.0, 6.0, -mv.z) * (1.0 + focused * 0.6);
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * vAlpha);
  }
`;

function glowTexture(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The peak from the Akrithos mark, extruded: an open chevron with bevelled edges. */
function peakGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-1.15, -0.9);
  s.lineTo(0, 1.25);
  s.lineTo(1.15, -0.9);
  s.lineTo(0.66, -0.9);
  s.lineTo(0, 0.38);
  s.lineTo(-0.66, -0.9);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 4 });
  g.center();
  return g;
}

export function createWorld(canvas: HTMLCanvasElement, opts: WorldOptions): World {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.lite, powerPreference: "high-performance", alpha: false });
  let dpr = Math.min(window.devicePixelRatio || 1, opts.lite ? 1.4 : 1.75);
  renderer.setPixelRatio(dpr);
  // Shader checks stall on the GPU and echo harmless driver notes; keep them for development, where they catch real errors.
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = COLORS.bg.clone();
  scene.fog = new THREE.FogExp2(COLORS.bg.getHex(), 0.035);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);

  // Light: a soft key, a warm ember heart in the peak, a gold rim, and one that follows the cursor.
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 6, 6);
  const heart = new THREE.PointLight(COLORS.ember, 18, 9, 1.6);
  const rim = new THREE.PointLight(COLORS.gold, 22, 14, 1.4);
  rim.position.set(-3.5, 2.5, -3);
  const cursor = new THREE.PointLight(0xffe2c8, 0, 10, 1.6);
  scene.add(new THREE.AmbientLight(0x2a2f38, 0.6), key, heart, rim, cursor);

  // The peak.
  const peakMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#9C4A30"), metalness: 0.92, roughness: 0.26, clearcoat: 0.6, clearcoatRoughness: 0.25, emissive: COLORS.ember, emissiveIntensity: 0.12 });
  const peak = new THREE.Mesh(peakGeometry(), peakMat);
  const core = new THREE.Group();
  core.add(peak);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(232,113,74,0.9)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }));
  halo.scale.setScalar(5.5);
  halo.position.z = -0.6;
  core.add(halo);
  scene.add(core);

  // The four agent orbits, each with an agent riding it.
  const ringGroup = new THREE.Group();
  const ringMats: THREE.MeshBasicMaterial[] = [];
  const nodes: THREE.Mesh[] = [];
  RINGS.forEach((ring) => {
    const holder = new THREE.Group();
    holder.rotation.order = "YXZ";
    holder.rotation.y = ring.yaw;
    holder.rotation.x = ring.tilt;
    const mat = new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    ringMats.push(mat);
    // Torus lies in XY; turn it into the orbit plane (XZ before tilt) to match the particle orbits.
    const torus = new THREE.Mesh(new THREE.TorusGeometry(ring.r, 0.012, 6, 160), mat);
    torus.rotation.x = Math.PI / 2;
    holder.add(torus);
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0 }));
    const nodeGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(212,163,95,1)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    nodeGlow.scale.setScalar(0.9);
    node.add(nodeGlow);
    holder.add(node);
    nodes.push(node);
    ringGroup.add(holder);
  });
  scene.add(ringGroup);

  // Work: one particle per piece of work.
  const N = opts.lite ? 600 : 1600;
  const geo = new THREE.BufferGeometry();
  const seed = new Float32Array(N * 4), ringIdx = new Float32Array(N), phase = new Float32Array(N), laneA = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    seed.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    ringIdx[i] = i % 4;
    phase[i] = Math.random() * Math.PI * 2;
    laneA[i] = Math.floor(Math.random() * 5) / 4;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  geo.setAttribute("aRing", new THREE.BufferAttribute(ringIdx, 1));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geo.setAttribute("aLane", new THREE.BufferAttribute(laneA, 1));
  const uniforms = {
    uTime: { value: 0 }, uAgit: { value: 0.4 }, uOrder: { value: 0 }, uFlow: { value: 0 }, uFocus: { value: -1 },
    uSize: { value: (opts.lite ? 70 : 90) * dpr },
    uRingR: { value: new THREE.Vector4(...RINGS.map((r) => r.r)) },
    uRingTilt: { value: new THREE.Vector4(...RINGS.map((r) => r.tilt)) },
    uRingYaw: { value: new THREE.Vector4(...RINGS.map((r) => r.yaw)) },
    uRingSpeed: { value: new THREE.Vector4(...RINGS.map((r) => r.speed)) },
    uGateX: { value: GATE_X },
    uChaos: { value: new THREE.Color("#8F8A80") },
    uOrdered: { value: COLORS.gold.clone() },
    uOut: { value: COLORS.ember.clone() },
    uFocusColor: { value: new THREE.Color("#FFB98F") },
  };
  const particles = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: PARTICLE_VERTEX, fragmentShader: PARTICLE_FRAGMENT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  particles.frustumCulled = false;
  scene.add(particles);

  // The boundary: a faceted shell that closes around the system.
  const shellMat = new THREE.LineBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(6.4, 1)), shellMat);
  scene.add(shell);

  // The gate a person holds: work only becomes an outcome after passing through it.
  const gateMat = new THREE.MeshStandardMaterial({ color: COLORS.gold, emissive: COLORS.gold, emissiveIntensity: 0, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0 });
  const gate = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.06, 16, 120), gateMat);
  gate.position.x = GATE_X;
  gate.rotation.y = Math.PI / 2;
  const gateGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(212,163,95,0.8)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  gateGlow.scale.setScalar(4.2);
  gateGlow.position.x = GATE_X;
  scene.add(gate, gateGlow);

  // A warm pool of light under everything, and far dust for depth.
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: glowTexture("rgba(190,76,51,0.55)"), transparent: true, depthWrite: false, opacity: 0.5 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = -3.4;
  scene.add(pool);
  const dustGeo = new THREE.BufferGeometry();
  const dust = new Float32Array((opts.lite ? 250 : 600) * 3);
  for (let i = 0; i < dust.length; i += 3) dust.set([(Math.random() - 0.5) * 60, (Math.random() - 0.3) * 30, -10 - Math.random() * 30], i);
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x6b665a, size: 0.06, transparent: true, opacity: 0.6, depthWrite: false })));

  let composer: EffectComposer | null = null;
  if (!opts.lite) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.48, 0.5, 0.42));
    composer.addPass(new OutputPass());
  }

  // ---- state ----
  const current = { ...BEATS[0], pos: [...BEATS[0].pos] as Beat["pos"], look: [...BEATS[0].look] as Beat["look"] };
  let target: Beat = BEATS[0];
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let focus = -1;
  let active = true, destroyed = false, raf = 0;
  let t = 0, last = performance.now(), frames = 0, acc = 0, fps = 60;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmp = new THREE.Vector3();

  function mixBeats(p: number): Beat {
    const i = Math.max(0, Math.min(BEATS.length - 1, Math.floor(p)));
    const j = Math.min(BEATS.length - 1, i + 1);
    const f = Math.max(0, Math.min(1, p - i));
    const e = f * f * (3 - 2 * f);
    const a = BEATS[i], b = BEATS[j];
    const l = (x: number, y: number) => x + (y - x) * e;
    return { pos: [l(a.pos[0], b.pos[0]), l(a.pos[1], b.pos[1]), l(a.pos[2], b.pos[2])], look: [l(a.look[0], b.look[0]), l(a.look[1], b.look[1]), l(a.look[2], b.look[2])], agit: l(a.agit, b.agit), order: l(a.order, b.order), boundary: l(a.boundary, b.boundary), gate: l(a.gate, b.gate), flow: l(a.flow, b.flow), glow: l(a.glow, b.glow) };
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const onResize = () => { resize(); if (opts.reduced) draw(0); };
  window.addEventListener("resize", onResize);
  resize();

  function step(dt: number) {
    const k = opts.reduced ? 1 : Math.min(1, dt * 2.6);
    const lerp = (a: number, b: number) => a + (b - a) * k;
    current.agit = lerp(current.agit, target.agit);
    current.order = lerp(current.order, target.order);
    current.boundary = lerp(current.boundary, target.boundary);
    current.gate = lerp(current.gate, target.gate);
    current.flow = lerp(current.flow, target.flow);
    current.glow = lerp(current.glow, target.glow);
    for (let i = 0; i < 3; i++) { current.pos[i] = lerp(current.pos[i], target.pos[i]); current.look[i] = lerp(current.look[i], target.look[i]); }
    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3);

    // Portrait screens: everything centred and further back (the copy sits above and below).
    const portrait = camera.aspect < 0.9;
    const back = portrait ? 1.75 : camera.aspect < 1.3 ? 1.25 : 1;
    camPos.set(current.pos[0] * back + pointer.sx * 0.6, current.pos[1] + pointer.sy * 0.4, current.pos[2] * back);
    camLook.set(portrait ? 0.8 * current.flow : current.look[0], portrait ? 0.6 : current.look[1], current.look[2]);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    uniforms.uTime.value = t * CALM;
    uniforms.uAgit.value = current.agit;
    uniforms.uOrder.value = current.order;
    uniforms.uFlow.value = current.flow;
    uniforms.uFocus.value = focus;
    ringMats.forEach((m, i) => { m.opacity = current.order * (focus === i ? 0.75 : 0.28); });
    nodes.forEach((n, i) => {
      const ring = RINGS[i];
      const a = t * CALM * ring.speed + i * 1.7;
      n.position.set(Math.cos(a) * ring.r, 0, Math.sin(a) * ring.r);
      (n.material as THREE.MeshBasicMaterial).opacity = current.order;
      ((n.children[0] as THREE.Sprite).material as THREE.SpriteMaterial).opacity = current.order * (focus === i ? 1 : 0.65);
      n.scale.setScalar(focus === i ? 1.6 : 1);
    });
    shellMat.opacity = current.boundary * 0.32;
    shell.rotation.y = t * 0.03;
    shell.scale.setScalar(1.35 - 0.35 * current.boundary);
    gateMat.opacity = current.gate;
    gateMat.emissiveIntensity = current.gate * (1.4 + 0.3 * Math.sin(t * 1.1));
    (gateGlow.material as THREE.SpriteMaterial).opacity = current.gate * 0.55;

    // A gentle sway (never edge-on), so the mark always reads.
    peak.rotation.y = opts.reduced ? 0.35 : Math.sin(t * 0.32) * 0.55 + pointer.sx * 0.25;
    peak.rotation.x = Math.sin(t * 0.5) * 0.08 + pointer.sy * 0.15;
    core.position.y = Math.sin(t * 0.8) * 0.12;
    peakMat.emissiveIntensity = 0.04 + current.glow * 0.14;
    heart.intensity = 4 + current.glow * 10;
    (halo.material as THREE.SpriteMaterial).opacity = 0.18 + current.glow * 0.3;
    cursor.intensity = opts.lite ? 0 : 7;
    cursor.position.set(pointer.sx * 6, 1 + pointer.sy * 3, 4);

    if (opts.onLabels) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const gatePos = tmp.set(GATE_X, 1.7, 0).project(camera);
      const gateLabel = { x: (gatePos.x * 0.5 + 0.5) * w, y: (-gatePos.y * 0.5 + 0.5) * h, visible: current.gate > 0.6 && gatePos.z < 1 };
      opts.onLabels([...nodes.map((n) => {
        n.getWorldPosition(tmp);
        tmp.project(camera);
        const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
        return { x, y, visible: current.order > 0.6 && current.flow < 0.5 && tmp.z < 1 && y > 90 && y < h - 70 && x > 10 && x < w - 180 };
      }), gateLabel]);
    }
  }

  function draw(dt: number) {
    step(dt);
    if (composer) composer.render(); else renderer.render(scene, camera);
  }

  function loop(now: number) {
    raf = 0;
    if (destroyed) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!document.hidden && active) {
      t += dt;
      draw(dt);
      // Adaptive quality: if 90 frames run under ~40 fps, render fewer pixels.
      acc += dt; frames++;
      if (frames === 90) {
        fps = frames / acc;
        if (fps < 40 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); }
        frames = 0; acc = 0;
      }
    }
    if (!opts.reduced) raf = requestAnimationFrame(loop);
  }

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); api.destroy(); canvas.dispatchEvent(new CustomEvent("world-failed")); });

  const api: World = {
    setProgress(p) {
      target = mixBeats(p);
      if (opts.reduced) { draw(0); }
    },
    setPointer(x, y) { pointer.x = x; pointer.y = y; },
    setActive(on) {
      active = on;
      if (on && !opts.reduced && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    },
    focusAgent(i) { focus = i ?? -1; if (opts.reduced) draw(0); },
    get fps() { return fps; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mat) => { (mat as THREE.MeshBasicMaterial).map?.dispose(); mat.dispose(); });
      });
      envTex.dispose();
      pmrem.dispose();
      composer?.dispose();
      renderer.dispose();
    },
  };

  // First frame straight away (also the only kind of frame under reduced motion).
  draw(0.016);
  if (!opts.reduced) raf = requestAnimationFrame(loop);
  return api;
}
