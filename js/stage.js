const canvas = document.getElementById('scene');
const stage = document.getElementById('stage');
const ctx = canvas?.getContext('2d', { alpha: true });

const FRAME_COUNT = 430;
const FIRST_FRAME = 1;
const LAST_FRAME = 430;
const IMAGE_START_NUMBER = 0;
const DESKTOP_FRAME_PATH = 'Photos/stage-frames-430-webp/openpulse_';
const MOBILE_FRAME_PATH = 'Photos/stage-frames-430-mobile/openpulse_';
const FRAME_EXT = 'webp';
const MAX_CACHE_DESKTOP = 220;
const MAX_CACHE_MOBILE = 88;
const PRELOAD_BATCH_SIZE = 18;
const CHAPTER_MAGNET_DELAY = 320;

const CHAPTERS = [
  {
    id: 'hero',
    nav: 'Start',
    eyebrow: 'Modular biosensor platform',
    title: 'Not another wearable.<br><span>A platform.</span>',
    body: 'Configurable sensor hardware, open data access and flexible integration, built around replaceable sensor pucks.',
    frames: [1, 52],
    desktopVh: 135,
    mobileVh: 112,
    layout: 'hero',
    visual: 'hero',
    actions: [
      { label: 'Explore hardware', href: 'hardware/', style: 'primary' },
      { label: 'Talk to us', href: 'pilot/', style: 'ghost' },
    ],
  },
  {
    id: 'problem',
    nav: 'Problem',
    eyebrow: 'Why it exists',
    title: 'Closed wearables do not fit every company.',
    body: 'Most devices are built around fixed sensors, locked data flows and one-size-fits-all software. OpenPulse starts from a different assumption: the use case should shape the wearable.',
    bullets: ['Fixed sensor stacks', 'Locked data flows', 'One-size-fits-all software'],
    frames: [52, 140],
    desktopVh: 140,
    mobileVh: 104,
    layout: 'left',
    visual: 'right',
  },
  {
    id: 'architecture',
    nav: 'Architecture',
    eyebrow: '01 - Platform architecture',
    title: 'One base. Three sensing positions.',
    body: 'The opened view shows the reusable wearable base, two body-facing directions and one outward-facing sensing position.',
    note: 'The architecture is the product.',
    frames: [140, 188],
    desktopVh: 102,
    mobileVh: 82,
    layout: 'left',
    visual: 'right',
  },
  {
    id: 'mainpcb',
    nav: 'Main PCB',
    eyebrow: '02 - Main PCB',
    title: 'The reusable core.',
    body: 'Compute, wireless, power management and the interface between sensor modules and software live in the main board.',
    note: 'The base stays. The configuration changes.',
    frames: [192, 258],
    desktopVh: 128,
    mobileVh: 98,
    layout: 'left',
    visual: 'right',
  },
  {
    id: 'pucks',
    nav: 'Pucks',
    eyebrow: '03 - Sensor pucks',
    title: 'Configure around the use case.',
    body: 'Pucks make OpenPulse configurable. Partners define what needs to be measured; the hardware can evolve around that use case.',
    note: 'The puck is the business model.',
    frames: [260, 316],
    desktopVh: 118,
    mobileVh: 92,
    layout: 'left',
    visual: 'right',
  },
  {
    id: 'case',
    nav: 'Case',
    eyebrow: '04 - Titanium case',
    title: 'A precise structural shell.',
    body: 'The case gives the platform its physical language: a metallic body around the reusable core and modular puck system.',
    note: 'Premium outside. Configurable inside.',
    frames: [324, 378],
    desktopVh: 118,
    mobileVh: 92,
    layout: 'left',
    visual: 'right',
  },
  {
    id: 'integration',
    nav: 'Integration',
    eyebrow: '05 - Integration layer',
    title: 'Hardware becomes a data path.',
    body: 'The goal is not only a wearable. It is configurable sensing, open data access and integration into partner apps, dashboards and workflows.',
    frames: [378, 400],
    desktopVh: 92,
    mobileVh: 74,
    layout: 'left',
    visual: 'right',
  },
  {
    id: 'final',
    nav: 'Pilot',
    eyebrow: 'From modules to solutions',
    title: 'Configure biosensing around your product.',
    body: 'OpenPulse lets partners combine wearable hardware, sensor modules and software integration into a system that fits their use case.',
    frames: [400, 430],
    desktopVh: 132,
    mobileVh: 110,
    layout: 'right',
    visual: 'left',
    actions: [
      { label: 'Start a pilot conversation', href: 'pilot/', style: 'primary' },
      { label: 'See configurations', href: '#configs', style: 'ghost' },
    ],
  },
];

