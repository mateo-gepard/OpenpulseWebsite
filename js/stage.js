const canvas = document.getElementById('scene');
const stage = document.getElementById('stage');
const ctx = canvas?.getContext('2d', { alpha: true });

const FRAME_COUNT = 215;
const FIRST_FRAME = 1;
const LAST_FRAME = 215;
const IMAGE_START_NUMBER = 0;
const DESKTOP_FRAME_PATH = 'Photos/stage-frames-webp/openpulse_';
const MOBILE_FRAME_PATH = 'Photos/stage-frames-mobile/openpulse_';
const FRAME_EXT = 'webp';
const KEY_STEPS = [
  { start: 76, end: 100 },
  { start: 96, end: 129 },
  { start: 130, end: 158 },
  { start: 162, end: 189 },
  { start: 189, end: 215 },
];
const KEEP_FRAMES = new Set([1, 20, 70, 96, 114, 130, 145, 158, 162, 175, 189, 200, 215]);
const MAX_CACHE_DESKTOP = FRAME_COUNT;
const MAX_CACHE_MOBILE = 64;
const DESKTOP_FRAME_SCROLL_PX = 64;
const MOBILE_FRAME_SCROLL_PX = 30;
const PRELOAD_BATCH_SIZE = 18;
const ENABLE_STAGE_SNAP = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const band = (p, a, b, c, d) => smoothstep(a, b, p) * (1 - smoothstep(c, d, p));
const framePath = () => (isMobileStage() ? MOBILE_FRAME_PATH : DESKTOP_FRAME_PATH);
const frameName = (frame) => `${framePath()}${String(frame + IMAGE_START_NUMBER).padStart(4, '0')}.${FRAME_EXT}`;

const images = new Map();
const requested = new Set();
const loadedFramesSeen = new Set();
let targetProgress = 0;
let targetFrame = FIRST_FRAME;
let targetFrameExact = FIRST_FRAME;
let progress = 0;
let currentFrame = FIRST_FRAME;
let currentFrameExact = FIRST_FRAME;
let lastDrawnFrameKey = '';
let drawRequested = false;
let lastWidth = 0;
let lastHeight = 0;
let framesReady = false;
let loadedCount = 0;
let snapTimer = 0;
let isSnapScrolling = false;
let stageTop = 0;
let stageScrollTotal = 1;
let frameTickRequested = false;

function isMobileStage() {
  return window.innerWidth < 820 || window.matchMedia?.('(pointer: coarse)').matches;
}

function maxCacheSize() {
  return isMobileStage() ? MAX_CACHE_MOBILE : MAX_CACHE_DESKTOP;
}

function frameScrollPx() {
  return isMobileStage() ? MOBILE_FRAME_SCROLL_PX : DESKTOP_FRAME_SCROLL_PX;
}

function requestFrame(frame, priority = 'lazy') {
  const id = clamp(Math.round(frame), FIRST_FRAME, LAST_FRAME);
  if (images.has(id) || requested.has(id)) return;
  requested.add(id);

  const img = new Image();
  img.decoding = 'async';
  img.loading = 'eager';
  if ('fetchPriority' in img) img.fetchPriority = priority === 'eager' ? 'high' : 'low';
  img.src = frameName(id);
  img.onload = () => {
    images.set(id, img);
    requested.delete(id);
    loadedFramesSeen.add(id);
    loadedCount = loadedFramesSeen.size;
    evictFarFrames();
    if (id === currentFrame || id === Math.ceil(currentFrameExact) || id === FIRST_FRAME) scheduleDraw(true);
    if (Math.abs(id - targetFrame) <= 2) requestStageTick();
  };
  img.onerror = () => {
    requested.delete(id);
    console.error(`Could not load OpenPulse animation frame ${id}`);
  };
}

function evictFarFrames() {
  const maxCache = maxCacheSize();
  if (images.size <= maxCache) return;
  const candidates = [...images.keys()]
    .filter((id) => id !== currentFrame && !KEEP_FRAMES.has(id))
    .sort((a, b) => Math.abs(b - currentFrame) - Math.abs(a - currentFrame));

  while (images.size > maxCache && candidates.length) {
    images.delete(candidates.shift());
  }
}

function preloadWindow(frame) {
  const offsets = isMobileStage()
    ? [0, 1, -1, 2, -2, 4, -4, 7, -7]
    : [0, 1, -1, 2, -2, 4, -4, 8, -8, 14, -14];
  offsets.forEach((offset, index) => {
    requestFrame(frame + offset, index < 3 ? 'eager' : 'lazy');
  });
}

