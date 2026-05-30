const canvas = document.getElementById('scene');
const stage = document.getElementById('stage');
const ctx = canvas?.getContext('2d', { alpha: true });

const FRAME_COUNT = 215;
const FIRST_FRAME = 1;
const LAST_FRAME = 215;
const IMAGE_START_NUMBER = 0;
const FRAME_PATH = 'Photos/stage-frames-webp/openpulse_';
const FRAME_EXT = 'webp';
const KEY_STEPS = [
  { start: 76, end: 100 },
  { start: 96, end: 129 },
  { start: 130, end: 158 },
  { start: 162, end: 189 },
  { start: 189, end: 215 },
];
const KEEP_FRAMES = new Set([1, 20, 70, 96, 114, 130, 145, 158, 162, 175, 189, 200, 215]);
const MAX_CACHE = FRAME_COUNT;
const FRAME_SCROLL_PX = 104;
const PRELOAD_BATCH_SIZE = 18;
const SNAP_FRAMES = [1, 24, 72, 84, 96, 130, 162, 193, 211];
const SNAP_DELAY_MS = 190;
const SNAP_WINDOW_FRAMES = 7;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const band = (p, a, b, c, d) => smoothstep(a, b, p) * (1 - smoothstep(c, d, p));
const frameName = (frame) => `${FRAME_PATH}${String(frame + IMAGE_START_NUMBER).padStart(4, '0')}.${FRAME_EXT}`;

const images = new Map();
const requested = new Set();
let targetProgress = 0;
let targetFrame = FIRST_FRAME;
let progress = 0;
let currentFrame = FIRST_FRAME;
let lastDrawnFrame = -1;
let drawRequested = false;
let lastWidth = 0;
let lastHeight = 0;
let framesReady = false;
let loadedCount = 0;
let snapTimer = 0;
let isSnapScrolling = false;

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
    loadedCount += 1;
    evictFarFrames();
    if (Math.abs(id - currentFrame) <= 2 || id === FIRST_FRAME) scheduleDraw(true);
  };
  img.onerror = () => {
    requested.delete(id);
    console.error(`Could not load OpenPulse animation frame ${id}`);
  };
}

function evictFarFrames() {
  if (images.size <= MAX_CACHE) return;
  const candidates = [...images.keys()]
    .filter((id) => id !== currentFrame && !KEEP_FRAMES.has(id))
    .sort((a, b) => Math.abs(b - currentFrame) - Math.abs(a - currentFrame));

  while (images.size > MAX_CACHE && candidates.length) {
    images.delete(candidates.shift());
  }
}

function preloadIdleFrames() {
  for (let id = FIRST_FRAME; id <= Math.min(LAST_FRAME, 28); id += 1) {
    requestFrame(id, 'eager');
  }
  KEEP_FRAMES.forEach((id) => requestFrame(id, 'eager'));

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
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (width === lastWidth && height === lastHeight) return;
  lastWidth = width;
  lastHeight = height;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scheduleDraw(true);
}

function drawImage(img) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  ctx.clearRect(0, 0, width, height);

  const mobile = width < 820;
  const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight) * (mobile ? 1.18 : 1.04);
  const drawWidth = img.naturalWidth * scale;
  const drawHeight = img.naturalHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2 + (mobile ? 42 : 28);
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

function scheduleDraw(force = false) {
  if (!ctx) return;
  if (!force && drawRequested) return;
  drawRequested = true;
  requestAnimationFrame(() => {
    drawRequested = false;
    const img = images.get(currentFrame);
    if (!img) return;
    if (!force && currentFrame === lastDrawnFrame) return;
    lastDrawnFrame = currentFrame;
    drawImage(img);
    updateOverlays(currentFrame);
    canvas.style.opacity = (1 - smoothstep(0.992, 1, progress) * 0.9).toFixed(3);
  });
}