const CHAPTER_KEY_FRAMES = CHAPTERS.flatMap((chapter) => chapter.frames);
const KEEP_FRAMES = new Set([FIRST_FRAME, LAST_FRAME, ...CHAPTER_KEY_FRAMES, 40, 228, 290, 350]);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const framePath = () => (isMobileStage() ? MOBILE_FRAME_PATH : DESKTOP_FRAME_PATH);
const frameName = (frame) => `${framePath()}${String(frame + IMAGE_START_NUMBER).padStart(4, '0')}.${FRAME_EXT}`;

const images = new Map();
const requested = new Set();
const loadedFramesSeen = new Set();
const caption = document.querySelector('[data-stage-caption]');
const rail = document.querySelector('[data-stage-rail]');
const captionEls = {
  eyebrow: document.querySelector('[data-chapter-eyebrow]'),
  title: document.querySelector('[data-chapter-title]'),
  body: document.querySelector('[data-chapter-body]'),
  bullets: document.querySelector('[data-chapter-bullets]'),
  note: document.querySelector('[data-chapter-note]'),
  actions: document.querySelector('[data-chapter-actions]'),
};

let timeline = [];
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
let stageTop = 0;
let stageScrollTotal = 1;
let frameTickRequested = false;
let activeChapterIndex = 0;
let activeChapter = CHAPTERS[0];
let activeChapterProgress = 0;
let renderedChapterId = '';
let chapterMagnetTimer = 0;
let isChapterMagnetScrolling = false;

function isMobileStage() {
  return window.innerWidth < 820 || window.matchMedia?.('(pointer: coarse)').matches;
}

function maxCacheSize() {
  return isMobileStage() ? MAX_CACHE_MOBILE : MAX_CACHE_DESKTOP;
}

function chapterDuration(chapter) {
  const vh = isMobileStage() ? chapter.mobileVh : chapter.desktopVh;
  return Math.max(1, Math.round(window.innerHeight * (vh / 100)));
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
    ? [0, 1, -1, 2, -2, 4, -4, 8, -8, 12, -12]
    : [0, 1, -1, 2, -2, 4, -4, 8, -8, 14, -14, 22, -22];
  offsets.forEach((offset, index) => {
    requestFrame(frame + offset, index < 5 ? 'eager' : 'lazy');
  });
}

