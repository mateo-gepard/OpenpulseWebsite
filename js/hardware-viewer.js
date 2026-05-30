import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { buildDevice } from './device.js?v=25';

const canvas = document.getElementById('hardware-viewer');

if (canvas) {
  RectAreaLightUniformsLib.init();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const cameraTarget = new THREE.Vector3(0, -0.1, 0);
  camera.position.set(0.15, 1.7, 8.8);
  camera.lookAt(cameraTarget);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xdce9ff, 0x08090d, 1.15));

  const key = new THREE.RectAreaLight(0xbfd7ff, 4.5, 6, 3);
  key.position.set(-3.6, 4.2, 4.4);
  key.lookAt(0, 0, 0);
  scene.add(key);

  const rim = new THREE.RectAreaLight(0x2f7cff, 5.2, 3, 6);
  rim.position.set(4.3, 1.4, -2.7);
  rim.lookAt(0, 0, 0);
  scene.add(rim);

  const warm = new THREE.PointLight(0xf4a261, 22, 15, 2.2);
  warm.position.set(-3.4, -1.8, 3.2);
  scene.add(warm);

  const bench = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 8),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.32 })
  );
  bench.rotation.x = -Math.PI / 2;
  bench.position.y = -2.2;
  bench.receiveShadow = true;
  scene.add(bench);

  const device = await buildDevice('dev');
  device.group.scale.setScalar(0.95);
  device.group.rotation.set(-0.24, 0.48, 0.02);
  device.group.position.set(0, -0.04, 0);
  scene.add(device.group);

  const layerPositions = {
    top: 0.92,
    outPuck: 0.38,
    pcb: -0.12,
    skinPucks: -0.58,
    base: -1.04,
  };

  device.layers.forEach((layer) => {
    layer.group.position.y = layerPositions[layer.group.name] ?? layerPositions[layer.id] ?? 0;
    layer.group.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat.userData.fadeable) return;
        mat.opacity = Math.min(mat.opacity, layer.id === 'top' ? 0.62 : 0.92);
        mat.transparent = true;
      });
    });
  });

  device.dataPlane.material.opacity = 0;
  device.dataPlane.position.set(0, 0, -2.6);

  const resize = () => {
    const { clientWidth, clientHeight } = canvas;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / Math.max(clientHeight, 1);
    camera.updateProjectionMatrix();
    camera.lookAt(cameraTarget);
  };

  const clock = new THREE.Clock();
  const animate = () => {
    const t = clock.getElapsedTime();
    device.group.rotation.y = 0.42 + Math.sin(t * 0.22) * 0.12;
    device.group.rotation.x = -0.24 + Math.sin(t * 0.31) * 0.035;
    device.group.position.y = -0.04 + Math.sin(t * 0.7) * 0.05;
    device.dataPlane.rotation.z = t * 0.025;
    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  window.addEventListener('resize', resize);
  resize();
  animate();
}
