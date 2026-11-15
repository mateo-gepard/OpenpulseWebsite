// Hero-Gerät als vorgerenderte Filme (14.11.2026, ersetzt das Echtzeit-3D aus js/viewer.js; viewer.js bleibt als Referenz).
// Ruhe: Standbild assets/video/rest_<i>.jpg. Bei jedem Wortwechsel spielt assets/video/swap_<i>_<j>.mp4 (24 fps, 99 Bilder,
// gerendert mit render/hero_render.py aus derselben timeline() wie stepA() im Viewer: Filmzeit = Viewer-Sekunden 1:1).
// Der fertige Film bleibt auf seinem letzten Bild stehen (= Bild 0 des nächsten Films), darunter liegt rest_<j>.jpg.
// Logo-Bögen und Steckplatz-Quadrate in der Pille schalten zu denselben Zeitpunkten wie im Viewer (Zeitplan A).
(() => {
  // ---------------------------------------------------------------- Belegung und Farben (unverändert aus js/viewer.js)
  const SETS = [
    { A: 'mod-pulse',  B: 'mod-ekg',    E: 'mod-air' },   // research
    { A: 'mod-thermo', B: 'mod-pulse',  E: 'mod-air' },   // factory safety
    { A: 'mod-eda',    B: 'mod-pulse',  E: null },        // trading desks
    { A: 'mod-pulse',  B: 'mod-ekg',    E: null },        // sports science
    { A: 'mod-pulse',  B: 'mod-thermo', E: 'mod-air' },   // clinical studies
    { A: 'mod-pulse',  B: null,         E: 'mod-air' },   // outdoor apps
  ];
  const SENSOR = {
    'mod-pulse':  { name: 'Pulse',      color: '#cf3826' },
    'mod-thermo': { name: 'Thermo+',    color: '#b8892f' },
    'mod-air':    { name: 'Air',        color: '#3c6ea6' },
    'mod-ekg':    { name: 'EKG',        color: '#101f3c' },
    'mod-eda':    { name: 'EDA / BioZ', color: '#b08d83' },
  };
  const EMPTY = { name: { en: 'free', de: 'frei' }, color: '#b9b2a8' };
  const SKIN = ['A', 'B'], PORTS = ['A', 'B', 'E'], N = SETS.length;
  // Zeitplan A (js/viewer.js, render/hero_render.py TL), Sekunden
  const A = { turn: 1.3, lead: 0.18, out: 0.5, gap: 0.06, inn: 0.7, hold: 0.28, back: 1.4 };
  const O0 = A.turn - A.lead, I0 = O0 + A.out + A.gap, I1 = I0 + A.inn, B1 = I1 + A.hold + A.back;
  const CUE = { out: O0, swap: I0, in: I1 - 0.12 };   // 1,12 s Bogen blass · 1,68 s Umgebung · 2,26 s Bogen färbt sich

  const DIR = 'assets/video/';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lang = () => window.OP_LANG || 'en';
  const sensorName = id => id ? SENSOR[id].name : EMPTY.name[lang()];
  const sensorColor = id => id ? SENSOR[id].color : EMPTY.color;

  const media = document.querySelector('#stage .hero-media');
  const still = media.querySelector('img');

  // ---------------------------------------------------------------- Logo-Bögen und Quadrate (wie setArc im Viewer)
  const mark = document.querySelector('.pill .mark');
  const portDot = k => document.querySelector(`.ports [data-port="${k}"]`);
  let current = { ...SETS[0] }, shown = 0;   // Belegung der Ports / gezeigter Satz
  function setArc(k, id) {
    if (mark) mark.style.setProperty('--arc' + k, sensorColor(id)); mark?.classList.toggle('empty-' + k, !id);
    const d = portDot(k); if (d) { d.querySelector('i').style.setProperty('--c', sensorColor(id)); d.querySelector('em').textContent = sensorName(id); d.classList.toggle('free', !id); d.classList.remove('out'); }
    const set = { ...current, [k]: id }, lab = { en: ['Body 1', 'Body 2', 'Environment'], de: ['Körper 1', 'Körper 2', 'Umgebung'] }[lang()];
    document.querySelector('.ports')?.parentElement?.setAttribute('title', PORTS.map((p, i) => `${lab[i]}: ${sensorName(set[p])}`).join(' · '));
  }
  const showSet = set => PORTS.forEach(k => setArc(k, set[k]));

  // ---------------------------------------------------------------- Standbilder (alle sechs vorladen: Wechsel ohne Lücke)
  const rests = SETS.map((_, i) => { const im = new Image(); im.src = DIR + `rest_${i}.jpg`; return im; });
  const showStill = i => { if (!still.src.endsWith(`rest_${i}.jpg`)) still.src = DIR + `rest_${i}.jpg`; };
  const ready = () => media.classList.add('ready');
  if (still.complete && still.naturalWidth) ready(); else still.addEventListener('load', ready, { once: true });

  // ---------------------------------------------------------------- Filme (nach dem ersten Bild vorladen)
  const vids = {};   // 'i_j' → <video>
  let front = null;  // sichtbarer Film (hält sein letztes Bild)
  function preload() {
    if (reduce) return;
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto'; v.disablePictureInPicture = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      v.addEventListener('error', () => { v.dataset.bad = '1'; if (clip?.v === v) finish(false); });
      v.src = DIR + `swap_${i}_${j}.mp4`; media.appendChild(v); vids[`${i}_${j}`] = v;
    }
  }
  const later = () => (window.requestIdleCallback || setTimeout)(preload, { timeout: 1500 });
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });

  function hide(v) { if (!v) return; v.classList.remove('on'); v.pause(); if (v.currentTime) v.currentTime = 0; }

  // ---------------------------------------------------------------- Ablauf eines Wechsels
  let clip = null;   // { v, toIdx, from, to, moving, outArcs, swapped, inArcs, shown, raf, wd }
  function cues(c, t) {
    if (t >= CUE.out && !c.outArcs) { for (const p of c.moving) if (c.from[p]) { setArc(p, null); portDot(p)?.classList.add('out'); } c.outArcs = true; }
    if (t >= CUE.swap && !c.swapped) { current = { ...c.to }; setArc('E', current.E); c.swapped = true; }
    if (t >= CUE.in && !c.inArcs) { for (const p of c.moving) setArc(p, c.to[p]); c.inArcs = true; }
  }
  function tick() {
    const c = clip; if (!c) return;
    cues(c, c.v.currentTime);
    if (c.v.ended) { finish(true); return; }
    c.raf = requestAnimationFrame(tick);
  }
  // natural = Film lief bis zum Ende und ist sichtbar: er hält sein letztes Bild. Sonst Endzustand als Standbild.
  function finish(natural) {
    const c = clip; if (!c) return;
    clip = null; cancelAnimationFrame(c.raf); clearTimeout(c.wd);
    cues(c, Infinity);
    current = { ...c.to }; shown = c.toIdx; showStill(shown); showSet(current);
    if (!(natural && front === c.v && c.shown)) { hide(front); if (front !== c.v) hide(c.v); front = null; }
  }
  function abort() {   // Sprachwechsel: Film verwerfen, ohne Endzustand
    const c = clip; if (!c) return;
    clip = null; cancelAnimationFrame(c.raf); clearTimeout(c.wd); hide(c.v);
  }
  // sofort in den Endzustand (reduzierte Bewegung, verdeckter Tab, Film fehlt oder passt nicht)
  function snap(i) {
    finish(false);
    hide(front); front = null;
    shown = i; current = { ...SETS[i] }; showStill(i); showSet(current);
  }
  function reveal(c) {
    if (clip !== c || c.shown) return;
    c.shown = true; c.v.classList.add('on');
    if (front && front !== c.v) hide(front);
    front = c.v; showStill(c.toIdx);   // darunter schon der Endzustand, falls der Film ausfällt
  }

  addEventListener('wordswap', e => {
    const to = e.detail.to % N, from = e.detail.from % N;
    if (clip) finish(false);   // Wechsel mitten im Film (z. B. Tab war verdeckt): erst Endzustand, dann neu
    const v = vids[`${shown}_${to}`];
    if (reduce || document.hidden || from !== shown || !v || v.dataset.bad) { snap(to); return; }
    const target = { ...SETS[to] };
    const changed = PORTS.filter(k => target[k] !== current[k]);
    const moving = changed.filter(k => SKIN.includes(k));
    if (!moving.length) { snap(to); return; }   // nur Umgebung: ohne Drehen (kommt in der Belegung nicht vor)
    const c = clip = { v, toIdx: to, from: { ...current }, to: target, moving, outArcs: false, swapped: false, inArcs: false, shown: false };
    if (v === front) { hide(v); front = null; showStill(shown); }   // gleicher Film noch sichtbar (nicht bei sechs Sätzen)
    if (v.currentTime) v.currentTime = 0;
    v.addEventListener('ended', () => { if (clip === c) { cues(c, Infinity); finish(true); } }, { once: true });
    v.addEventListener('timeupdate', function tu() { if (clip !== c) { v.removeEventListener('timeupdate', tu); return; } if (v.currentTime > 0) reveal(c); cues(c, v.currentTime); });   // Rückfall, falls requestVideoFrameCallback ruht (verdecktes Fenster)
    if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(() => reveal(c));
    else v.addEventListener('playing', () => reveal(c), { once: true });
    v.play().then(() => { c.raf = requestAnimationFrame(tick); }).catch(() => { if (clip === c) finish(false); });
    c.wd = setTimeout(() => { if (clip === c) finish(false); }, (B1 + 4) * 1000);   // Wachhund: hängt der Film, Endzustand
  });

  // Sprachwechsel: zurück auf Satz 0 (hero.js beginnt wieder beim ersten Wort), Namen neu beschriften
  addEventListener('langchange', () => { abort(); snap(0); });
  addEventListener('wordshow', e => {
    const i = e.detail.index % N;
    if (reduce) { if (i !== shown) snap(i); return; }   // hero.js sendet hier kein 'wordswap': Belegung springt mit dem Wort
    if (i === 0 && !clip && shown !== 0) snap(0);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && clip?.v.ended) finish(true); });

  showSet(current);

  // Entwicklungshilfe: __opv.swap(to) spielt den Wechsel vom gezeigten Satz, __opv.state()
  window.__opv = { SETS, A, CUE, B1,
    swap: to => dispatchEvent(new CustomEvent('wordswap', { detail: { from: shown, to } })),
    state: () => ({ shown, current, clip: clip && { to: clip.toIdx, t: clip.v.currentTime, shown: clip.shown }, front: front?.src || null }) };
})();
