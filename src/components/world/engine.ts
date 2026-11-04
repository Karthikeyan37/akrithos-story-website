/**
 * The Akrithos work engine: one WebGL scene behind the opening story, staged like the story artwork (a dark office seen
 * from high at the front left: the open door behind, the desk with its tall pile, the inbox box at the far end). The
 * person is the real one from the artwork, cut out of each step's image (scripts/cut-person.mjs), so their face shows
 * how they feel. Each step acts out exactly what its words say (scroll drives `setProgress(0..5)`):
 *   0  "Calls, emails, forms and bills land on your team's desk": work flies in through the door onto the pile.
 *   1  "Things start to slip: a missed call, a late bill": more arrives, the desk phone lights up unanswered, and a few
 *      sheets slide off onto the floor.
 *   2  "An agent picks up each piece of work, sorts it... Nothing gets lost. There are four kinds": a small, friendly
 *      agent pops up beside the person and waves; it flies to the pile, reads it, and lifts every sheet (the ones on
 *      the floor too) into four neat stacks, one per kind of agent.
 *   3  "Your information stays inside... every step is written down": the agent flies to the open door, closes it and
 *      a padlock lights up on it; a soft shield forms over the desk; the logbook on the desk fills, line by line.
 *   4  "Most jobs are finished for you. The few that need a decision go to a person": the stacks are filed into the
 *      inbox box (Done) and the agent brings the person the three that need a yes or no.
 *   5  "The pile is gone": the desk is clear and the agent settles on it beside the person, who smiles.
 *
 * Everything is in one 3D space, so paper passes behind the pile and lands with shadows. Built in code (plus six small
 * cut-outs), so it loads fast. Phones get the light version (no shadows); reduced motion gets still frames;
 * computers without a graphics card, and a failed WebGL context, keep the poster.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createOffice, paperTexture } from "./office";
import { createHelper, glowMaterial } from "./helper";

export type WorldOptions = {
  lite: boolean;
  reduced: boolean;
  /** The person cut out of each step's image, in step order. */
  people: string[];
  /** Called once the first frame is on screen. */
  onReady?: () => void;
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
  bg: new THREE.Color("#0B0B0C"),
  gold: new THREE.Color("#D4A35F"),
  focus: new THREE.Color("#FFC9A0"),
  missed: new THREE.Color("#D9A88F"),
  check: new THREE.Color("#F0B08E"),
};
const PAPER = ["#E4E0D8", "#DCD6CB", "#E8E4DC", "#D6CFC2"].map((c) => new THREE.Color(c));
/** One soft tint per kind of work, so the four sorted stacks read as four kinds. */
const KINDS = ["#E9D9C2", "#D9E0E4", "#E6DCCB", "#DCE3D5"].map((c) => new THREE.Color(c));

/** Everything moves at under half speed: visitor feedback found fast motion distracting. */
const CALM = 0.42;

// The room, in metres with the floor at 0.
const DESK = new THREE.Vector3(0.1, 0.76, 0); // centre of the desk top
const PILE = new THREE.Vector3(0.36, DESK.y, 0.02);
const BOX = new THREE.Vector3(0.82, DESK.y, -0.06);
const CHECK = new THREE.Vector3(-0.3, DESK.y, -0.06); // in front of the person, for the few they check
/** The four sorted stacks, one per kind of agent, in a row along the front of the desk. */
const STACKS = [-0.12, 0.13, 0.38, 0.63].map((x) => new THREE.Vector3(x, DESK.y, 0.33));
const DOOR = new THREE.Vector3(-0.78, 1.25, -2.9);
const PILE_H = 1.15; // a full pile towers over the seated person
const CARD = { w: 0.24, d: 0.31 };
/** The person cut-out: where it stands (just over the back of the desk, so their arms rest on it and the soft bottom of the cut-out melts onto the wood) and its size. */
const PERSON = { at: new THREE.Vector3(-0.4, 1.113, -0.3), w: 0.72, h: 0.976 };

/**
 * The camera for each step: always the artwork's angle (high, front left), moving only a little, so the room stays
 * put and the story happens in it. On wide screens the scene sits to the right of the copy.
 */
