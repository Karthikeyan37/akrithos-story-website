/**
 * The office set for the story, built in code to match the story artwork: printed paper, the room, the desk and its
 * things, and the mess on the floor.
 */
import * as THREE from "three";

function canvasTexture(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** One printed sheet: a letterhead, a few lines of text, a table and a total, like an invoice or a form. */
export function paperTexture() {
  return canvasTexture(256, 340, (g) => {
    g.fillStyle = "#F3F0EA";
    g.fillRect(0, 0, 256, 340);
    g.fillStyle = "#B9B3A8";
    g.fillRect(20, 22, 64, 12);
    g.fillStyle = "#D2CCC2";
    g.fillRect(170, 22, 66, 6);
    g.fillRect(170, 32, 50, 6);
    for (let i = 0; i < 4; i++) g.fillRect(20, 60 + i * 12, 120 - i * 18, 5);
    g.strokeStyle = "#CFC9BE";
    g.lineWidth = 2;
    g.strokeRect(20, 120, 216, 140);
    g.fillStyle = "#E3DED5";
    g.fillRect(21, 121, 214, 18);
    for (let r = 0; r < 6; r++) {
      g.fillStyle = "#D6D0C6";
      g.fillRect(28, 150 + r * 18, 110, 5);
      g.fillRect(180, 150 + r * 18, 46, 5);
    }
    g.fillStyle = "#B9B3A8";
    g.fillRect(150, 276, 86, 10);
    g.fillStyle = "#D6D0C6";
    for (let i = 0; i < 2; i++) g.fillRect(20, 300 + i * 12, 150, 4);
  });
}

function woodTexture() {
  return canvasTexture(512, 256, (g) => {
    g.fillStyle = "#7B5B3F";
    g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * 256;
      g.strokeStyle = Math.random() > 0.5 ? "rgba(52, 34, 20, 0.22)" : "rgba(170, 130, 90, 0.18)";
      g.lineWidth = 0.6 + Math.random() * 2.2;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 3 + (Math.random() - 0.5) * 1.5);
      g.stroke();
    }
  });
}

