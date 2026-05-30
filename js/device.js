import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export const ACCENT = 0x2563eb;
const ACCENT_C = new THREE.Color(ACCENT);

const MODEL_BASE = new URL('../3DModels/', import.meta.url).href;
const MODEL_SCALE = 0.08;
const CAD_TO_SCENE = new THREE.Euler(Math.PI / 2, 0, 0);

// These offsets seat the locally exported puck PCB models into the
// corresponding CAD-positioned puck housings.
const PUCK_PCB_OFFSETS = {
  puck1: { x: 24.019, y: -10.051, z: 3.314 },
  puck2: { x: 12.019, y: -10.051, z: 3.314 },
  puck3: { x: 29.009, y: -9.902, z: -3.230 },
};

const PARTS = [
  { id: 'case-main', layer: 'top', role: 'case', obj: 'CaseMainBody.obj', mtl: 'CaseMainBody.mtl' },
  { id: 'case-bottom', layer: 'base', role: 'case', obj: 'CaseUnterseite.obj', mtl: 'CaseUnterseite.mtl' },
  { id: 'main-pcb', layer: 'pcb', role: 'pcb', obj: 'MainPCB v1.obj', mtl: 'MainPCB v1.mtl' },

  { id: 'puck1-case', layer: 'skinPucks', role: 'puckCase', puck: 'puck1', obj: 'Puck1Case.obj', mtl: 'Puck1Case.mtl' },
  { id: 'puck1-bottom', layer: 'skinPucks', role: 'puckCase', puck: 'puck1', obj: 'Puck1Unterseite.obj', mtl: 'Puck1Unterseite.mtl' },
  { id: 'puck1-pcb', layer: 'skinPucks', role: 'puckPcb', puck: 'puck1', cadOffset: PUCK_PCB_OFFSETS.puck1, obj: 'Puck1PCB.obj', mtl: 'Puck1PCB.mtl' },

  { id: 'puck2-case', layer: 'skinPucks', role: 'puckCase', puck: 'puck2', obj: 'Puck2Case.obj', mtl: 'Puck2Case.mtl' },
  { id: 'puck2-bottom', layer: 'skinPucks', role: 'puckCase', puck: 'puck2', obj: 'Puck2Unterseite.obj', mtl: 'Puck2Unterseite.mtl' },
  { id: 'puck2-pcb', layer: 'skinPucks', role: 'puckPcb', puck: 'puck2', cadOffset: PUCK_PCB_OFFSETS.puck2, obj: 'Puck2PCB.obj', mtl: 'Puck2PCB.mtl' },

  { id: 'puck3-case', layer: 'outPuck', role: 'puckCase', puck: 'puck3', obj: 'Puck3Case.obj', mtl: 'Puck3Case.mtl' },
  { id: 'puck3-bottom', layer: 'outPuck', role: 'puckCase', puck: 'puck3', obj: 'Puck3Unterseite.obj', mtl: 'Puck3Unterseite.mtl' },
  { id: 'puck3-pcb', layer: 'outPuck', role: 'puckPcb', puck: 'puck3', cadOffset: PUCK_PCB_OFFSETS.puck3, sceneOffset: new THREE.Vector3(0, -0.035, 0), extraRotation: new THREE.Euler(Math.PI, 0, 0), obj: 'Puck3PCB.obj', mtl: 'Puck3PCB.mtl' },
];

const SHELL_PART_IDS = new Set([
  'case-main',
  'case-bottom',
  'puck3-case',
  'puck3-bottom',
]);

const templateCache = new Map();
const surfaceTextureCache = new Map();