type Beat = { pos: [number, number, number]; look: [number, number, number]; fov: number };
const BEATS: Beat[] = [
  { pos: [-2.55, 2.95, 3.35], look: [0.15, 1.0, -0.4], fov: 32 },
  { pos: [-2.7, 2.95, 3.55], look: [-0.05, 0.85, -0.2], fov: 33 },
  { pos: [-2.5, 2.9, 3.35], look: [0.1, 1.05, -0.2], fov: 32 },
  { pos: [-2.95, 3.35, 3.95], look: [0.1, 1.05, -0.4], fov: 35 },
  { pos: [-2.35, 2.75, 3.1], look: [0.05, 0.95, -0.25], fov: 32 },
  { pos: [-2.45, 2.85, 3.25], look: [0.0, 1.0, -0.35], fov: 32 },
];

/**
 * Where the agent is through the story: it pops up beside the person, works above the pile, holds the middle of the
 * shield, brings the person the few to check, then settles on the desk. Positions blend between these points.
 */
const AGENT_PATH: Array<{ p: number; at: [number, number, number] }> = [
  { p: 1.05, at: [-0.1, 1.25, -0.3] }, // pops up beside the person and waves
  { p: 1.38, at: [-0.1, 1.25, -0.3] },
  { p: 1.5, at: [0.36, 2.0, 0.05] }, // over the pile, sorting it
  { p: 1.95, at: [0.3, 1.2, 0.2] },
  { p: 2.25, at: [-0.5, 1.3, -2.2] }, // to the open door, which it closes and locks
  { p: 2.8, at: [-0.5, 1.3, -2.2] },
  { p: 3.05, at: [0.25, 1.5, 0.0] }, // back in the middle of the shield
  { p: 3.2, at: [0.25, 1.5, 0.0] },
  { p: 3.5, at: [-0.1, 1.02, 0.05] }, // bringing the person the few to check
  { p: 4.3, at: [-0.1, 1.02, 0.05] },
  { p: 4.85, at: [0.12, DESK.y + 0.1, 0.14] }, // settled on the desk beside them
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function agentAt(p: number, out: THREE.Vector3) {
  const path = AGENT_PATH;
  if (p <= path[0].p) return out.set(...path[0].at);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    if (p <= b.p) {
      const e = smooth(a.p, b.p, p);
      return out.set(a.at[0] + (b.at[0] - a.at[0]) * e, a.at[1] + (b.at[1] - a.at[1]) * e, a.at[2] + (b.at[2] - a.at[2]) * e);
    }
  }
  return out.set(...path[path.length - 1].at);
}

