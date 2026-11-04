/**
 * The live work over the story artwork: printed sheets drawn in WebGL on a transparent canvas laid exactly over the
 * images (every image shares one camera, so the door, the pile and the box sit on the same spots in all six). The
 * pile and the box from the image are laid back on top of this canvas (story-art.tsx), so a sheet that lands on the
 * pile sinks into it, a sheet taken off it rises out of it, and a filed sheet drops inside the box. What the paper does
 * follows the step the reader is on (scroll drives `setProgress(0..5)`):
 *   0    Work keeps arriving through the door and lands on the pile.
 *   1    More arrives, faster; some sheets miss and land on the floor.
 *   2–3  The agent at work: sheets lift off the top of the pile, one after another, and are filed into the box.
 *   4    Most go into the box; a few slide across the desk to the person to check.
 *   5    A calm trickle, filed straight away.
 * Only solid paper, no glow: it should look like part of the room. Sheets in the air finish what they were doing,
 * so moving between steps never jumps.
 */
import * as THREE from "three";
import { paperTexture } from "./world/office";

/** Where the image sits inside the canvas (object-fit: cover), in CSS pixels. */
export type ImageBox = { w: number; h: number; ox: number; oy: number; iw: number; ih: number };
export type PaperFlow = { setProgress(p: number): void; setActive(on: boolean): void; resize(box: ImageBox): void; destroy(): void };

type UV = [number, number];
// Spots on the artwork, as fractions of the image (0 = left or top).
const DOOR: UV = [0.505, 0.3];
const BOX_IN: UV = [0.868, 0.6]; // inside the box, below its front wall: filed sheets disappear into it
const CHECK: UV = [0.615, 0.71];
const DESK_STACK: UV = [0.75, 0.7]; // the foot of the pile, where sheets for the person set off
/** The person's face, kept clear in every frame: sheets shrink away inside this radius (fraction of image width). */
const FACE: UV = [0.63, 0.4];
const FACE_R = 0.075;
const ASPECT = 16 / 9; // image width / height

/** Sheets in the air at once, per step (of 20). */
const CAPS = [5, 9, 7, 7, 6, 3];
/** Pause before a sheet comes back, per step (shortest and longest, in seconds). */
const WAITS: Array<[number, number]> = [[0.6, 2.2], [0.2, 1.1], [0.4, 1.2], [0.4, 1.2], [0.4, 1.3], [1.8, 2.8]];