function hashNoise(x, y) {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function surfaceTexture(kind) {
  if (surfaceTextureCache.has(kind)) return surfaceTextureCache.get(kind);

  const size = kind.startsWith('titanium') ? 1024 : 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = hashNoise(x, y);
      let v = 128;

      if (kind === 'satin') {
        v = 132 + n * 9 + Math.sin(y * 0.55) * 5 + Math.sin(y * 2.2) * 2;
      } else if (kind === 'titanium' || kind === 'titanium-roughness') {
        const longBrush = Math.sin(y * 0.18) * 8 + Math.sin(y * 0.74 + x * 0.006) * 4;
        const microBrush = Math.sin(y * 4.8 + hashNoise(Math.floor(x / 52), 0) * 8) * 1.8;
        const cloudyOxide = (hashNoise(Math.floor(x / 42), Math.floor(y / 42)) - 0.5) * 22;
        const hairline = hashNoise(Math.floor(x / 5), y) > 0.988 ? 34 : 0;
        const fineCut = hashNoise(x, Math.floor(y / 3)) > 0.996 ? -28 : 0;
        v = kind === 'titanium-roughness'
          ? 178 + longBrush * 0.75 + microBrush + cloudyOxide * 0.5 + hairline * 0.7
          : 126 + n * 10 + longBrush + microBrush + cloudyOxide + hairline + fineCut;
      } else if (kind === 'titanium-color') {
        const brush = Math.sin(y * 0.2) * 7 + Math.sin(y * 0.82 + x * 0.006) * 3;
        const oxide = (hashNoise(Math.floor(x / 34), Math.floor(y / 34)) - 0.5) * 20;
        const streak = hashNoise(Math.floor(x / 4), y) > 0.992 ? 20 : 0;
        v = 188 + brush + oxide + streak + n * 5;
      } else if (kind === 'pcb') {
        const trace = (x % 44 < 2 || y % 58 < 2) ? 9 : 0;
        v = 126 + n * 7 + trace;
      } else {
        v = 128 + n * 8;
      }

      const i = (y * size + x) * 4;
      const clamped = Math.max(0, Math.min(255, v));
      if (kind === 'titanium-color') {
        img.data[i] = Math.max(0, Math.min(255, clamped + 5));
        img.data[i + 1] = Math.max(0, Math.min(255, clamped + 2));
        img.data[i + 2] = Math.max(0, Math.min(255, clamped - 7));
      } else {
        img.data[i] = clamped;
        img.data[i + 1] = clamped;
        img.data[i + 2] = clamped;
      }
      img.data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = kind === 'titanium-color' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (kind.startsWith('titanium')) {
    texture.repeat.set(0.55, 1.15);
  } else {
    texture.repeat.set(kind === 'pcb' ? 1.4 : 2.4, kind === 'pcb' ? 1.4 : 5.0);
  }
  surfaceTextureCache.set(kind, texture);
  return texture;
}

function gridTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 512, 512);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function materialTone(part, sourceName = '', sourceColor = new THREE.Color(0x85878c)) {
  const name = sourceName.toLowerCase();
  const luma = sourceColor.r * 0.2126 + sourceColor.g * 0.7152 + sourceColor.b * 0.0722;
  const isGold = name.includes('gold') || (sourceColor.r > 0.72 && sourceColor.g > 0.55 && sourceColor.b < 0.38);
  const isDark = luma < 0.22;

  if (isGold) {
    return {
      color: sourceColor.clone().lerp(new THREE.Color(0xffd982), 0.42),
      metalness: 0.86,
      roughness: 0.22,
      clearcoat: 0.12,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.35,
      bumpMap: surfaceTexture('fine'),
      bumpScale: 0.004,
    };
  }

  if (part.role === 'case' || part.role === 'puckCase' || name.includes('stahl') || name.includes('titan')) {
    return {
      color: sourceColor.clone().lerp(new THREE.Color(0xaaa79f), part.role === 'puckCase' ? 0.34 : 0.54),
      metalness: 0.88,
      roughness: 0.48,
      clearcoat: 0.04,
      clearcoatRoughness: 0.72,
      envMapIntensity: 1.58,
      bumpMap: surfaceTexture('satin'),
      bumpScale: part.role === 'puckCase' ? 0.007 : 0.011,
    };
  }

  if (part.role === 'pcb' || part.role === 'puckPcb') {
    if (isDark) {
      return {
        color: sourceColor.clone().lerp(new THREE.Color(0x080a0e), 0.32),
        metalness: 0.16,
        roughness: 0.5,
        clearcoat: 0.1,
        clearcoatRoughness: 0.38,
        envMapIntensity: 0.9,
        bumpMap: surfaceTexture('fine'),
        bumpScale: 0.003,
      };
    }

    const boardTarget = sourceColor.b > sourceColor.r
      ? new THREE.Color(0x0d6d91)
      : new THREE.Color(0x1d6959);
    return {
      color: sourceColor.clone().lerp(boardTarget, 0.35),
      metalness: 0.18,
      roughness: 0.36,
      clearcoat: 0.34,
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.0,
      bumpMap: surfaceTexture('pcb'),
      bumpScale: 0.004,
    };
  }

  return {
    color: sourceColor,
    metalness: isDark ? 0.18 : 0.35,
    roughness: isDark ? 0.52 : 0.43,
    clearcoat: 0.08,
    clearcoatRoughness: 0.42,
    envMapIntensity: 1.0,
    bumpMap: surfaceTexture('fine'),
    bumpScale: 0.003,
  };
}

