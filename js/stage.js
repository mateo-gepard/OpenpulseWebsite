import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { buildDevice } from './device.js?v=26';

const canvas = document.getElementById('scene');
const stage = document.getElementById('stage');

// ---------- renderer / scene / camera ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 2.5, 8.8);
camera.lookAt(0, 0, 0);

function groundGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(256, 256, 20, 256, 256, 245);
  g.addColorStop(0, 'rgba(34,58,100,0.45)');
  g.addColorStop(0.35, 'rgba(16,24,42,0.24)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// environment for crisp reflections
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
RectAreaLightUniformsLib.init();

// lights tuned for a studio product-render look on a near-black backdrop
const hemi = new THREE.HemisphereLight(0x64718e, 0x020304, 0.22);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.75);
key.position.set(3.4, 7.8, 5.6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 30;
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 8;
key.shadow.camera.bottom = -8;
key.shadow.bias = -0.0004;
key.shadow.radius = 6;
scene.add(key);
const fill = new THREE.DirectionalLight(0x6f9cff, 0.28);
fill.position.set(-6, 1, -2);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 3.2);
rim.position.set(-3, 3, -8);
scene.add(rim);
const rim2 = new THREE.DirectionalLight(0x77a7ff, 2.05);
rim2.position.set(5, -0.7, -6);
scene.add(rim2);
const topSoftbox = new THREE.RectAreaLight(0xffffff, 6.0, 5.4, 2.2);
topSoftbox.position.set(-2.7, 4.7, 3.0);
topSoftbox.lookAt(0, 0, 0);
scene.add(topSoftbox);
const sideStrip = new THREE.RectAreaLight(0x70a7ff, 6.4, 0.8, 5.4);
sideStrip.position.set(4.1, 0.9, -2.2);
sideStrip.lookAt(0, 0, 0);
scene.add(sideStrip);
const warmEdge = new THREE.RectAreaLight(0xffb26f, 1.9, 0.9, 3.8);
warmEdge.position.set(-4.2, 1.2, 2.7);
warmEdge.lookAt(0, 0, 0);
scene.add(warmEdge);
const blueUplight = new THREE.PointLight(0x2f6fff, 1.55, 6.5, 2.2);
blueUplight.position.set(0.6, -2.2, 2.2);
scene.add(blueUplight);