type Sheet = {
  mode: "wait" | "fly" | "rest"; t: number; dur: number; end: "vanish" | "rest";
  a: THREE.Vector3; c: THREE.Vector3; b: THREE.Vector3; // path in image units: u, v, depth (fraction of image width)
  warm: boolean; // missed, or waiting for the person
  appear: boolean; // fades in (out of the door); sheets from the pile rise out from behind it instead
  tumble: THREE.Euler; spin: THREE.Vector3; flatZ: number;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** `tops` is the middle of the pile's top sheet in each step's image. */
export function createPaperFlow(canvas: HTMLCanvasElement, opts: { lite: boolean; tops: UV[] }): PaperFlow {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !opts.lite, premultipliedAlpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lite ? 1.25 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";

  const scene = new THREE.Scene();
  // One CSS pixel = one unit at depth 0, so image spots map straight onto the canvas.
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 10000);
  // Warm, low light from the upper left, like the artwork's dim office.
  const key = new THREE.DirectionalLight(0xffe2c0, 0.85);
  key.position.set(-0.6, 1, 0.8);
  scene.add(new THREE.AmbientLight(0xffeedd, 0.55), key);

  const count = opts.lite ? 12 : 20;
  const tex = paperTexture();
  const paperMat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
  const papers = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1.3), paperMat, count);
  papers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  papers.frustumCulled = false;
  scene.add(papers);
  const PLAIN = new THREE.Color(0.86, 0.83, 0.78), WARM = new THREE.Color(0.95, 0.74, 0.63);

  let box: ImageBox = { w: 1, h: 1, ox: 0, oy: 0, iw: 1, ih: 1 };
  let p = 0, active = false, raf = 0, last = 0, time = 0;

  const sheets: Sheet[] = Array.from({ length: count }, (_, i) => ({
    mode: "wait", t: rand(0, 2.5) + i * 0.1, dur: 1, end: "vanish",
    a: new THREE.Vector3(), c: new THREE.Vector3(), b: new THREE.Vector3(), warm: false, appear: true,
    tumble: new THREE.Euler(rand(-1, 1), rand(-1, 1), rand(-1, 1)), spin: new THREE.Vector3(rand(-1.2, 1.2), rand(-1.5, 1.5), rand(-0.8, 0.8)), flatZ: rand(-0.4, 0.4),
  }));

  // Image units to scene units.
  const toScene = (u: number, v: number, d: number, out: THREE.Vector3) =>
    out.set(box.ox + u * box.iw - box.w / 2, box.h / 2 - (box.oy + v * box.ih), d * box.iw);

  const fly = (s: Sheet, from: THREE.Vector3, to: THREE.Vector3, dur: number, end: Sheet["end"], warm: boolean, arc: number, appear: boolean) => {
    s.mode = "fly"; s.t = 0; s.dur = dur; s.end = end; s.warm = warm; s.appear = appear;
    s.a.copy(from); s.b.copy(to);
    s.c.set((from.x + to.x) / 2, Math.min(from.y, to.y) - arc, Math.max(from.z, to.z) + 0.04);
  };
  const at = (spot: UV, du: number, dv: number, d = 0) => new THREE.Vector3(spot[0] + rand(-du, du), spot[1] + rand(-dv, dv), d);

  /** A sheet comes back into play, doing what the current step calls for. */
  const spawn = (s: Sheet, step: number) => {
    const top = opts.tops[step] ?? opts.tops[0];
    // On the pile: a little below its top edge, so a landing sheet settles into it and a lifted one rises out of it.
    const pile = () => at([top[0], top[1] + 0.028], 0.018, 0.005, 0.01);
    if (step <= 1) {
      const from = at(DOOR, 0.012, 0.05, -0.02);
      if (step === 1 && Math.random() < 0.4) fly(s, from, new THREE.Vector3(rand(0.25, 0.46), rand(0.8, 0.94), 0.02), rand(2.6, 3.3), "rest", true, 0.06, true);
      else fly(s, from, pile(), step === 0 ? rand(3.2, 4.2) : rand(2.3, 3), "vanish", false, 0.08, true);
    } else if (step <= 3) {
      // The agent at work: off the top of the pile, over, and down into the box.
      fly(s, pile(), at(BOX_IN, 0.02, 0.006, 0.01), rand(2.2, 2.8), "vanish", false, 0.12, false);
    } else if (step === 4) {
      if (Math.random() < 0.2) fly(s, at(DESK_STACK, 0.01, 0.01, 0.01), at(CHECK, 0.012, 0.006, 0.02), rand(2.4, 3), "rest", true, 0.02, false);
      else fly(s, pile(), at(BOX_IN, 0.02, 0.006, 0.01), rand(2, 2.6), "vanish", false, 0.1, false);
    } else {
      fly(s, at(DOOR, 0.01, 0.04, -0.02), at(BOX_IN, 0.02, 0.006, 0.01), rand(3.6, 4.4), "vanish", false, 0.14, true);
    }
  };

  const pos = new THREE.Vector3(), tmp = new THREE.Vector3(), scale = new THREE.Vector3(), quat = new THREE.Quaternion(), flat = new THREE.Quaternion();
  const mat = new THREE.Matrix4();
  const euler = new THREE.Euler();
  const bezier = (s: Sheet, k: number, out: THREE.Vector3) => {
    const m = 1 - k;
    return out.set(
      m * m * s.a.x + 2 * m * k * s.c.x + k * k * s.b.x,
      m * m * s.a.y + 2 * m * k * s.c.y + k * k * s.b.y,
      m * m * s.a.z + 2 * m * k * s.c.z + k * k * s.b.z,
    );
  };

  const tick = (dt: number) => {
    time += dt;
    const step = Math.max(0, Math.min(5, Math.round(p)));
    const cap = Math.round((CAPS[step] * count) / 20);
    let busy = sheets.reduce((n, s) => n + (s.mode === "wait" ? 0 : 1), 0);
    const size = box.iw * 0.034;

    sheets.forEach((s, i) => {
      let k = 0, grow = 1, settle = 0;
      if (s.mode === "wait") {
        s.t -= dt;
        if (s.t <= 0 && busy < cap) { spawn(s, step); busy++; }
      } else if (s.mode === "fly") {
        s.t += dt;
        k = clamp01(s.t / s.dur);
        if (k >= 1) {
          if (s.end === "rest") { s.mode = "rest"; s.t = 0; s.dur = rand(1.8, 2.6); }
          else { s.mode = "wait"; s.t = rand(...WAITS[step]); busy--; }
        }
      } else {
        s.t += dt;
        if (s.t >= s.dur) { s.mode = "wait"; s.t = rand(...WAITS[step]); busy--; }
      }

      if (s.mode === "wait") {
        scale.setScalar(0);
        pos.set(0, 0, 0);
      } else {
        if (s.mode === "fly") {
          bezier(s, k, tmp);
          // Sheets that end in the pile or the box are hidden by it as they arrive, so they stay whole until the end.
          grow = (s.appear ? smooth(0, 0.08, k) : 1) * (s.end === "vanish" ? 1 - smooth(0.96, 1, k) : 1);
          settle = smooth(0.72, 1, k);
        } else {
          tmp.copy(s.b);
          grow = 1 - smooth(s.dur - 0.5, s.dur, s.t);
          settle = 1;
        }
        toScene(tmp.x, tmp.y, tmp.z, pos);
        // Never over the face: shrink away near it (image units, height corrected to width).
        grow *= smooth(FACE_R * 0.6, FACE_R, Math.hypot(tmp.x - FACE[0], (tmp.y - FACE[1]) / ASPECT));
        euler.set(s.tumble.x + s.spin.x * time * 0.5, s.tumble.y + s.spin.y * time * 0.5, s.tumble.z + s.spin.z * time * 0.35);
        quat.setFromEuler(euler);
        // Arriving: the sheet lies flat, seen from above like the desk in the artwork.
        flat.setFromEuler(euler.set(-1.15, 0, s.flatZ));
        quat.slerp(flat, settle);
        scale.setScalar(size * grow);
      }
      mat.compose(pos, quat, scale);
      papers.setMatrixAt(i, mat);
      papers.setColorAt(i, s.warm ? WARM : PLAIN);
    });
    papers.instanceMatrix.needsUpdate = true;
    if (papers.instanceColor) papers.instanceColor.needsUpdate = true;
    renderer.render(scene, camera);
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (document.hidden) return;
    tick(dt);
  };

  return {
    setProgress(next) { p = next; },
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) { last = 0; raf = requestAnimationFrame(loop); } else cancelAnimationFrame(raf);
    },
    resize(next) {
      box = next;
      renderer.setSize(box.w, box.h, false);
      camera.aspect = box.w / box.h;
      camera.position.set(0, 0, box.h / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      camera.far = camera.position.z * 4;
      camera.updateProjectionMatrix();
    },
    destroy() {
      cancelAnimationFrame(raf);
      papers.geometry.dispose();
      paperMat.dispose();
      tex.dispose();
      renderer.dispose();
    },
  };
}