function variantEmphasis(variant, puck) {
  if (!puck) return 'normal';
  if (variant === 'human') return puck === 'puck1' || puck === 'puck2' ? 'hot' : 'dim';
  if (variant === 'safety') return puck === 'puck3' ? 'hot' : 'dim';
  return 'normal';
}

function toSceneOffset(cadOffset) {
  if (!cadOffset) return new THREE.Vector3();
  return new THREE.Vector3(cadOffset.x, cadOffset.y, cadOffset.z)
    .multiplyScalar(MODEL_SCALE)
    .applyEuler(CAD_TO_SCENE);
}

function upgradeMaterial(source, part, variant) {
  const sourceColor = source?.color ? source.color.clone() : new THREE.Color(0x85878c);
  const profile = materialTone(part, source?.name || '', sourceColor);
  const emphasis = variantEmphasis(variant, part.puck);
  let opacity = source?.opacity ?? 1;
  let color = profile.color.clone();
  let emissive = new THREE.Color(0x000000);
  let emissiveIntensity = 0;

  if (emphasis === 'hot') {
    const amount = part.role === 'puckPcb' ? 0.28 : 0.1;
    color = sourceColor.clone().lerp(ACCENT_C, amount);
    emissive = ACCENT_C.clone();
    emissiveIntensity = part.role === 'puckPcb' ? 0.16 : 0.045;
  }

  if (emphasis === 'dim') opacity *= 0.42;
  if (variant === 'dev' && part.role === 'case') opacity *= 0.46;

  const map = source?.map || profile.map || null;
  if (map) map.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshPhysicalMaterial({
    name: source?.name,
    color,
    map,
    metalness: profile.metalness,
    roughness: profile.roughness,
    clearcoat: profile.clearcoat,
    clearcoatRoughness: profile.clearcoatRoughness,
    roughnessMap: profile.roughnessMap || null,
    emissive,
    emissiveIntensity,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  });
  mat.envMapIntensity = profile.envMapIntensity;
  mat.bumpMap = profile.bumpMap;
  mat.bumpScale = profile.bumpScale;
  if ('anisotropy' in mat && profile.anisotropy) {
    mat.anisotropy = profile.anisotropy;
    mat.anisotropyRotation = profile.anisotropyRotation || 0;
  }

  mat.userData.baseOpacity = opacity;
  mat.userData.fadeable = true;
  return mat;
}

function cloneWithFreshMaterials(template, part, variant) {
  const clone = template.clone(true);
  clone.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.geometry.computeVertexNormals();

    if (Array.isArray(child.material)) {
      child.material = child.material.map((mat) => upgradeMaterial(mat, part, variant));
    } else {
      child.material = upgradeMaterial(child.material, part, variant);
    }
  });
  return clone;
}

