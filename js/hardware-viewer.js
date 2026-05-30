import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDevice } from './device.js?v=27';

const canvas = document.getElementById('hardware-viewer');

const DETAILS = {
  'main-pcb': {
    eyebrow: '01 / Reusable core',
    title: 'Main PCB',
    copy: 'The main board is the reusable foundation: compute, wireless communication, power management and the interface between sensor modules and software.',
    role: 'Core electronics',
    status: 'Designed, assembled and tested',
    question: 'Firmware, module interface and longer bring-up',
  },
  'puck-top': {
    eyebrow: '02 / Puck PCB top',
    title: 'Sensor puck PCB, top side',
    copy: 'A round puck PCB seen from the component side. This is the modular sensor board concept before assembly, reflow and validation.',
    role: 'Replaceable sensor module PCB',
    status: 'PCB and parts present',
    question: 'Populate, reflow and bring up the first board',
  },
  'puck-bottom': {
    eyebrow: '03 / Puck PCB bottom',
    title: 'Sensor puck PCB, bottom side',
    copy: 'The same puck-board idea shown from below, so the contact and routing side can be inspected separately from the component side.',
    role: 'Replaceable sensor module PCB',
    status: 'PCB and parts present',
    question: 'Verify pads, contact reliability and electrical continuity',
  },
};

const COMPONENTS = [
  {
    key: 'main-pcb',
    ids: ['main-pcb'],
    target: 3.75,
    selectedScale: 1.14,
    layout: { x: 0, z: -1.34 },
    mobile: { x: 0, z: -1.96 },
  },
  {
    key: 'puck-top',
    ids: ['puck1-pcb'],
    target: 1.45,
    selectedScale: 1.34,
    layout: { x: -1.18, z: 1.65 },
    mobile: { x: -0.9, z: 1.44 },
  },
  {
    key: 'puck-bottom',
    ids: ['puck2-pcb'],
    target: 1.45,
    selectedScale: 1.34,
    flip: true,
    layout: { x: 1.18, z: 1.65 },
    mobile: { x: 0.9, z: 1.44 },
  },
];

const buttons = [...document.querySelectorAll('[data-bench-part]')];
const detailEls = {
  eyebrow: document.querySelector('[data-bench-eyebrow]'),
  title: document.querySelector('[data-bench-title]'),
  copy: document.querySelector('[data-bench-copy]'),
  role: document.querySelector('[data-bench-role]'),
  status: document.querySelector('[data-bench-status]'),
  question: document.querySelector('[data-bench-question]'),
};

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function centerGroup(group) {
  group.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());

  group.children.forEach((child) => {
    child.position.sub(center);
  });

  group.updateWorldMatrix(true, true);
  const centeredBox = new THREE.Box3().setFromObject(group);
  const size = centeredBox.getSize(new THREE.Vector3());
  return Math.max(size.x, size.z, 0.001);
}

function updateDetailPanel(key) {
  const detail = DETAILS[key];
  if (!detail) return;

  detailEls.eyebrow.textContent = detail.eyebrow;
  detailEls.title.textContent = detail.title;
  detailEls.copy.textContent = detail.copy;
  detailEls.role.textContent = detail.role;
  detailEls.status.textContent = detail.status;
  detailEls.question.textContent = detail.question;

  buttons.forEach((button) => {
    const active = button.dataset.benchPart === key;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setMaterialState(group, selected, hovered) {
  group.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];

    mats.forEach((mat) => {
      if (!mat.emissive) return;
      if (!mat.userData.benchBaseEmissive) {
        mat.userData.benchBaseEmissive = mat.emissive.clone();
        mat.userData.benchBaseIntensity = mat.emissiveIntensity || 0;
      }

      mat.emissive.copy(mat.userData.benchBaseEmissive);
      mat.emissiveIntensity = mat.userData.benchBaseIntensity;

      if (selected) {
        mat.emissive.lerp(new THREE.Color(0x1d5fd1), 0.42);
        mat.emissiveIntensity = 0.12;
      } else if (hovered) {
        mat.emissive.lerp(new THREE.Color(0x8fb4ff), 0.28);
        mat.emissiveIntensity = 0.06;
      }
    });
  });
}

if (canvas) {
  initBench().catch((error) => {
    console.error('Could not initialize hardware bench', error);
    canvas.closest('.hardware-bench')?.classList.add('is-error');
  });
}