function preloadIdleFrames() {
  const firstRun = isMobileStage() ? 42 : 64;
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

function buildTimeline() {
  let offset = 0;
  timeline = CHAPTERS.map((chapter, index) => {
    const start = offset;
    const duration = chapterDuration(chapter);
    offset += duration;
    return {
      chapter,
      index,
      start,
      end: offset,
      duration,
    };
  });
  stageScrollTotal = Math.max(1, offset);
  stage.style.height = `calc(100vh + ${stageScrollTotal}px)`;
}

function chapterAtScroll(scrolled) {
  const entry = timeline.find((item) => scrolled >= item.start && scrolled < item.end) || timeline[timeline.length - 1];
  const localProgress = clamp((scrolled - entry.start) / entry.duration, 0, 1);
  return { entry, localProgress };
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
  buildTimeline();
}

function visualShift(width) {
  if (isMobileStage()) return 0;
  if (activeChapter.visual === 'right') return width * 0.22;
  if (activeChapter.visual === 'left') return width * -0.22;
  return 0;
}

function drawImageAtFrame(img, frame) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const mobile = width < 820;
  if (mobile) {
    const heroFrame = activeChapter.id === 'hero';
    const bottomReserved = heroFrame
      ? Math.min(120, Math.max(84, height * 0.12))
      : Math.min(318, Math.max(246, height * 0.37));
    const topReserved = heroFrame
      ? Math.min(360, Math.max(300, height * 0.42))
      : Math.min(96, Math.max(72, height * 0.1));
    const availableHeight = Math.max(260, height - topReserved - bottomReserved);
    const maxWidth = width * (heroFrame ? 0.92 : 0.88);
    const scale = Math.min(maxWidth / img.naturalWidth, availableHeight / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    const x = (width - drawWidth) / 2;
    const y = topReserved + (availableHeight - drawHeight) * (heroFrame ? 0.48 : 0.42);
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    return;
  }

  const heroFrame = activeChapter.id === 'hero';
  const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight) * (heroFrame ? 1 : 0.86);
  const drawWidth = img.naturalWidth * scale;
  const drawHeight = img.naturalHeight * scale;
  const x = (width - drawWidth) / 2 + visualShift(width);
  const introLowering = activeChapter.id === 'hero' ? 36 * (1 - smoothstep(1, 52, frame)) : 0;
  const heroLowering = heroFrame ? height * 0.23 : 0;
  const storyLift = heroFrame ? 0 : -height * 0.02;
  const y = (height - drawHeight) / 2 + 28 + introLowering + heroLowering + storyLift;
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
    const drawKey = `${currentFrameExact.toFixed(3)}:${currentFrame}:${activeChapter.id}`;
    if (!force && drawKey === lastDrawnFrameKey) return;
    if (!drawSequenceFrame()) return;
    lastDrawnFrameKey = drawKey;
    updateStageUi();
    stage.dataset.drawnFrame = lastDrawnFrameKey;
    canvas.style.opacity = (1 - smoothstep(0.985, 1, progress) * 0.82).toFixed(3);
    window.__openPulseStage = {
      progress,
      targetFrame,
      targetFrameExact,
      frame: currentFrame,
      frameExact: currentFrameExact,
      chapter: activeChapter.id,
      chapterProgress: activeChapterProgress,
      drawnFrame: lastDrawnFrameKey,
      loadedCount,
      framesReady,
    };
  });
}

function onScroll() {
  const scrolled = clamp(window.scrollY - stageTop, 0, stageScrollTotal);
  const { entry, localProgress } = chapterAtScroll(scrolled);
  activeChapterIndex = entry.index;
  activeChapter = entry.chapter;
  activeChapterProgress = localProgress;
  targetProgress = scrolled / stageScrollTotal;
  progress = targetProgress;
  targetFrameExact = clamp(lerp(activeChapter.frames[0], activeChapter.frames[1], localProgress), FIRST_FRAME, LAST_FRAME);
  targetFrame = clamp(Math.floor(targetFrameExact), FIRST_FRAME, LAST_FRAME);
  updateStageUi();
  requestStageTick();
  scheduleChapterMagnet(scrolled);
}

function scheduleChapterMagnet(scrolled) {
  if (isChapterMagnetScrolling) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  if (window.scrollY < stageTop || window.scrollY > stageTop + stageScrollTotal) return;
  window.clearTimeout(chapterMagnetTimer);
  chapterMagnetTimer = window.setTimeout(() => {
    const currentScrolled = clamp(window.scrollY - stageTop, 0, stageScrollTotal);
    const { entry } = chapterAtScroll(currentScrolled);
    if (entry.index === 0) return;
    const target = entry.start + (entry.duration * 0.5);
    const threshold = Math.min(
      entry.duration * 0.58,
      window.innerHeight * (isMobileStage() ? 0.72 : 0.82),
    );
    const distance = Math.abs(currentScrolled - target);

    if (distance > threshold || distance < 10) return;
    isChapterMagnetScrolling = true;
    window.scrollTo({
      top: stageTop + target,
      behavior: 'smooth',
    });
    window.setTimeout(() => {
      isChapterMagnetScrolling = false;
    }, 760);
  }, isMobileStage() ? 260 : CHAPTER_MAGNET_DELAY);
}