async function loadTemplate(part) {
  const key = `${part.obj}|${part.mtl}`;
  if (!templateCache.has(key)) {
    templateCache.set(key, (async () => {
      const materials = await new MTLLoader()
        .setPath(MODEL_BASE)
        .setResourcePath(MODEL_BASE)
        .loadAsync(part.mtl);

      materials.preload();

      const object = await new OBJLoader()
        .setPath(MODEL_BASE)
        .setMaterials(materials)
        .loadAsync(part.obj);

      object.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        child.geometry.computeVertexNormals();
      });

      return object;
    })());
  }

  return templateCache.get(key);
}

async function makePart(part, variant) {
  const template = await loadTemplate(part);
  const object = cloneWithFreshMaterials(template, part, variant);
  object.userData.partId = part.id;
  object.userData.layer = part.layer;
  object.userData.puck = part.puck || null;
  object.quaternion.setFromEuler(CAD_TO_SCENE);
  if (part.extraRotation) {
    object.quaternion.multiply(new THREE.Quaternion().setFromEuler(part.extraRotation));
  }
  object.scale.setScalar(MODEL_SCALE);
  object.position.copy(toSceneOffset(part.cadOffset));
  if (part.sceneOffset) object.position.add(part.sceneOffset);
  return object;
}

function makeLayerMap() {
  const layers = {
    top: new THREE.Group(),
    outPuck: new THREE.Group(),
    pcb: new THREE.Group(),
    skinPucks: new THREE.Group(),
    base: new THREE.Group(),
  };
  Object.entries(layers).forEach(([name, group]) => { group.name = name; });
  return layers;
}

function centerAssembly(assembly) {
  assembly.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(assembly);
  const center = box.getCenter(new THREE.Vector3());
  assembly.position.sub(center);
  assembly.userData.centerOffset = center;
}

/**
 * Builds the OpenPulse device from the real OBJ/MTL exports.
 * variant: 'full' | 'human' | 'safety' | 'dev'
 * options.initial: 'full' | 'shell'
 * Returns { group, layers, straps, dataPlane, mats }
 */
export async function buildDevice(variant = 'full', options = {}) {
  const root = new THREE.Group();
  const assembly = new THREE.Group();
  const layerMap = makeLayerMap();
  const initial = options.initial || 'full';
  const initialPartIds = initial === 'shell' ? SHELL_PART_IDS : null;
  const loadedPartIds = new Set();
  let fullLoadPromise = null;

  Object.values(layerMap).forEach((group) => assembly.add(group));
  root.add(assembly);

  async function addPart(part) {
    if (loadedPartIds.has(part.id)) return null;
    const object = await makePart(part, variant);
    layerMap[part.layer].add(object);
    loadedPartIds.add(part.id);
    return object;
  }

  const firstParts = initialPartIds
    ? PARTS.filter((part) => initialPartIds.has(part.id))
    : PARTS;

  await Promise.all(firstParts.map(addPart));

  centerAssembly(assembly);

  const layers = [
    { group: layerMap.top, restY: 0, exY: 1.55, id: 'top', opacity: 1 },
    { group: layerMap.outPuck, restY: 0, exY: 0.58, id: 'pucks', opacity: 1 },
    { group: layerMap.pcb, restY: 0, exY: -0.24, id: 'pcb', opacity: 1 },
    { group: layerMap.skinPucks, restY: 0, exY: -0.82, id: 'pucks', opacity: 1 },
    { group: layerMap.base, restY: 0, exY: -1.44, id: 'base', opacity: 1 },
  ];

  const dataMat = new THREE.MeshBasicMaterial({
    map: gridTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const dataPlane = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), dataMat);
  dataPlane.position.set(0, 0.2, -2.2);
  dataPlane.rotation.x = -0.18;
  root.add(dataPlane);

  return {
    group: root,
    layers,
    straps: [],
    dataPlane,
    mats: {},
    loadFull() {
      if (!fullLoadPromise) {
        fullLoadPromise = Promise.all(PARTS.map(addPart)).then(() => root);
      }
      return fullLoadPromise;
    },
    get isFullLoaded() {
      return loadedPartIds.size === PARTS.length;
    },
  };
}