function preloadIdleFrames() {
  const firstRun = isMobileStage() ? 18 : 28;
  for (let id = FIRST_FRAME; id <= Math.min(LAST_FRAME, firstRun); id += 1) {
    requestFrame(id, 'eager');
  }
  KEEP_FRAMES.forEach((id) => requestFrame(id, 'eager'));
  if (isMobileStage()) return;

  let nextFrame = FIRST_FRAME;
  const schedule = window.requestIdleCallback
    ? (task) => window.requestIdleCallback(task, { timeout: 1200 })
    : (task) => window.setTimeout(task, 80);
  const pump = () => {
    let loadedThisBatch = 0;
    while (nextFrame <= LAST_FRAME && loadedThisBatch < PRELOAD_BATCH_SIZE) {
      requestFrame(nextFrame, 'lazy');
      nextFrame += 1;
      loadedThisBatch += 1;
    }
    if (nextFrame <= LAST_FRAME) schedule(pump);
  };
  schedule(pump);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, isMobileStage() ? 1.25 : 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (width !== lastWidth || height !== lastHeight) {
    lastWidth = width;
    lastHeight = height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  measureStage();
  onScroll();
  scheduleDraw(true);
}

function measureStage() {
  stageTop = stage.offsetTop;
  stageScrollTotal = Math.max(1, stage.offsetHeight - window.innerHeight);
}

function drawImageAtFrame(img, frame) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const mobile = width < 820;
  if (mobile) {
    const storyFrame = frame > 26;
    const topPopupFrame = frame >= 20 && frame < 84;
    const topReserved = topPopupFrame ? Math.min(305, Math.max(250, height * 0.31)) : (storyFrame ? 96 : 118);
    const bottomReserved = topPopupFrame
      ? Math.min(160, Math.max(108, height * 0.14))
      : (storyFrame
        ? Math.min(320, Math.max(236, height * 0.34))
        : Math.min(310, Math.max(230, height * 0.29)));
    const availableHeight = Math.max(260, height - topReserved - bottomReserved);
    const maxWidth = width * 0.9;
    const scale = Math.min(maxWidth / img.naturalWidth, availableHeight / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    const x = (width - drawWidth) / 2;
    const y = topReserved + (availableHeight - drawHeight) * (topPopupFrame ? 0.12 : (storyFrame ? 0.34 : 0.44));
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    return;
  }

  const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight) * 1.04;
  const drawWidth = img.naturalWidth * scale;
  const drawHeight = img.naturalHeight * scale;
  const x = (width - drawWidth) / 2;
  const introLowering = 36 * (1 - smoothstep(18, 58, frame));
  const y = (height - drawHeight) / 2 + 28 + introLowering;
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

function drawSequenceFrame() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const baseFrame = clamp(Math.floor(currentFrameExact), FIRST_FRAME, LAST_FRAME);
  const nextFrame = clamp(baseFrame + 1, FIRST_FRAME, LAST_FRAME);
  const baseImg = images.get(baseFrame) || images.get(currentFrame);
  const nextImg = images.get(nextFrame);
  const alpha = clamp(currentFrameExact - baseFrame, 0, 1);

  if (!baseImg) return false;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = 1;
  drawImageAtFrame(baseImg, baseFrame);

  if (nextImg && nextFrame !== baseFrame && alpha > 0.001) {
    ctx.globalAlpha = alpha;
    drawImageAtFrame(nextImg, nextFrame);
  }

  ctx.restore();
  return true;
}

function scheduleDraw(force = false) {
  if (!ctx) return;
  if (!force && drawRequested) return;
  drawRequested = true;
  requestAnimationFrame(() => {
    drawRequested = false;
    const drawKey = `${currentFrameExact.toFixed(3)}:${currentFrame}`;
    if (!force && drawKey === lastDrawnFrameKey) return;
    if (!drawSequenceFrame()) return;
    lastDrawnFrameKey = drawKey;
    updateOverlays(currentFrameExact);
    stage.dataset.drawnFrame = lastDrawnFrameKey;
    canvas.style.opacity = (1 - smoothstep(0.992, 1, progress) * 0.9).toFixed(3);
    window.__openPulseStage = { progress, targetFrame, targetFrameExact, frame: currentFrame, frameExact: currentFrameExact, drawnFrame: lastDrawnFrameKey, loadedCount, framesReady };
  });
}

function scheduleStageSnap() {
  if (!ENABLE_STAGE_SNAP) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  if (isMobileStage()) return;
  if (isSnapScrolling) return;
  window.clearTimeout(snapTimer);
}

function onScroll(shouldSnap = false) {
  const scrolled = clamp(window.scrollY - stageTop, 0, stageScrollTotal);
  targetProgress = scrolled / stageScrollTotal;
  targetFrameExact = clamp(FIRST_FRAME + (scrolled / frameScrollPx()), FIRST_FRAME, LAST_FRAME);
  targetFrame = clamp(Math.floor(targetFrameExact), FIRST_FRAME, LAST_FRAME);
  progress = targetProgress;
  if (shouldSnap) scheduleStageSnap();
  requestStageTick();
}