export function createWorld(canvas: HTMLCanvasElement, opts: WorldOptions): World {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.lite, powerPreference: "high-performance", alpha: false });
  let dpr = Math.min(window.devicePixelRatio || 1, opts.lite ? 1.4 : 1.75);
  renderer.setPixelRatio(dpr);
  // Shader checks stall on the GPU and echo harmless driver notes; keep them for development, where they catch real errors.
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !opts.lite;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = COLORS.bg.clone();
  scene.fog = new THREE.Fog(COLORS.bg.getHex(), 7, 13); // the room melts into the dark at its edges
  // Soft reflections from a studio room.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.22;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);

  // Light, as in the artwork: a warm key from the upper left, a lamp-warm pool over the desk, a gold rim from behind.
  const key = new THREE.DirectionalLight(0xffe9cf, 1.1);
  key.position.set(-3.5, 6, 2.5);
  key.target.position.copy(DESK);
  key.castShadow = !opts.lite;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 14 });
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  scene.add(key.target);
  const lamp = new THREE.PointLight(0xffd2a0, 1.6, 4.5, 1.6);
  lamp.position.set(DESK.x - 0.4, 2.6, DESK.z - 0.2);
  const rim = new THREE.PointLight(COLORS.gold, 6, 7, 1.5);
  rim.position.set(1.4, 2.6, -2.2);
  const cursor = new THREE.PointLight(0xffe2c8, 0, 6, 1.6);
  scene.add(new THREE.HemisphereLight(0x4a4038, 0x0c0a09, 1.3), key, lamp, rim);
  if (!opts.lite) scene.add(cursor); // the light that follows the pointer: computers with a mouse only

  // Paper: printed on top, plain edges.
  const tex = paperTexture();
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const paperEdge = new THREE.MeshStandardMaterial({ color: new THREE.Color("#E6E2DA"), roughness: 0.85 });
  const paperFace = new THREE.MeshStandardMaterial({ map: tex, color: new THREE.Color("#DCD7CE"), roughness: 0.8 });
  const paperMats = [paperEdge, paperEdge, paperFace, paperEdge, paperEdge, paperEdge];

  const office = createOffice(DESK, BOX, paperMats, opts.lite);
  scene.add(office.group);

  // The person, from the artwork: one cut-out per step, the next one dissolving in over the last when the step changes.
  const loader = new THREE.TextureLoader();
  const faces = opts.people.map((src) => { const t = loader.load(src, () => still()); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; });
  const personGeo = new THREE.PlaneGeometry(PERSON.w, PERSON.h);
  const layer = () => {
    // Given an image from the start, so its shader never changes later (a change would rebuild it mid-story).
    const m = new THREE.Mesh(personGeo, new THREE.MeshBasicMaterial({ map: faces[0], transparent: true, alphaTest: 0.01, depthWrite: false, toneMapped: false, color: new THREE.Color(0.92, 0.9, 0.88) }));
    m.position.copy(PERSON.at);
    m.renderOrder = 1;
    scene.add(m);
    return m;
  };
  const faceBack = layer(), faceFront = layer();
  faceFront.renderOrder = 2;
  let shownFace = -1, faceFade = 1;

  // The agent: small and friendly.
  const helper = createHelper();
  scene.add(helper.group);

  // The work: one sheet of paper per piece of work.
  const N = opts.lite ? 80 : 110;
  const GAP = PILE_H / N;
  const M = opts.reduced ? 0 : 5; // sheets that keep coming in through the door
  const cards = new THREE.InstancedMesh(new THREE.BoxGeometry(CARD.w, Math.min(0.006, GAP * 0.9), CARD.d), paperMats, N + M);
  cards.castShadow = !opts.lite;
  cards.receiveShadow = !opts.lite;
  cards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cards.frustumCulled = false;
  scene.add(cards);

  type Card = { r: number[]; paper: THREE.Color; spill: boolean; check: number; kind: number; slot: number; pos: THREE.Vector3; quat: THREE.Quaternion; scale: number; color: THREE.Color };
  const list: Card[] = [];
  const checks = Array.from({ length: N }, (_, i) => i === 20 || i === 41 || i === 62); // three for the person
  const slots = [0, 0, 0, 0];
  for (let i = 0; i < N + M; i++) {
    const kind = i % 4;
    list.push({
      r: [Math.random(), Math.random(), Math.random(), Math.random()],
      paper: PAPER[i % PAPER.length].clone(),
      spill: i < N && i / N > 0.62 && !checks[i] && i % 6 === 1, // a few near the top slide off
      check: checks[i] ? checks.slice(0, i).filter(Boolean).length : -1,
      kind,
      slot: i < N && !checks[i] ? slots[kind]++ : 0, // its place in its kind's stack
      pos: new THREE.Vector3(DOOR.x, DOOR.y, DOOR.z),
      quat: new THREE.Quaternion(),
      scale: 0,
      color: PAPER[i % PAPER.length].clone(),
    });
  }

  // The agent reading the pile: a thin gold frame around it, with a beam sweeping up and down.
  const scanMat = new THREE.LineBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const scanFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CARD.w + 0.1, 1, CARD.d + 0.1)), scanMat);
  const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#E8714A"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(CARD.w + 0.16, CARD.d + 0.16), beamMat);
  beam.rotation.x = -Math.PI / 2;
  scene.add(scanFrame, beam);

  // The shield: a dome of light over the desk, the person and the agent; clear in the middle, glowing at its edge.
  const shieldMat = glowMaterial("#D4A35F", { power: 4.5, base: 0.0, fadeFrom: -1, fadeTo: 0 });
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1.75, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), shieldMat);
  shield.position.set(0.1, 0, -0.3);
  scene.add(shield);

  // A warm glow over the inbox box as finished work arrives, and a soft ring under the stack being shown.
  const boxGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(212,163,95,0.9)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  boxGlow.scale.setScalar(0.9);
  boxGlow.position.set(BOX.x, BOX.y + 0.25, BOX.z);
  scene.add(boxGlow);
  const focusRing = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.23, 48), new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0, depthWrite: false }));
  focusRing.rotation.x = -Math.PI / 2;
  scene.add(focusRing);

  // No glow pass (bloom): drawn as a second step over the scene, it left some frames empty, so the scene blinked off
  // and on. The scene is drawn in one step instead; the warm light comes from the lights themselves.

  // ---- state ----
  let targetP = 0, p = 0;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let focus = -1;
  let active = true, destroyed = false, raf = 0, started = false;
  let t = 0, last = performance.now(), frames = 0, acc = 0, fps = 60, warmedUp = false;
  let width = 1, height = 1;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), agentPos = new THREE.Vector3();
  const tPos = new THREE.Vector3(), tQuat = new THREE.Quaternion(), tColor = new THREE.Color(), euler = new THREE.Euler(), matrix = new THREE.Matrix4(), one = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);

  function beatAt(x: number) {
    const i = Math.max(0, Math.min(BEATS.length - 1, Math.floor(x)));
    const j = Math.min(BEATS.length - 1, i + 1);
    const e = smooth(0, 1, x - i);
    const a = BEATS[i], b = BEATS[j];
    const l = (u: number, v: number) => u + (v - u) * e;
    return { pos: a.pos.map((v, k) => l(v, b.pos[k])), look: a.look.map((v, k) => l(v, b.look[k])), fov: l(a.fov, b.fov) };
  }

  function resize() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Wide screens: shift the picture right so the scene sits beside the copy, not under it.
    const shift = camera.aspect > 1.2 ? Math.round(width * 0.17) : 0;
    if (shift) camera.setViewOffset(width, height, -shift, 0, width, height); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  // Reduced motion draws single still frames on demand: only while the scene is on screen, and once scrolling settles.
  let stillTimer = 0;
  const still = () => {
    if (!opts.reduced || !started) return;
    window.clearTimeout(stillTimer);
    stillTimer = window.setTimeout(() => { if (active && !destroyed) draw(0); }, 120);
  };
  // Resizing wipes the canvas: draw again straight away, so the scene never blanks for a frame (phones resize the
  // page each time the browser bar slides in or out).
  const onResize = () => {
    resize();
    if (started && active && !opts.reduced && !destroyed) draw(0);
    else still();
  };
  window.addEventListener("resize", onResize);
  resize();

  function step(dt: number) {
    // Each step's action plays through on its own once the reader reaches the step, so it always finishes, wherever
    // they stop: the story moves towards the step on screen at a calm, steady pace (faster when far behind).
    const goal = Math.max(0, Math.min(5, Math.round(targetP)));
    const gap = goal - p;
    const speed = 0.45 + 0.9 * Math.max(0, Math.abs(gap) - 1);
    p = opts.reduced ? goal : p + Math.sign(gap) * Math.min(Math.abs(gap), speed * dt);
    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3);

    // The story, as numbers from 0 to 1.
    const load = 0.62 + 0.38 * smooth(0, 1.1, p); // how full the pile is
    // (Step k's action plays while the story moves from k - 1 to k.)
    const spill = smooth(0.4, 1.0, p); // pieces sliding off
    const ringing = smooth(0.5, 0.8, p) * (1 - smooth(1.3, 1.45, p)); // the missed call
    const agent = smooth(1.02, 1.2, p); // the agent popping up
    const wave = smooth(1.08, 1.16, p) * (1 - smooth(1.34, 1.42, p));
    const sort = smooth(1.5, 1.98, p); // the pile being sorted into four stacks
    const boundary = smooth(2.3, 2.85, p) - smooth(3.05, 3.35, p);
    const done = smooth(3.2, 3.7, p); // the stacks filed into the box
    const handed = smooth(3.45, 3.8, p); // the few brought to the person
    const checked = smooth(4.2, 4.75, p); // the person has checked them
    const incoming = 1 - smooth(1.0, 1.3, p);
    // "Your information stays inside": the agent closes and locks the door, the shield forms, every step is logged.
    const doorShut = smooth(2.4, 2.65, p);
    const locked = smooth(2.62, 2.78, p);
    const logged = smooth(2.15, 3.0, p);
    const pileCount = Math.round(N * load);
    const step0 = Math.max(0, Math.min(5, Math.round(p))); // the face changes halfway: after the agent has said hello

    // Camera: the artwork's angle, moving a little per step. Portrait screens step back and centre on the desk.
    const beat = beatAt(p);
    const portrait = camera.aspect < 0.9;
    const back = portrait ? 1.6 : camera.aspect < 1.3 ? 1.2 : 1;
    camLook.set(beat.look[0] - (portrait ? 0.35 : 0), beat.look[1] + (portrait ? 0.35 : 0), beat.look[2]);
    camPos.set(beat.pos[0] - beat.look[0], beat.pos[1] - beat.look[1], beat.pos[2] - beat.look[2]).multiplyScalar(back).add(camLook);
    camPos.x += pointer.sx * 0.15;
    camPos.y += pointer.sy * 0.1;
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    if (camera.fov !== beat.fov) { camera.fov = beat.fov; camera.updateProjectionMatrix(); }

    // The person: the step's cut-out, facing the camera, dissolving in over the last in half a second.
    if (step0 !== shownFace) {
      // Swapping one image for another keeps the same shader, so no rebuild is needed.
      (faceBack.material as THREE.MeshBasicMaterial).map = shownFace >= 0 ? faces[shownFace] : faces[step0];
      (faceFront.material as THREE.MeshBasicMaterial).map = faces[step0];
      faceFade = shownFace < 0 || opts.reduced ? 1 : 0;
      shownFace = step0;
    }
    faceFade = Math.min(1, faceFade + dt / 0.5);
    (faceFront.material as THREE.MeshBasicMaterial).opacity = faceFade;
    faceBack.visible = faceFade < 1;
    [faceBack, faceFront].forEach((m) => m.quaternion.copy(camera.quaternion));

    // The agent: pops up, waves hello, then goes where the work is.
    agentAt(p, agentPos);
    helper.group.position.copy(agentPos);
    const busy = smooth(1.45, 1.55, p) * (1 - smooth(1.9, 2.0, p)) + smooth(2.35, 2.45, p) * (1 - smooth(2.7, 2.8, p)) + smooth(3.45, 3.55, p) * (1 - smooth(3.8, 3.9, p));
    helper.update(agent, wave, busy, camera.position, t);

    // The scan: as the agent starts on the pile.
    const scan = smooth(1.4, 1.5, p) * (1 - smooth(1.58, 1.7, p));
    const pileTop = Math.max(0.1, Math.round(pileCount * (1 - sort)) * GAP + 0.04);
    scanFrame.scale.set(1, pileTop, 1);
    scanFrame.position.set(PILE.x + 0.01, DESK.y + pileTop / 2, PILE.z);
    scanMat.opacity = scan * 0.8;
    beam.position.set(PILE.x + 0.01, DESK.y + pileTop * (0.5 + 0.48 * Math.sin(t * 1.6)), PILE.z);
    beamMat.opacity = scan * 0.35;

    shieldMat.uniforms.opacity.value = Math.max(0, boundary) * 0.35;
    shield.scale.setScalar(1.15 - 0.15 * clamp01(boundary));
    shield.rotation.y = t * CALM * 0.1;
    office.setGlow(done * (0.16 + 0.05 * Math.sin(t * 1.4)));
    office.setTidy(sort);
    office.setPhone(ringing * (0.55 + 0.45 * Math.sin(t * 7)));
    office.setDoor(1 - doorShut);
    office.setLock(locked);
    office.setLog(logged);
    (boxGlow.material as THREE.SpriteMaterial).opacity = done * (1 - checked * 0.5) * 0.35;
    lamp.intensity = 1.6 + 1.2 * smooth(1.5, 5, p);
    const ring = focusRing.material as THREE.MeshBasicMaterial;
    ring.opacity += ((focus >= 0 && sort > 0.5 && done < 0.5 ? 0.8 : 0) - ring.opacity) * Math.min(1, dt * 6);
    if (focus >= 0) focusRing.position.set(STACKS[focus].x, DESK.y + 0.003, STACKS[focus].z);

    // The paper.
    for (let i = 0; i < N + M; i++) {
      const c = list[i];
      let scale = 1;
      if (i >= N) {
        // Coming in: through the open door, across the room in an arc, onto the top of the pile.
        const j = i - N;
        const u = ((t * CALM * 0.5 + j / M) % 1 + 1) % 1;
        const e = u * u * (3 - 2 * u);
        const top = DESK.y + pileCount * GAP + 0.03;
        const sx = DOOR.x + (c.r[0] - 0.5) * 0.4, sy = DOOR.y + (c.r[1] - 0.5) * 0.5, sz = DOOR.z;
        tPos.set(sx + (PILE.x - sx) * e, sy + (top - sy) * e + Math.sin(Math.PI * e) * 0.7, sz + (PILE.z - sz) * e);
        c.pos.copy(tPos);
        euler.set((1 - e) * (c.r[3] - 0.5) * 2.4, (1 - e) * c.r[0] * 5, (1 - e) * (c.r[1] - 0.5) * 1.8);
        c.quat.setFromEuler(euler);
        c.scale = incoming * (u < 0.06 ? u / 0.06 : u > 0.94 ? (1 - u) / 0.06 : 1);
        c.color.copy(c.paper);
      } else {
        const rank = (N - 1 - i) / (N - 1); // top of the pile goes first
        const isSorted = i < pileCount && (sort > rank * 0.92 + 0.04 || (c.spill && sort > 0.15));
        const isCheck = c.check >= 0;
        const isDone = isSorted && !isCheck && done > (c.kind * 0.22 + c.r[2] * 0.1);
        if (isSorted && isCheck && handed > 0 && checked < (c.check + 1) / 3.2) {
          // The few that need a decision: brought to the person, in a neat little stack in front of them.
          tPos.set(CHECK.x, CHECK.y + 0.004 + c.check * 0.007, CHECK.z);
          tQuat.setFromAxisAngle(yAxis, 0.3 + (c.r[0] - 0.5) * 0.12);
          tColor.copy(COLORS.check);
        } else if (isSorted && isCheck && checked >= (c.check + 1) / 3.2) {
          // Checked: into the box with the rest.
          tPos.set(BOX.x, BOX.y + 0.05, BOX.z);
          tQuat.identity();
          tColor.copy(COLORS.gold);
          scale = c.pos.distanceTo(tPos) < 0.12 ? 0 : 0.9;
        } else if (isDone) {
          // Finished: dropped into the inbox box, kind by kind, where it joins the folders.
          tPos.set(BOX.x + (c.r[0] - 0.5) * 0.08, BOX.y + 0.05, BOX.z + (c.r[1] - 0.5) * 0.06);
          tQuat.setFromAxisAngle(yAxis, (c.r[3] - 0.5) * 0.3);
          tColor.copy(COLORS.gold);
          scale = c.pos.distanceTo(tPos) < 0.12 ? 0 : 0.9;
        } else if (isSorted) {
          // Sorted: onto its kind's stack along the front of the desk (the checks wait on top of the first one).
          const s = STACKS[c.kind];
          tPos.set(s.x + (c.r[0] - 0.5) * 0.01, s.y + 0.004 + (isCheck ? 30 + c.check : c.slot) * 0.0062, s.z + (c.r[1] - 0.5) * 0.01);
          tQuat.setFromAxisAngle(yAxis, (c.r[2] - 0.5) * 0.08);
          tColor.copy(focus === c.kind ? COLORS.focus : KINDS[c.kind]);
        } else if (c.spill && spill > c.r[1] * 0.6 + 0.2) {
          // Missed: slid off the pile onto the floor in front of the desk.
          tPos.set(-1.55 + c.r[0] * 0.9, 0.006, 0.6 + c.r[1] * 1.1);
          tQuat.setFromAxisAngle(yAxis, c.r[2] * 6);
          tColor.copy(COLORS.missed);
        } else if (i < pileCount) {
          // On the pile: it leans a little more the higher it goes.
          const h = i / N;
          tPos.set(PILE.x + Math.sin(i * 0.37) * 0.012 + h * h * 0.05, DESK.y + (i + 0.5) * GAP, PILE.z + Math.cos(i * 0.53) * 0.012);
          euler.set(0, (c.r[0] - 0.5) * 0.22, -h * 0.03);
          tQuat.setFromEuler(euler);
          tColor.copy(c.paper);
        } else {
          // Not arrived yet: waiting out of sight, beyond the door.
          tPos.copy(DOOR).setZ(DOOR.z - 0.5);
          tQuat.identity();
          tColor.copy(c.paper);
          scale = 0;
        }
        // Lift over things on the way: aim above the target while still far from it.
        const far = c.pos.distanceTo(tPos);
        if (scale > 0 && far > 0.05) tPos.y += Math.min(0.45, far * 0.6);
        const kc = opts.reduced ? 1 : Math.min(1, dt * (1.6 + c.r[3] * 1.4));
        c.pos.lerp(tPos, kc);
        c.quat.slerp(tQuat, kc);
        c.scale += (scale - c.scale) * kc;
        c.color.lerp(tColor, kc);
      }
      matrix.compose(c.pos, c.quat, one.setScalar(Math.max(0.0001, c.scale)));
      cards.setMatrixAt(i, matrix);
      cards.setColorAt(i, c.color);
    }
    cards.instanceMatrix.needsUpdate = true;
    if (cards.instanceColor) cards.instanceColor.needsUpdate = true;

    cursor.intensity = opts.lite ? 0 : 1.2;
    cursor.position.set(pointer.sx * 2.5, 2 + pointer.sy * 1.2, 1.5);
  }

  function draw(dt: number) {
    step(dt);
    renderer.render(scene, camera);
  }

  function loop(now: number) {
    raf = 0;
    if (destroyed) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!document.hidden && active) {
      t += dt;
      // Adaptive quality: if 90 frames run under ~40 fps, render fewer pixels. Changing the size wipes the canvas, so
      // it happens before this frame is drawn (never between a frame and the screen), and skips the first second,
      // while the browser is still busy starting up.
      acc += dt; frames++;
      if (frames === 90) {
        fps = frames / acc;
        if (warmedUp && fps < 40 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); }
        warmedUp = true;
        frames = 0; acc = 0;
      }
      draw(dt);
    }
    if (!opts.reduced) raf = requestAnimationFrame(loop);
  }

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); api.destroy(); canvas.dispatchEvent(new CustomEvent("world-failed")); });

  const api: World = {
    setProgress(next) {
      targetP = next;
      still();
    },
    setPointer(x, y) { pointer.x = x; pointer.y = y; },
    setActive(on) {
      active = on;
      if (on) still();
      if (on && started && !opts.reduced && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    },
    focusAgent(i) { focus = i ?? -1; still(); },
    get fps() { return fps; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(stillTimer);
      window.removeEventListener("resize", onResize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mat) => { (mat as THREE.MeshBasicMaterial).map?.dispose(); mat.dispose(); });
      });
      faces.forEach((f) => f.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };

  // Prepare every shader in the background first (doing it in one go would freeze the page), then draw the first
  // frame (also the only kind of frame under reduced motion).
  // Everything is made visible while preparing, so nothing hidden at the start (the agent, the ticks in the logbook,
  // the second face layer) has to be prepared later, mid-story, which would make the room blink.
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  renderer.compileAsync(scene, camera).catch(() => undefined).then(() => {
    hidden.forEach((o) => { o.visible = false; });
    if (destroyed) return;
    started = true;
    draw(0.016);
    opts.onReady?.();
    last = performance.now();
    if (!opts.reduced && !raf) raf = requestAnimationFrame(loop);
  });
  return api;
}

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