function renderCaption(chapter) {
  if (!caption || renderedChapterId === chapter.id) return;
  renderedChapterId = chapter.id;
  caption.className = `stage-caption is-${chapter.layout}`;
  caption.dataset.chapter = chapter.id;
  captionEls.eyebrow.textContent = chapter.eyebrow;
  captionEls.title.innerHTML = chapter.title;
  captionEls.body.textContent = chapter.body;

  captionEls.bullets.innerHTML = '';
  captionEls.bullets.hidden = !chapter.bullets?.length;
  chapter.bullets?.forEach((item) => {
    const row = document.createElement('span');
    row.textContent = item;
    captionEls.bullets.append(row);
  });

  captionEls.note.textContent = chapter.note || '';
  captionEls.note.hidden = !chapter.note;
  captionEls.actions.innerHTML = '';
  captionEls.actions.hidden = !chapter.actions?.length;
  chapter.actions?.forEach((action) => {
    const link = document.createElement('a');
    link.className = `btn btn-${action.style}`;
    link.href = action.href;
    link.textContent = action.label;
    captionEls.actions.append(link);
  });
}

function buildRail() {
  if (!rail) return;
  rail.innerHTML = `
    <div class="stage-rail-label">Scroll</div>
    <div class="stage-rail-track" aria-hidden="true"><i></i></div>
    <div class="stage-rail-steps">
      ${CHAPTERS.map((chapter, index) => `
        <button type="button" data-stage-jump="${index}">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <strong>${chapter.nav}</strong>
        </button>
      `).join('')}
    </div>
  `;
  rail.addEventListener('click', (event) => {
    const button = event.target.closest('[data-stage-jump]');
    if (!button) return;
    const index = Number(button.dataset.stageJump);
    const entry = timeline[index];
    if (!entry) return;
    window.scrollTo({
      top: stageTop + entry.start + Math.min(entry.duration * 0.12, 120),
      behavior: 'smooth',
    });
  });
}

function updateStageUi() {
  renderCaption(activeChapter);
  stage.classList.toggle('is-hero-front', activeChapter.id === 'hero');
  stage.dataset.chapter = activeChapter.id;
  stage.dataset.chapterProgress = activeChapterProgress.toFixed(3);

  if (caption) {
    const fadeIn = activeChapterIndex === 0 ? 1 : smoothstep(0, 0.025, activeChapterProgress);
    const fadeOut = activeChapterIndex === CHAPTERS.length - 1 ? 1 : 1 - smoothstep(0.975, 1, activeChapterProgress);
    const visibility = clamp(Math.min(fadeIn, fadeOut), 0, 1);
    caption.style.opacity = visibility.toFixed(3);
    caption.style.setProperty('--caption-shift', `${(1 - visibility) * 10}px`);
  }

  if (!rail) return;
  rail.style.setProperty('--stage-progress', targetProgress.toFixed(4));
  rail.querySelectorAll('[data-stage-jump]').forEach((button, index) => {
    button.classList.toggle('is-active', index === activeChapterIndex);
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
  window.__openPulseStage = {
    progress,
    targetFrame,
    targetFrameExact,
    frame: currentFrame,
    frameExact: currentFrameExact,
    chapter: activeChapter.id,
    chapterProgress: activeChapterProgress,
    drawnFrame: lastDrawnFrameKey,
    loadedCount,
    framesReady,
  };
}

function nearestLoadedFrame(frame) {
  const radius = isMobileStage() ? 12 : 20;
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
  buildRail();
  buildTimeline();
  requestFrame(FIRST_FRAME, 'eager');
  KEEP_FRAMES.forEach((id) => requestFrame(id, 'eager'));
  preloadIdleFrames();
  window.__openPulseStage = {
    progress: 0,
    targetFrame: FIRST_FRAME,
    frame: FIRST_FRAME,
    chapter: CHAPTERS[0].id,
    loadedCount: 0,
    framesReady: false,
  };
  updateStageUi();
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  requestStageTick();
}