function nearestSnapFrame(frame) {
  return SNAP_FRAMES.reduce((nearest, snapFrame) => (
    Math.abs(snapFrame - frame) < Math.abs(nearest - frame) ? snapFrame : nearest
  ), SNAP_FRAMES[0]);
}

function scheduleStageSnap() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  if (isSnapScrolling) return;
  window.clearTimeout(snapTimer);
  snapTimer = window.setTimeout(() => {
    const rect = stage.getBoundingClientRect();
    const stageActive = rect.top < window.innerHeight * 0.55 && rect.bottom > window.innerHeight * 0.45;
    if (!stageActive) return;

    const snapFrame = nearestSnapFrame(targetFrame);
    if (Math.abs(snapFrame - targetFrame) > SNAP_WINDOW_FRAMES) return;

    const stageTop = window.scrollY + rect.top;
    const snapTop = stageTop + (snapFrame - FIRST_FRAME) * FRAME_SCROLL_PX;
    isSnapScrolling = true;
    window.scrollTo({ top: snapTop, behavior: 'smooth' });
    window.setTimeout(() => {
      isSnapScrolling = false;
      onScroll();
    }, 460);
  }, SNAP_DELAY_MS);
}

function onScroll(shouldSnap = false) {
  const rect = stage.getBoundingClientRect();
  const total = stage.offsetHeight - window.innerHeight;
  const scrolled = clamp(-rect.top, 0, total);
  targetProgress = total > 0 ? scrolled / total : 0;
  targetFrame = clamp(FIRST_FRAME + Math.floor(scrolled / FRAME_SCROLL_PX), FIRST_FRAME, LAST_FRAME);
  progress = targetProgress;
  if (shouldSnap) scheduleStageSnap();
}

const overlays = [...document.querySelectorAll('[data-frame-range]')].map((el) => {
  const [a, b, c, d] = el.dataset.frameRange.split(',').map(Number);
  return { el, a, b, c, d };
});

function updateOverlays(frame) {
  overlays.forEach((overlay) => {
    const visibility = band(frame, overlay.a, overlay.b, overlay.c, overlay.d);
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

  if (nextFrame !== currentFrame) {
    const direction = Math.sign(nextFrame - currentFrame);
    const candidate = currentFrame + direction;
    requestFrame(candidate, 'eager');
    requestFrame(nextFrame, 'eager');
    if (images.has(nextFrame)) {
      currentFrame = nextFrame;
      scheduleDraw();
    } else if (images.has(candidate)) {
      currentFrame = candidate;
      scheduleDraw();
    }
  } else if (lastDrawnFrame !== currentFrame && images.has(currentFrame)) {
    scheduleDraw();
  }
  stage.dataset.targetFrame = String(targetFrame);
  stage.dataset.currentFrame = String(currentFrame);
  stage.dataset.drawnFrame = String(lastDrawnFrame);
  stage.dataset.loadedFrames = String(loadedCount);
  stage.dataset.framesReady = String(framesReady);
  window.__openPulseStage = { progress, targetFrame, frame: currentFrame, drawnFrame: lastDrawnFrame, loadedCount, framesReady };
}

function loop() {
  onScroll();
  updateFrame();
  requestAnimationFrame(loop);
}

if (canvas && stage && ctx) {
  canvas.classList.add('sequence-stage');
  stage.style.height = `calc(100vh + ${(FRAME_COUNT - 1) * FRAME_SCROLL_PX}px)`;
  requestFrame(FIRST_FRAME, 'eager');
  [2, 3, 4, 5, 10, 20, 70, 96, 114, 130, 145, 158, 162, 175, 189, 200, 215].forEach((id) => requestFrame(id, 'eager'));
  preloadIdleFrames();
  window.__openPulseStage = { progress: 0, targetFrame: FIRST_FRAME, frame: FIRST_FRAME, loadedCount: 0, framesReady: false };
  updateOverlays(FIRST_FRAME);
  resize();
  onScroll();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => onScroll(true), { passive: true });
  requestAnimationFrame(loop);
}
