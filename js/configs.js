import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { buildDevice } from './device.js?v=25';

function groundGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 384;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(192, 192, 12, 192, 192, 180);
  g.addColorStop(0, 'rgba(34,58,100,0.38)');
  g.addColorStop(0.42, 'rgba(14,22,38,0.2)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 384, 384);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

async function makeMini(canvas, variant) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 2.6, 8.6);
  camera.lookAt(0, -0.1, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  RectAreaLightUniformsLib.init();

  scene.add(new THREE.HemisphereLight(0x64718e, 0x020304, 0.22));
  const key = new THREE.DirectionalLight(0xffffff, 1.65);
  key.position.set(3, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 7;
  key.shadow.camera.bottom = -7;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6f9cff, 0.28);
  fill.position.set(-5, 1, -2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 3.0);
  rim.position.set(-3, 3, -8); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x77a7ff, 1.85);
  rim2.position.set(5, -1, -6); scene.add(rim2);
  const topSoftbox = new THREE.RectAreaLight(0xffffff, 5.0, 4.4, 2.0);
  topSoftbox.position.set(-2.2, 4.2, 3.0);
  topSoftbox.lookAt(0, 0, 0);
  scene.add(topSoftbox);
  const sideStrip = new THREE.RectAreaLight(0x70a7ff, 4.8, 0.8, 4.6);
  sideStrip.position.set(4.0, 0.8, -2.0);
  sideStrip.lookAt(0, 0, 0);
  scene.add(sideStrip);
  const warmEdge = new THREE.RectAreaLight(0xffb26f, 1.3, 0.8, 3.2);
  warmEdge.position.set(-4.0, 1.0, 2.6);
  warmEdge.lookAt(0, 0, 0);
  scene.add(warmEdge);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.ShadowMaterial({ opacity: 0.2 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -2.9;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);
  const groundGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 4.2),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  groundGlow.rotation.x = -Math.PI / 2;
  groundGlow.position.y = -2.88;
  scene.add(groundGlow);

  const d = await buildDevice(variant);
  d.group.rotation.x = 0.06;
  scene.add(d.group);

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  let visible = true;
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }, { threshold: 0, rootMargin: '200px' }).observe(canvas);

  let t = Math.random() * 10;
  function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    t += 0.006;
    d.group.rotation.y = -0.5 + Math.sin(t) * 0.45;
    d.group.position.y = Math.sin(t * 1.2) * 0.12;
    renderer.render(scene, camera);
  }
  loop();
}

document.querySelectorAll('[data-config]').forEach((c) => {
  makeMini(c, c.dataset.config).catch((err) => {
    console.error(`Could not load ${c.dataset.config} model`, err);
  });
});
