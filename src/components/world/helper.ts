/**
 * The Akrithos agent as a small, friendly helper: a round body about the size of a grapefruit, a dark face with two
 * warm eyes and a smile, the Akrithos peak on top, and two little arms it waves with. It floats beside the person
 * and does the work in the scene (engine.ts moves it from step to step). Its soft light falls on what it is near.
 */
import * as THREE from "three";

/** Light that glows at the edges and is clear in the middle; fades out below `fadeTo` (world height). */
export function glowMaterial(color: string, opts: { power?: number; base?: number; fadeFrom?: number; fadeTo?: number; side?: THREE.Side } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      opacity: { value: 0 },
      power: { value: opts.power ?? 2 },
      base: { value: opts.base ?? 0.12 },
      fadeFrom: { value: opts.fadeFrom ?? -1 },
      fadeTo: { value: opts.fadeTo ?? -0.5 },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vY = wp.y;
        vec4 mv = viewMatrix * wp;
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 color; uniform float opacity; uniform float power; uniform float base; uniform float fadeFrom; uniform float fadeTo;
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), power);
        float a = (base + f) * opacity * smoothstep(fadeFrom, fadeTo, vY);
        gl_FragColor = vec4(color * (0.7 + 0.9 * f) * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: opts.side ?? THREE.FrontSide,
  });
}

/** `size` is the body's radius in metres. */
export function createHelper(size = 0.085) {
  const group = new THREE.Group(); // positioned by the engine
  const bot = new THREE.Group(); // turns to face the camera, tilts and bobs
  bot.scale.setScalar(size);
  group.add(bot);

  const shell = new THREE.MeshStandardMaterial({ color: new THREE.Color("#F4E6D2"), roughness: 0.32, metalness: 0.05, emissive: new THREE.Color("#E8914A"), emissiveIntensity: 0.08 });
  const visor = new THREE.MeshStandardMaterial({ color: new THREE.Color("#1A1513"), roughness: 0.18, metalness: 0.3 });
  const light = new THREE.MeshBasicMaterial({ color: new THREE.Color("#F2C88E") });
  const ember = new THREE.MeshStandardMaterial({ color: new THREE.Color("#C4572F"), emissive: new THREE.Color("#E8714A"), emissiveIntensity: 0.6, roughness: 0.4 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), shell);
  body.scale.set(1, 0.94, 1);
  body.castShadow = true;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.74, 32, 20), visor);
  face.scale.set(1, 0.78, 0.5);
  face.position.set(0, 0.05, 0.66);
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), light);
    eye.scale.set(1, 1.35, 0.5);
    eye.position.set(side * 0.27, 0.12, 1.0);
    return eye;
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20, Math.PI), light);
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.1, 1.0);
  // The Akrithos peak on top, like a little antenna.
  const s = new THREE.Shape();
  s.moveTo(-1.15, -0.9); s.lineTo(0, 1.25); s.lineTo(1.15, -0.9); s.lineTo(0.66, -0.9); s.lineTo(0, 0.38); s.lineTo(-0.66, -0.9); s.closePath();
  const peak = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3 }), ember);
  peak.geometry.center();
  peak.scale.setScalar(0.24);
  peak.position.set(0, 1.12, 0);
  // Two little arms: the right one waves.
  const arms = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.92, -0.05, 0.05);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.42, 4, 10), shell);
    arm.position.y = -0.3;
    arm.castShadow = true;
    pivot.add(arm);
    pivot.rotation.z = side * 0.35;
    return pivot;
  });
  bot.add(body, face, ...eyes, smile, peak, ...arms);

  // A soft warm light of its own.
  const glow = new THREE.PointLight(new THREE.Color("#FFB070"), 0, 1.4, 1.8);
  glow.position.set(0, 0, 0.2);
  group.add(glow);

  let nextBlink = 3;
  return {
    group,
    /**
     * presence: 0 hidden to 1 here; wave: 0 to 1 while saying hello; busy: leaning in to work; face: where to look
     * (world position, usually the camera); t: time in seconds.
     */
    update(presence: number, wave: number, busy: number, face: THREE.Vector3, t: number) {
      group.visible = presence > 0.01;
      // Pops in with a small bounce.
      const pop = presence < 1 ? presence * (1 + 0.25 * Math.sin(presence * Math.PI)) : 1;
      bot.scale.setScalar(size * Math.max(0.001, pop));
      bot.position.y = Math.sin(t * 1.6) * 0.012;
      bot.lookAt(face.x, group.position.y, face.z);
      bot.rotateX(busy * 0.45); // leans towards the work
      arms[0].rotation.z = -0.35 - wave * (1.9 + Math.sin(t * 9) * 0.45); // waves hello
      arms[1].rotation.z = 0.35 + busy * 0.25 * Math.sin(t * 5);
      // Blinks now and then, quickly and rarely.
      if (t > nextBlink) nextBlink = t + 4 + Math.random() * 3;
      const blink = nextBlink - t > 3.85 ? 0.15 : 1;
      eyes.forEach((e) => { e.scale.y = 1.35 * blink; });
      glow.intensity = presence * 0.35;
    },
  };
}
