// Abschnitt „Sensor-Pucks“ nach der Vorlage annnimate „Infinite Marquee“ (Video in Mateos Downloads, 14.11.2026):
// zwei leicht gekippte Bänder laufen gegenläufig; abwechselnd kleine, leicht gedrehte Bildkacheln (Puck von oben auf einer
// Kachel in Sensorfarbe) und große Namen in Dunkel/Grau. Ziehen mit Maus/Finger schiebt beide Bänder (gegenläufig) mit
// Schwung, danach gleiten sie zurück ins Grundtempo. Hover bremst; die „?“-Kachel führt zum Kontakt.
(function () {
  const box = document.getElementById('pk-mq'); if (!box) return;
  if (matchMedia('(pointer: coarse)').matches) document.querySelector('.pk-hint [data-i18n]')?.setAttribute('data-i18n', 'pk.hintT');   // Touch: „Wischen“ statt „Ziehen“
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t_ = k => (window.I18N?.[window.OP_LANG] || window.I18N.en)[k];
  const P = [
    { name: 'Pulse', col: '#cf3826', img: 'mod-pulse' }, { name: 'Thermo+', col: '#b8892f', img: 'mod-thermo' },
    { name: 'Air', col: '#3c6ea6', img: 'mod-air' }, { name: 'EKG', col: '#101f3c', img: 'mod-ekg' },
    { name: 'EDA / BioZ', col: '#b08d83', img: 'mod-eda' }, { q: true },
  ];
  // „Ihr Sensor“ nach je zwei Pucks (Mateo: öfter zeigen); zweites Band versetzt, damit die „?“ nicht übereinander stehen
  const Q = P[5];
  const ROWS = [[P[0], P[1], Q, P[2], P[3], Q, P[4], P[0], Q, P[1], P[2], Q, P[3], P[4], Q],
                [P[3], Q, P[4], P[0], Q, P[1], P[2], Q, P[3], P[4], Q, P[0], P[1], Q, P[2]]];
  const rot = i => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return (x - Math.floor(x)) * 10 - 5; };   // feste, leicht unterschiedliche Drehung je Kachel
  const item = (p, i, k) => {
    const label = p.q ? t_('pk.q') : p.name, grey = (i + k) % 2 === 1, r = rot(i + k * 7).toFixed(2);
    const tile = p.q ? `<a class="pm-tile pm-q" href="#contact" aria-label="${t_('pk.q')}" style="--r:${r}deg"><span>?</span></a>`
      : `<span class="pm-tile" style="--c:${p.col};--r:${r}deg"><span class="pm-flip"><img class="pm-f" src="/assets/pucks/${p.img}.webp" alt="${p.name} sensor puck" draggable="false"><img class="pm-b" src="/assets/pucks/back/${p.img}.webp" alt="" draggable="false" loading="lazy"></span></span>`;
    return `<span class="pm-pair">${tile}<span class="pm-word${grey ? ' g' : ''}">${label}</span></span>`;
  };
  let rows = [];
  function build() {
    box.innerHTML = ROWS.map((r, k) => `<div class="pm-row"><div class="pm-track">${Array.from({ length: 4 }, (_, c) =>
      `<div class="pm-set"${c ? ' aria-hidden="true"' : ''}>${r.map((p, i) => item(p, i + c * r.length, k)).join('')}</div>`).join('')}</div></div>`).join('');
    rows = [...box.querySelectorAll('.pm-track')].map((el, k) => ({ el, set: el.firstElementChild, x: k ? -300 : 0, dir: k ? 1 : -1 }));
  }
  const BASE = 36;                       // px/s Grundtempo
  let v = 0, hover = false, drag = false, lastX = 0, samples = [], moved = 0;
  box.addEventListener('pointerdown', e => { drag = true; moved = 0; lastX = e.clientX; samples = []; box.setPointerCapture(e.pointerId); box.classList.add('drag'); });
  box.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - lastX, now = performance.now(); lastX = e.clientX; moved += Math.abs(dx);
    rows.forEach(r => { r.x += dx * (r.dir < 0 ? 1 : -1); });                 // oberes Band folgt der Hand, unteres gegenläufig
    samples.push([now, dx]); samples = samples.filter(s => now - s[0] < 90);
  });
  const up = () => { if (!drag) return; drag = false; box.classList.remove('drag');
    const span = samples.length ? Math.max(16, performance.now() - samples[0][0]) : 16; v = samples.reduce((a, s) => a + s[1], 0) / span * 1000; };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  box.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  // Touch hat kein Hover: Tippen auf eine Puck-Kachel dreht sie um (Rückseite mit Stecker), erneutes Tippen zurück
  box.addEventListener('click', e => { const t = e.target.closest('.pm-tile:not(.pm-q)'); if (t && moved <= 6) t.classList.toggle('flip'); });
  box.addEventListener('mouseenter', () => hover = true); box.addEventListener('mouseleave', () => hover = false);

  let prev = 0, raf = 0, visible = false, speed = 1, blurV = 0;
  function loop(now) {
    raf = 0; if (!visible) return;
    const dt = Math.min(.05, (now - (prev || now)) / 1000); prev = now;
    speed += ((hover ? .3 : 1) - speed) * (1 - Math.exp(-dt * 4));             // Hover bremst weich
    if (!drag) {
      v *= Math.exp(-dt * 2.6);                                                 // Schwung klingt ab
      rows.forEach(r => { r.x += (r.dir * BASE * (reduce ? 0 : speed) + v * (r.dir < 0 ? 1 : -1)) * dt; });
    }
    const live = drag ? (samples.reduce((a_, s_) => a_ + s_[1], 0) / Math.max(.016, (performance.now() - (samples[0]?.[0] || performance.now())) / 1000 || .016)) : v;
    blurV += (Math.max(-2500, Math.min(2500, live)) - blurV) * .25;
    box.style.setProperty('--mb', Math.min(1, Math.abs(blurV) / 1800).toFixed(3));
    rows.forEach(r => {
      const w = r.set.offsetWidth; if (!w) return;
      while (r.x > 0) r.x -= w; while (r.x < -w) r.x += w;                      // nahtlos: eine Satzbreite umbrechen
      r.el.style.transform = `translate3d(${r.x.toFixed(2)}px,0,0) skewX(${(-blurV * .004 * (r.dir < 0 ? 1 : -1)).toFixed(2)}deg)`;
    });
    raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) { prev = 0; raf = requestAnimationFrame(loop); } }, { threshold: 0 }).observe(box);
  build();
  window.addEventListener('langchange', build);
})();