const overlays = [...document.querySelectorAll('[data-frame-range]')].map((el) => {
  const [a, b, c, d] = el.dataset.frameRange.split(',').map(Number);
  return { el, a, b, c, d };
});
const heroOverlayClasses = ['ov-hero-top', 'ov-hero-bottom'];

function updateOverlays(frame) {
  const mobile = isMobileStage();
  stage.classList.toggle('is-hero-front', !mobile && frame <= 28);
  const visibilities = overlays.map((overlay) => ({
    overlay,
    visibility: band(frame, overlay.a, overlay.b, overlay.c, overlay.d),
  }));

  if (mobile) {
    const story = visibilities.filter(({ overlay }) => (
      !heroOverlayClasses.some((className) => overlay.el.classList.contains(className))
    ));
    const activeStory = story.reduce((active, item) => (
      item.visibility > active.visibility ? item : active
    ), { visibility: 0, overlay: null });
    story.forEach((item) => {
      if (item !== activeStory) item.visibility = 0;
    });
  }

  visibilities.forEach(({ overlay, visibility }) => {
    overlay.el.style.opacity = visibility.toFixed(3);
    overlay.el.style.pointerEvents = visibility > 0.5 ? 'auto' : 'none';
  });

  const indicator = document.getElementById('anatomy-progress');
  if (!indicator) return;
  let activeStep = -1;
  KEY_STEPS.forEach((step, index) => {
    if (frame >= step.start && frame <= step.end) activeStep = index;
  });
  indicator.style.opacity = activeStep >= 0 ? '1' : '0';
  indicator.querySelectorAll('.dot').forEach((dot, index) => {
    dot.classList.toggle('on', index === activeStep);
  });
}

function updateFrame() {
  framesReady = loadedCount >= FRAME_COUNT;
  const nextFrame = clamp(targetFrame, FIRST_FRAME, LAST_FRAME);
  const nextFrameCeil = clamp(Math.ceil(targetFrameExact), FIRST_FRAME, LAST_FRAME);
  preloadWindow(targetFrameExact);
  requestFrame(nextFrame, 'eager');
  requestFrame(nextFrameCeil, 'eager');

  const baseAvailable = images.has(nextFrame);
  const ceilAvailable = images.has(nextFrameCeil);
  const frameToDraw = baseAvailable ? nextFrame : nearestLoadedFrame(nextFrame);

  if (frameToDraw) {
    currentFrame = frameToDraw;
    currentFrameExact = baseAvailable
      ? (ceilAvailable ? targetFrameExact : nextFrame)
      : frameToDraw;
    scheduleDraw();
  }
  stage.dataset.targetFrame = String(targetFrame);
  stage.dataset.targetFrameExact = targetFrameExact.toFixed(3);
  stage.dataset.currentFrame = String(currentFrame);
  stage.dataset.currentFrameExact = currentFrameExact.toFixed(3);
  stage.dataset.drawnFrame = lastDrawnFrameKey;
  stage.dataset.loadedFrames = String(loadedCount);
  stage.dataset.framesReady = String(framesReady);
  window.__openPulseStage = { progress, targetFrame, targetFrameExact, frame: currentFrame, frameExact: currentFrameExact, drawnFrame: lastDrawnFrameKey, loadedCount, framesReady };
}

function nearestLoadedFrame(frame) {
  const radius = isMobileStage() ? 8 : 14;
  for (let offset = 1; offset <= radius; offset += 1) {
    const before = frame - offset;
    const after = frame + offset;
    if (images.has(before)) return before;
    if (images.has(after)) return after;
  }
  return null;
}

function requestStageTick() {
  if (frameTickRequested) return;
  frameTickRequested = true;
  requestAnimationFrame(() => {
    frameTickRequested = false;
    updateFrame();
  });
}

if (canvas && stage && ctx) {
  canvas.classList.add('sequence-stage');
  stage.style.height = `calc(100vh + ${(FRAME_COUNT - 1) * frameScrollPx()}px)`;
  requestFrame(FIRST_FRAME, 'eager');
  [2, 3, 4, 5, 10, 20, 70, 96, 114, 130, 145, 158, 162, 175, 189, 200, 215].forEach((id) => requestFrame(id, 'eager'));
  preloadIdleFrames();
  window.__openPulseStage = { progress: 0, targetFrame: FIRST_FRAME, frame: FIRST_FRAME, loadedCount: 0, framesReady: false };
  updateOverlays(FIRST_FRAME);
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => onScroll(true), { passive: true });
  requestStageTick();
}