async function initBench() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
  camera.position.set(0, 8.8, 0.001);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfd6df, 1.85));

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-2.8, 6.6, 3.6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x8fb4ff, 1.35);
  rim.position.set(4.6, 4.8, -3.4);
  scene.add(rim);

  const warm = new THREE.DirectionalLight(0xf2c078, 0.78);
  warm.position.set(-3.8, 2.4, -4.2);
  scene.add(warm);

  const device = await buildDevice('full', { partIds: COMPONENTS.flatMap((component) => component.ids) });
  const workbench = new THREE.Group();
  scene.add(workbench);

  device.group.updateWorldMatrix(true, true);
  const partRecords = [];
  device.group.traverse((object) => {
    if (!object.userData.partId) return;
    partRecords.push({
      object,
      matrixWorld: object.matrixWorld.clone(),
    });
  });

  const partsById = new Map();
  partRecords.forEach(({ object, matrixWorld }) => {
    object.parent?.remove(object);
    object.matrix.copy(matrixWorld);
    object.matrix.decompose(object.position, object.quaternion, object.scale);
    partsById.set(object.userData.partId, object);
  });

  const componentGroups = new Map();
  COMPONENTS.forEach((component) => {
    const group = new THREE.Group();
    group.name = component.key;
    group.userData.componentKey = component.key;

    component.ids.forEach((id) => {
      const part = partsById.get(id);
      if (!part) return;
      group.add(part);
    });

    const maxDim = centerGroup(group);
    const baseScale = component.target / maxDim;
    group.userData.baseScale = baseScale;
    group.userData.currentScale = baseScale;
    group.userData.targetScale = baseScale;
    if (component.flip) group.rotation.x = Math.PI;

    group.traverse((child) => {
      if (!child.isMesh) return;
      child.userData.componentKey = component.key;
    });

    componentGroups.set(component.key, group);
    workbench.add(group);
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selectedKey = 'main-pcb';
  let hoveredKey = null;
  let transitionFrame = null;
  let transitionStart = 0;

  function applyLayout() {
    const mobile = canvas.clientWidth < 620;
    COMPONENTS.forEach((component) => {
      const group = componentGroups.get(component.key);
      if (!group) return;
      const layout = mobile ? component.mobile : component.layout;
      group.position.set(layout.x, component.key === selectedKey ? 0.16 : 0, layout.z);
    });
  }

  function render() {
    renderer.render(scene, camera);
  }

  function resize() {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    const aspect = width / height;
    const minimumViewWidth = width < 620 ? 4.35 : 6.25;
    const baseViewHeight = width < 620 ? 5.65 : 5.2;
    const viewHeight = Math.max(baseViewHeight, minimumViewWidth / aspect);

    renderer.setSize(width, height, false);
    camera.left = -viewHeight * aspect / 2;
    camera.right = viewHeight * aspect / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    applyLayout();
    render();
  }

  function startTransition() {
    if (transitionFrame) cancelAnimationFrame(transitionFrame);
    transitionStart = performance.now();

    componentGroups.forEach((group) => {
      group.userData.startScale = group.scale.x || group.userData.baseScale;
      group.userData.startY = group.position.y;
    });

    const step = (now) => {
      const t = easeOutCubic(Math.min((now - transitionStart) / 340, 1));

      componentGroups.forEach((group, key) => {
        const component = COMPONENTS.find((item) => item.key === key);
        const targetScale = group.userData.baseScale * (key === selectedKey ? component.selectedScale : 1);
        const targetY = key === selectedKey ? 0.16 : 0;
        const nextScale = THREE.MathUtils.lerp(group.userData.startScale, targetScale, t);
        const nextY = THREE.MathUtils.lerp(group.userData.startY, targetY, t);

        group.scale.setScalar(nextScale);
        group.position.y = nextY;
      });

      render();

      if (t < 1) {
        transitionFrame = requestAnimationFrame(step);
      } else {
        transitionFrame = null;
      }
    };

    transitionFrame = requestAnimationFrame(step);
  }

  function updateSelection(key) {
    if (!componentGroups.has(key)) return;
    selectedKey = key;
    updateDetailPanel(key);

    componentGroups.forEach((group, groupKey) => {
      setMaterialState(group, groupKey === selectedKey, groupKey === hoveredKey);
    });

    startTransition();
  }

  function pickComponent(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects([...componentGroups.values()], true);
    return hits.find((hit) => hit.object.userData.componentKey)?.object.userData.componentKey || null;
  }

  canvas.addEventListener('pointermove', (event) => {
    const nextHover = pickComponent(event);
    if (nextHover === hoveredKey) return;
    hoveredKey = nextHover;
    canvas.style.cursor = hoveredKey ? 'pointer' : 'default';

    componentGroups.forEach((group, key) => {
      setMaterialState(group, key === selectedKey, key === hoveredKey);
    });
    render();
  }, { passive: true });

  canvas.addEventListener('pointerleave', () => {
    hoveredKey = null;
    canvas.style.cursor = 'default';
    componentGroups.forEach((group, key) => {
      setMaterialState(group, key === selectedKey, false);
    });
    render();
  }, { passive: true });

  canvas.addEventListener('click', (event) => {
    const key = pickComponent(event);
    if (key) updateSelection(key);
  });

  buttons.forEach((button) => {
    button.addEventListener('click', () => updateSelection(button.dataset.benchPart));
  });

  window.addEventListener('resize', resize, { passive: true });

  componentGroups.forEach((group) => {
    group.scale.setScalar(group.userData.baseScale);
  });
  applyLayout();
  updateSelection(selectedKey);
  resize();
}