// soft contact shadow catcher
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.ShadowMaterial({ opacity: 0 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -2.9;
shadowPlane.receiveShadow = false;
const groundGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(8.5, 5.2),
  new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
);
groundGlow.rotation.x = -Math.PI / 2;
groundGlow.position.y = -2.88;
groundGlow.renderOrder = -1;
scene.add(groundGlow);

// device
const device = await buildDevice('full', { initial: 'shell' });
scene.add(device.group);
let fullDevicePromise = null;

function ensureFullDevice() {
  if (!device.loadFull || fullDevicePromise) return fullDevicePromise;
  fullDevicePromise = device.loadFull().catch((error) => {
    console.error('Could not load full OpenPulse model', error);
  });
  return fullDevicePromise;
}

const loadWhenIdle = window.requestIdleCallback
  ? (task) => window.requestIdleCallback(task, { timeout: 5000 })
  : (task) => window.setTimeout(task, 2200);

loadWhenIdle(() => ensureFullDevice());

// ---------- helpers ----------
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
// ramp up then down within [a..b..c..d]
function band(p, a, b, c, d) {
  return smoothstep(a, b, p) * (1 - smoothstep(c, d, p));
}

// ---------- phase map (in scroll progress 0..1) ----------
const PH = {
  heroEnd: 0.10,
  problem: [0.10, 0.20],
  reveal: [0.20, 0.30],
  explode: [0.30, 0.44],
  anatomy: [0.44, 0.82],
  reassemble: [0.82, 0.90],
  final: [0.90, 1.0],
};
const ANATOMY_STEPS = 7; // pcb, base, top, pucks, software, data, repair
const HIGHLIGHT = ['pcb', 'base', 'top', 'pucks', null, null, null];

function setLayerOpacity(layer, op) {
  layer.opacity = op;
  layer.group.traverse((o) => {
    if (!o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((mat) => {
      const base = mat.userData?.baseOpacity ?? 1;
      mat.opacity = base * op;
      mat.transparent = true;
      mat.depthWrite = mat.opacity > 0.78;
    });
  });
}

// ---------- main update ----------
let progress = 0;       // smoothed
let targetProgress = 0;
let spin = 0;

function update(dt) {
  progress += (targetProgress - progress) * Math.min(1, dt * 6);
  const p = progress;
  spin += dt * 0.18;

  // ---- explode amount ----
  let explode = 0;
  if (p >= PH.explode[0]) explode = smoothstep(PH.explode[0], PH.explode[1], p);
  if (p >= PH.reassemble[0]) explode *= 1 - smoothstep(PH.reassemble[0], PH.reassemble[1], p);

  // ---- layer positions ----
  device.layers.forEach((l) => {
    l.group.position.y = lerp(l.restY, l.exY, explode);
  });
  device.straps.forEach((s) => {
    s.group.position.z = lerp(s.restZ, s.exZ, explode);
    s.group.position.y = lerp(s.restY, s.exY, explode);
  });

  // ---- anatomy highlighting ----
  let activeId = null;
  let dataReveal = 0;
  if (p >= PH.anatomy[0] && p < PH.anatomy[1]) {
    const ap = (p - PH.anatomy[0]) / (PH.anatomy[1] - PH.anatomy[0]);
    const step = Math.min(ANATOMY_STEPS - 1, Math.floor(ap * ANATOMY_STEPS));
    activeId = HIGHLIGHT[step];
    if (step >= 4) dataReveal = 1; // software/data/repair show data layer
  }

  device.layers.forEach((l) => {
    let want = 1;
    if (activeId) {
      want = (l.id === activeId) ? 1 : 0.16;
    }
    // current opacity lerp
    const cur = l.opacity ?? 1;
    setLayerOpacity(l, lerp(cur, want, Math.min(1, dt * 8)));
    // nudge active toward camera
    const nudge = (activeId && l.id === activeId) ? 0.4 : 0;
    l.group.position.z = lerp(l.group.position.z || 0, nudge, Math.min(1, dt * 6));
  });

  // data plane
  const dataTarget = dataReveal * 0.85;
  device.dataPlane.material.opacity = lerp(device.dataPlane.material.opacity, dataTarget, Math.min(1, dt * 4));
  device.dataPlane.material.map.offset.y = (spin * 0.04) % 1;

  // ---- group transform: rotation, position, scale ----
  // gentle idle spin throughout; settle to a hero/resting yaw
  const settle = smoothstep(PH.final[0], PH.final[1], p);
  const baseYaw = -0.5 + Math.sin(spin) * 0.12;
  device.group.rotation.y = lerp(baseYaw, -0.7, settle);
  device.group.rotation.x = lerp(0.02 + Math.sin(spin * 0.7) * 0.02, 0.08, settle);

  // float
  const floatY = Math.sin(spin * 1.1) * 0.12 * (1 - explode * 0.6);

  // shift device to the right in hero, center during story, left in final
  const heroT = 1 - smoothstep(0, PH.problem[0], p);
  const mobileView = window.innerWidth < 820;
  const narrowView = window.innerWidth < 920;
  const heroLift = heroT * (narrowView ? -0.62 : -1.0);
  const heroShift = 0;
  const storyLift = mobileView ? smoothstep(PH.problem[0], PH.final[0], p) * (1 - settle) * 0.24 : 0;
  const finalShift = settle * (mobileView ? 0 : (narrowView ? -2.75 : -5.0));
  device.group.position.x = heroShift + finalShift;
  device.group.position.y = floatY + heroLift + storyLift + lerp(0, -0.2, explode * (1 - settle));
  const heroScale = narrowView ? 0.44 : 0.52;
  const storyScale = mobileView ? 0.56 : 1;
  const finalScale = mobileView ? 0.54 : (narrowView ? 0.62 : 0.78);
  const sc = lerp(lerp(heroScale, storyScale, smoothstep(0, PH.problem[0], p)), finalScale, settle);
  device.group.scale.setScalar(sc);

  // camera dolly back a touch during explode for headroom
  const mobileStoryDolly = mobileView ? smoothstep(0, PH.problem[0], p) : 0;
  const baseDolly = lerp(8.8, mobileView ? 10.0 : 8.8, mobileStoryDolly);
  const dolly = lerp(baseDolly, mobileView ? 11.1 : 9.9, explode * (1 - settle));
  camera.position.z = lerp(camera.position.z, dolly, Math.min(1, dt * 4));
  camera.position.y = lerp(camera.position.y, lerp(2.5, 2.3, settle), Math.min(1, dt * 4));
  camera.lookAt(device.group.position.x * 0.5, 0, 0);

  canvas.style.opacity = (1 - smoothstep(0.992, 1, p) * 0.9).toFixed(3);
  renderer.render(scene, camera);
}

// ---------- scroll ----------
function onScroll() {
  const rect = stage.getBoundingClientRect();
  const total = stage.offsetHeight - window.innerHeight;
  const scrolled = clamp(-rect.top, 0, total);
  targetProgress = total > 0 ? scrolled / total : 0;
  if (targetProgress > 0.08) ensureFullDevice();
  updateOverlays(targetProgress);
}

// ---------- overlays ----------
const overlays = [...document.querySelectorAll('[data-range]')].map((el) => {
  const [a, b, c, d] = el.dataset.range.split(',').map(Number);
  return { el, a, b, c, d, side: el.dataset.side };
});

function updateOverlays(p) {
  overlays.forEach((o) => {
    const v = band(p, o.a, o.b, o.c, o.d);
    o.el.style.opacity = v.toFixed(3);
    o.el.style.pointerEvents = v > 0.5 ? 'auto' : 'none';
  });
  // anatomy step indicator
  const ind = document.getElementById('anatomy-progress');
  if (ind) {
    if (p >= PH.anatomy[0] && p < PH.anatomy[1]) {
      const ap = (p - PH.anatomy[0]) / (PH.anatomy[1] - PH.anatomy[0]);
      const step = Math.min(ANATOMY_STEPS - 1, Math.floor(ap * ANATOMY_STEPS));
      ind.style.opacity = '1';
      ind.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('on', i === step));
    } else {
      ind.style.opacity = '0';
    }
  }
}

// ---------- resize ----------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// ---------- loop ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  requestAnimationFrame(loop);
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', resize);
resize();
onScroll();
requestAnimationFrame(loop);

// reveal canvas once first frame is ready
canvas.style.opacity = '1';