/** A crumpled ball of paper: a low-poly sphere with its points pushed in and out. */
function crumpleGeometry() {
  const geo = new THREE.IcosahedronGeometry(0.1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    v.multiplyScalar(0.75 + Math.random() * 0.45);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export type Office = {
  group: THREE.Group;
  setTidy(done: number): void;
  setGlow(glow: number): void;
  setPhone(ringing: number): void;
  /** 1 = the door stands open (work comes in), 0 = closed. */
  setDoor(open: number): void;
  /** The padlock on the closed door: 0 hidden to 1 shown. */
  setLock(shown: number): void;
  /** The logbook on the desk: 0 empty to 1, one ticked line after another. */
  setLog(written: number): void;
};

/**
 * The office from the story artwork, in metres with the floor at 0: a dark back wall with an open door onto a lit
 * corridor (where the work comes in), a glass partition on the right, the desk with the inbox box at its far end, a
 * letter tray, a mug, bins and papers on the floor. `desk` is the centre of the desk top; `box` is the inbox box.
 */
export function createOffice(desk: THREE.Vector3, box: THREE.Vector3, paperMats: THREE.Material[], lite: boolean): Office {
  const group = new THREE.Group();
  const mat = (color: string, roughness: number, metalness = 0) => new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness, metalness });
  const wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.5, metalness: 0.05 });
  const steel = mat("#2E3035", 0.45, 0.6);
  const chrome = mat("#C9C6C0", 0.22, 1);
  const wall = mat("#3A322B", 0.92);
  const doorWood = mat("#3A2E26", 0.7);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x: number, y: number, z: number, parent: THREE.Object3D = group) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = !lite;
    mesh.receiveShadow = !lite;
    parent.add(mesh);
    return mesh;
  };

  // Floor: dark and a little glossy.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat("#181513", 0.58, 0.12));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = !lite;
  group.add(floor);

  // Back wall with a door opening, the door standing open into the room, and the lit corridor beyond.
  const WZ = -2.7, WH = 3.2, DX0 = -1.2, DX1 = -0.35, DH = 2.1;
  add(new THREE.BoxGeometry(4, WH, 0.1), wall, DX0 - 2, WH / 2, WZ);
  add(new THREE.BoxGeometry(1.7 - DX1, WH, 0.1), wall, (DX1 + 1.7) / 2, WH / 2, WZ);
  add(new THREE.BoxGeometry(DX1 - DX0, WH - DH, 0.1), wall, (DX0 + DX1) / 2, DH + (WH - DH) / 2, WZ);
  const hinge = new THREE.Group();
  hinge.position.set(DX0, 0, WZ + 0.05);
  const DOOR_OPEN = -1.15; // standing open into the corridor, so the light comes through
  hinge.rotation.y = DOOR_OPEN;
  add(new THREE.BoxGeometry(0.88, DH - 0.02, 0.045), doorWood, 0.44, DH / 2, 0, hinge);
  add(new THREE.BoxGeometry(0.03, 0.03, 0.12), chrome, 0.78, 1.0, 0.03, hinge);
  group.add(hinge);
  const corridorLit = new THREE.Color("#B89A72"), corridorDark = new THREE.Color("#2A231D");
  const corridorMat = new THREE.MeshBasicMaterial({ color: corridorLit.clone() });
  const corridor = new THREE.Mesh(new THREE.PlaneGeometry(DX1 - DX0 + 0.4, DH + 0.2), corridorMat);
  corridor.position.set((DX0 + DX1) / 2, DH / 2, WZ - 0.6);
  group.add(corridor);
  // The corridor's light spills through the door onto the floor.
  const spill = new THREE.SpotLight(new THREE.Color("#FFD9A8"), 4, 7, 0.75, 0.6, 1.4);
  spill.position.set((DX0 + DX1) / 2, 1.9, WZ - 0.4);
  spill.target.position.set((DX0 + DX1) / 2 + 0.3, 0, WZ + 2.2);
  group.add(spill, spill.target);
  // A padlock that lights up on the closed door: nothing leaves the room.
  const gold = new THREE.MeshStandardMaterial({ color: new THREE.Color("#D4A35F"), metalness: 0.8, roughness: 0.3, emissive: new THREE.Color("#D4A35F"), emissiveIntensity: 0.7 });
  const lock = new THREE.Group();
  lock.position.set(DX0 + 0.78, 1.18, WZ + 0.12);
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.04), gold);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 10, 24, Math.PI), gold);
  shackle.position.y = 0.05;
  const keyhole = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color("#3A2A1A") }));
  keyhole.position.set(0, -0.005, 0.021);
  lock.add(lockBody, shackle, keyhole);
  lock.scale.setScalar(0.0001);
  group.add(lock);

  // Glass partition on the right: a low panel, glass above, an aluminium frame; a neighbour's chair beyond it.
  const PX = 1.72, PZ0 = -2.65, PZ1 = 0.7, PL = PZ1 - PZ0, PC = (PZ0 + PZ1) / 2;
  add(new THREE.BoxGeometry(0.06, 1.0, PL), mat("#3B3029", 0.75), PX, 0.5, PC);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.5, PL), new THREE.MeshStandardMaterial({ color: new THREE.Color("#8A9AA2"), roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.12 }));
  glass.position.set(PX, 1.75, PC);
  group.add(glass);
  const alu = mat("#8D8C88", 0.35, 0.8);
  add(new THREE.BoxGeometry(0.07, 0.05, PL), alu, PX, 1.0, PC);
  add(new THREE.BoxGeometry(0.07, 0.05, PL), alu, PX, 2.5, PC);
  [PZ0, -0.95, PZ1].forEach((z) => add(new THREE.BoxGeometry(0.07, 2.5, 0.05), alu, PX, 1.25, z));
  const leather = mat("#5A4636", 0.5);
  add(new THREE.BoxGeometry(0.5, 0.08, 0.5), leather, 2.45, 0.5, -1.7);
  add(new THREE.BoxGeometry(0.5, 0.7, 0.08), leather, 2.45, 0.9, -1.95);
  add(new THREE.BoxGeometry(1.4, 0.05, 0.75), wood, 2.6, 0.74, -0.9);

  // The desk: a wood top, a steel drawer pedestal under the far end, slim legs at the near end and a modesty panel.
  const top = 0.05, w = 2.0, d = 0.95;
  add(new THREE.BoxGeometry(w, top, d), wood, desk.x, desk.y - top / 2, desk.z);
  const pedH = desk.y - top;
  const ped = add(new THREE.BoxGeometry(0.46, pedH, d - 0.06), steel, desk.x + w / 2 - 0.28, pedH / 2, desk.z);
  for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(0.2, 0.025, 0.03), chrome, ped.position.x - 0.24, pedH - 0.12 - i * 0.22, desk.z + 0.12).rotation.y = Math.PI / 2;
  [[-1, -1], [-1, 1]].forEach(([sx, sz]) => add(new THREE.BoxGeometry(0.045, pedH, 0.045), steel, desk.x + sx * (w / 2 - 0.06), pedH / 2, desk.z + sz * (d / 2 - 0.06)));
  add(new THREE.BoxGeometry(w - 0.6, 0.42, 0.02), steel, desk.x - 0.2, pedH - 0.25, desk.z + d / 2 - 0.05);

  // The inbox box (kraft card, open top) with folders standing in it: where finished work goes.
  const kraft = new THREE.MeshStandardMaterial({ color: new THREE.Color("#B48A58"), roughness: 0.85, emissive: new THREE.Color("#D4A35F"), emissiveIntensity: 0 });
  const boxGroup = new THREE.Group();
  boxGroup.position.copy(box);
  const bw = 0.44, bd = 0.34, bh = 0.2, bt = 0.012;
  add(new THREE.BoxGeometry(bw, bt, bd), kraft, 0, bt / 2, 0, boxGroup);
  add(new THREE.BoxGeometry(bw, bh, bt), kraft, 0, bh / 2, bd / 2, boxGroup);
  add(new THREE.BoxGeometry(bw, bh, bt), kraft, 0, bh / 2, -bd / 2, boxGroup);
  add(new THREE.BoxGeometry(bt, bh, bd), kraft, bw / 2, bh / 2, 0, boxGroup);
  add(new THREE.BoxGeometry(bt, bh, bd), kraft, -bw / 2, bh / 2, 0, boxGroup);
  add(new THREE.PlaneGeometry(0.12, 0.05), mat("#EDE9E1", 0.6), 0, bh * 0.5, bd / 2 + bt / 2 + 0.002, boxGroup).castShadow = false;
  ["#5C7A92", "#E5E0D6", "#8E9AA3", "#D9CDB8", "#6E8698"].forEach((c, i) => {
    const f = add(new THREE.BoxGeometry(0.012, 0.24, 0.29), mat(c, 0.8), -0.16 + i * 0.065, 0.13, 0, boxGroup);
    f.rotation.z = (i - 2) * 0.06;
  });
  group.add(boxGroup);

  // A two-level letter tray at the front, a mug and a pen pot.
  const black = mat("#1B1B1D", 0.4, 0.3);
  const tray = new THREE.Group();
  tray.position.set(desk.x - 0.78, desk.y, desk.z + 0.26);
  tray.rotation.y = 0.1;
  [0.012, 0.085].forEach((y) => {
    add(new THREE.BoxGeometry(0.36, 0.01, 0.28), black, 0, y, 0, tray);
    add(new THREE.BoxGeometry(0.36, 0.04, 0.01), black, 0, y + 0.02, 0.14, tray);
    add(new THREE.BoxGeometry(0.31, 0.012, 0.24), paperMats, 0, y + 0.012, 0, tray);
  });
  [-1, 1].forEach((sx) => add(new THREE.BoxGeometry(0.01, 0.1, 0.28), black, sx * 0.18, 0.05, 0, tray));
  group.add(tray);
  const mug = mat("#7A7672", 0.4);
  add(new THREE.CylinderGeometry(0.042, 0.038, 0.1, 20), mug, desk.x - 0.42, desk.y + 0.05, desk.z + 0.12);
  add(new THREE.TorusGeometry(0.028, 0.008, 8, 16), mug, desk.x - 0.375, desk.y + 0.05, desk.z + 0.12);
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 16, 1, true), black, desk.x + 0.48, desk.y + 0.05, desk.z + 0.27);
  [0.12, -0.1, 0.03].forEach((a, i) => { const pen = add(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 6), i === 1 ? mat("#C4572F", 0.4) : black, desk.x + 0.48 + a * 0.1, desk.y + 0.11, desk.z + 0.27); pen.rotation.z = a; });

  // A small logbook on the desk, open: the agent writes down every step, one ticked line after another.
  const log = new THREE.Group();
  log.position.set(desk.x - 0.5, desk.y, desk.z + 0.33);
  log.rotation.y = 0.15;
  const cover = mat("#5A3426", 0.7);
  add(new THREE.BoxGeometry(0.3, 0.012, 0.21), cover, 0, 0.006, 0, log);
  [-1, 1].forEach((side) => {
    const page = add(new THREE.BoxGeometry(0.14, 0.006, 0.195), mat("#EEE8DC", 0.85), side * 0.073, 0.015, 0, log);
    page.rotation.z = side * -0.05;
  });
  const ink = new THREE.MeshBasicMaterial({ color: new THREE.Color("#6B645A") });
  const tickMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#C4572F") });
  const lines = Array.from({ length: 8 }, (_, i) => {
    const side = i < 4 ? -1 : 1, row = i % 4;
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.002, 0.008), ink);
    line.position.set(side * 0.073 - 0.008, 0.02, -0.06 + row * 0.04);
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.002, 0.014), tickMat);
    tick.position.set(side * 0.073 + 0.05, 0.02, -0.06 + row * 0.04);
    tick.rotation.y = Math.PI / 4;
    log.add(line, tick);
    return { line, tick };
  });
  group.add(log);

  // A laptop in front of the person (screen towards them), and a desk phone that lights up when a call is missed.
  const laptop = new THREE.Group();
  laptop.position.set(desk.x - 0.05, desk.y, desk.z - 0.24);
  laptop.rotation.y = Math.PI + 0.25;
  const alum = mat("#55585E", 0.35, 0.7);
  add(new THREE.BoxGeometry(0.32, 0.012, 0.22), alum, 0, 0.006, 0, laptop);
  const lid = new THREE.Group();
  lid.position.set(0, 0.012, -0.11);
  lid.rotation.x = -0.32;
  add(new THREE.BoxGeometry(0.32, 0.21, 0.008), alum, 0, 0.105, 0, lid);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.18), new THREE.MeshBasicMaterial({ color: new THREE.Color("#2A3440") }));
  screen.position.set(0, 0.105, 0.0045);
  lid.add(screen);
  laptop.add(lid);
  group.add(laptop);
  const phone = new THREE.Group();
  phone.position.set(desk.x - 0.62, desk.y, desk.z - 0.05);
  phone.rotation.y = 0.5;
  add(new THREE.BoxGeometry(0.17, 0.035, 0.2), black, 0, 0.018, 0, phone);
  add(new THREE.BoxGeometry(0.05, 0.03, 0.21), black, -0.06, 0.05, 0, phone);
  const phoneLight = new THREE.MeshBasicMaterial({ color: new THREE.Color("#2A2522") });
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.045), phoneLight);
  display.rotation.x = -Math.PI / 2;
  display.position.set(0.035, 0.037, -0.03);
  phone.add(display);
  group.add(phone);
  const ringOff = new THREE.Color("#2A2522"), ringOn = new THREE.Color("#FF8A55");

  // Wire bins, papers dropped on the floor and crumpled balls: the mess, tidied away as the work gets done.
  const wire = new THREE.MeshStandardMaterial({ color: new THREE.Color("#55524E"), roughness: 0.5, metalness: 0.6, wireframe: true });
  add(new THREE.CylinderGeometry(0.17, 0.14, 0.32, 18, 3, true), wire, -1.05, 0.16, 1.45);
  add(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 18, 3, true), wire, 1.42, 0.15, 0.45);
  const mess: THREE.Mesh[] = [];
  const sheet = new THREE.BoxGeometry(0.24, 0.004, 0.31);
  [[-1.9, 0.7], [-1.55, 1.1], [-2.15, 1.3], [-1.35, 1.75], [-1.8, 1.85], [-1.2, 0.95], [-2.4, 0.9]].forEach(([x, z]) => {
    const m = add(sheet, paperMats, x, 0.004, z);
    m.rotation.y = Math.random() * Math.PI;
    mess.push(m);
  });
  const crumple = crumpleGeometry();
  [[-2.3, 1.6], [-0.95, 1.5], [-1.05, 1.42], [-0.6, 1.2]].forEach(([x, z]) => {
    const b = add(crumple, paperMats[0], x, 0.06, z);
    b.scale.setScalar(0.6);
    b.rotation.set(Math.random() * 6, Math.random() * 6, 0);
    mess.push(b);
  });
  const sizes = mess.map((m) => m.scale.x);

  return {
    group,
    setTidy(done) { mess.forEach((m, i) => m.scale.setScalar(Math.max(0.0001, sizes[i] * (1 - Math.min(1, done * 1.4 - i * 0.04))))); },
    setGlow(glow) { kraft.emissiveIntensity = glow; },
    setPhone(ringing) { phoneLight.color.copy(ringOff).lerp(ringOn, ringing); },
    setDoor(open) {
      hinge.rotation.y = DOOR_OPEN * open;
      spill.intensity = 4 * open;
      corridorMat.color.copy(corridorDark).lerp(corridorLit, open);
    },
    setLock(shown) {
      const pop = shown < 1 ? shown * (1 + 0.3 * Math.sin(shown * Math.PI)) : 1;
      lock.scale.setScalar(Math.max(0.0001, pop * 1.4));
    },
    setLog(written) {
      lines.forEach(({ line, tick }, i) => {
        const k = Math.max(0, Math.min(1, written * lines.length - i));
        line.scale.x = Math.max(0.0001, k);
        line.position.x = (i < 4 ? -0.073 : 0.073) - 0.008 - 0.04 * (1 - k);
        tick.visible = k >= 1;
      });
    },
  };
}
