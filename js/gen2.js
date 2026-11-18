// Abschnitt „So funktioniert es“: Bildfolge (assets/explode/NNNN.jpg + anchors.json) wird vom Scrollen gesteuert.
// Ablauf: Schriftzug steht → öffnet sich, Gerät erscheint frontal in der Mitte, dreht und wandert nach links →
// am geschlossenen Gerät: Gehäuse, Band → Explosion → Core (mit Daten), Pucks (mit Knopf zum Puck-Abschnitt).
// Je Schritt ein Rastpunkt. Der Text steht auf Höhe seines Teils; eine waagrechte Linie zeichnet sich vom Punkt neben
// dem Teil bis zur Überschrift.
(function () {
  const sec = document.querySelector('.g2'); if (!sec) return;
  const cv = document.getElementById('g2-stage'), ctx = cv.getContext('2d', { willReadFrequently: true });
  const w1 = sec.querySelector('.g2-w1'), w2 = sec.querySelector('.g2-w2'), title = sec.querySelector('.g2-title');
  const steps = [...sec.querySelectorAll('.g2-steps li')], note = sec.querySelector('.g2-note');
  const lead = document.getElementById('g2-lead'), line = lead.querySelector('.g2-line'), dot = lead.querySelector('.g2-dot'), halo = lead.querySelector('.g2-halo');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DIR = 'assets/explode/';
  let N = 0, NI = 0, imgs = [], anchors = null, last = -1;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * t * (t * (6 * t - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;

  // Hervorhebung je Station: eigene Bildfolgen (nur das erklärte Teil wird größer, Nachbarn weichen aus), gleiche Kamera
  const HLN = { titan: 'case', band: 'band', core: 'core', portAB: 'pucks' }, HLI = {};
  let HLM = 24;
  let HLA = null, hlCur = null, hlP = 0, hlWant = null, hlRaf = 0, moveT = '';
  fetch(DIR + 'anchors_hl.json').then(r => r.json()).then(j => {
    HLA = j; HLM = j.case.length;
    Object.values(HLN).forEach(n => { HLI[n] = Array.from({ length: HLM }, (_, i) => { const im = new Image(); im.src = DIR + 'hl_' + n + '/' + String(i).padStart(4, '0') + '.webp'; return im; }); });
  });
  fetch(DIR + 'anchors.json').then(r => r.json()).then(j => {
    anchors = j.anchors; N = j.frames; NI = j.intro || 0;
    imgs = Array.from({ length: N }, (_, i) => { const im = new Image(); im.decoding = 'async'; im.src = DIR + String(i).padStart(4, '0') + '.webp'; im.onload = () => { if (i === 0 || i === last) draw(last < 0 ? 0 : last, true); }; return im; });
    update();
  });

  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio, 2);
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); last = -1; update();
  }
  let fit = { x: 0, y: 0, w: 1, h: 1 };
  let lastKey = '', bgOff = null;
  function draw(i, force) {
    let im = imgs[i], im2 = null, a2 = 0, key = String(i);
    if (hlCur && hlP > 0 && HLI[hlCur]) {      // zwei Nachbarbilder überblenden: keine sichtbaren Stufen
      const f = ease(hlP) * (HLM - 1), i0 = Math.floor(f), i1 = Math.min(HLM - 1, i0 + 1), A0 = HLI[hlCur][i0], A1 = HLI[hlCur][i1];
      if (A0 && A0.complete && A0.naturalWidth) { im = A0; key = hlCur + ':' + f.toFixed(3); if (A1 && A1.complete && A1.naturalWidth && i1 !== i0) { im2 = A1; a2 = f - i0; } }
    }
    if (!im || !im.complete || !im.naturalWidth) return;
    last = i;
    if (key === lastKey && !force) return; lastKey = key;
    const sc_ = Math.min(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
    const w = im.naturalWidth * sc_, h = im.naturalHeight * sc_; fit = { x: (cv.width - w) / 2, y: (cv.height - h) / 2, w, h };
    // Fläche außerhalb des Bildes in der Hintergrundfarbe des Bildes selbst (WebP weicht ±1 Stufe von der Seite ab):
    // so gibt es keine Bildkante; der Canvas-Rand blendet per CSS-Maske weich in die Seite über.
    // Abweichung des Bildhintergrunds von der Seitenfarbe einmal messen, danach je Bild exakt ausgleichen
    // ('difference' zieht einen festen Wert ab, 'lighter' addiert ihn – ohne Schleife über die Pixel).
    if (!bgOff) { ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(im, fit.x, fit.y, w, h); const p = ctx.getImageData(Math.round(fit.x + 3), Math.round(fit.y + 3), 1, 1).data; bgOff = [p[0] - 248, p[1] - 246, p[2] - 242]; }
    ctx.globalAlpha = 1; ctx.fillStyle = '#f8f6f2'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(im, fit.x, fit.y, w, h);
    if (im2 && a2 > .01) { ctx.globalAlpha = a2; ctx.drawImage(im2, fit.x, fit.y, w, h); ctx.globalAlpha = 1; }
    const pos = bgOff.map(v => Math.max(0, v)), neg = bgOff.map(v => Math.max(0, -v));
    if (pos.some(v => v)) { ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = `rgb(${pos})`; ctx.fillRect(fit.x, fit.y, w, h); }
    if (neg.some(v => v)) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgb(${neg})`; ctx.fillRect(fit.x, fit.y, w, h); }
    ctx.globalCompositeOperation = 'source-over';
  }

  // Ablauf in Bildschirmhöhen Scrollweg (s = 0 … TOTAL). Jeder Schritt bekommt eine volle Bildschirmhöhe.
  // Telefon: kürzerer Weg (gleiche Reihenfolge, je Schritt ~0,8 Bildschirme) – sonst elf Bildschirme Daumen-Scrollen
  const MOB = innerWidth <= 820;
  const T = MOB ? { open: [.3, 1.1], show: [.7, 1.1], move: [.9, 1.9], pre: 2.0, expl: [3.65, 4.85], post: 4.95, per: .82 }
               : { open: [.5, 1.7], show: [1.1, 1.7], move: [1.5, 3.3], pre: 3.45, expl: [5.6, 7.4], post: 7.55, per: 1.0 };
  if (MOB) {
    sec.classList.add('mob');
    // Datentabelle aufklappbar (sonst deckt die Karte das Modell zu)
    sec.querySelectorAll('.g2-steps li').forEach(li => {
      const dl = li.querySelector('.g2-spec'); if (!dl) return;
      const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'g2-spec-t'; bt.setAttribute('aria-expanded', 'false');
      const lab = () => { bt.innerHTML = `<span>${window.OP_LANG === 'de' ? 'Technische Daten' : 'Specifications'}</span><i aria-hidden="true">⌄</i>`; };
      lab(); addEventListener('langchange', lab);
      bt.addEventListener('click', () => { const on = li.classList.toggle('spec-open'); bt.setAttribute('aria-expanded', String(on)); });
      dl.before(bt);
    });
  }
  const PRE = steps.filter(li => li.dataset.phase === 'pre'), POST = steps.filter(li => li.dataset.phase === 'post');
  const TOTAL = T.post + POST.length * T.per + .3;
  sec.style.height = (TOTAL + 1) * 100 + 'vh';
  const seg = ([a, b], s) => clamp((s - a) / (b - a));
  const stepAt = s => {
    if (s >= T.pre - .02 && s < T.pre + PRE.length * T.per) return steps.indexOf(PRE[Math.floor((s - T.pre) / T.per)]);
    if (s >= T.post - .02) return steps.indexOf(POST[Math.min(POST.length - 1, Math.floor(Math.max(0, s - T.post) / T.per))]);
    return -1;
  };
  // Rastpunkte: Mitte jedes Schritts. Scrollen bleibt nativ; erst wenn der Nutzer aufhört, gleitet die Seite sanft
  // auf den nächsten Rastpunkt; jede neue Eingabe bricht das Gleiten sofort ab.
  const SNAP = [...PRE.map((_, i) => T.pre + (i + .5) * T.per), ...POST.map((_, i) => T.post + (i + .5) * T.per)];
  const sNow = () => -sec.getBoundingClientRect().top / innerHeight;
  const yOf = v => sec.getBoundingClientRect().top + scrollY + v * innerHeight;
  let raf_ = 0, quiet = 0, gliding = false;
  const stop = () => { if (raf_) cancelAnimationFrame(raf_); raf_ = 0; gliding = false; clearTimeout(quiet); };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(t => addEventListener(t, stop, { passive: true }));
  function glide(v) {
    const y0 = scrollY, y1 = yOf(v), t0 = performance.now(), D = 600; gliding = true;
    const io = t => 1 - Math.pow(1 - t, 3);
    const f = now => { const t = Math.min(1, (now - t0) / D); window.scrollTo(0, y0 + (y1 - y0) * io(t)); raf_ = t < 1 ? requestAnimationFrame(f) : (gliding = false, 0); };
    raf_ = requestAnimationFrame(f);
  }
  // Rastung beim Mausrad/Trackpad/Tastatur: Jede Station hält. Zwei Wege fangen sie: (1) das Rad-Ereignis, das über
  // eine Station springen würde, (2) die echte Scrollposition – Chrome scrollt weich nach, die Position kann also über
  // eine Station laufen, ohne dass ein einzelnes Ereignis sie überspringt. Während des Haltens bleibt die Seite auf der
  // Station (HOLD ms, Nachlauf verpufft); erst RELEASE px weiteres Scrollen geben frei. Gegenrichtung gibt sofort frei,
  // nach 1,5 s ohne Eingabe ist die Rastung vergessen – die Seite kann nicht hängen bleiben.
  const HOLD = 650, RELEASE = 320;   // Mateo: stärker an den Texten haften
  let hold = null, passP = null, prevY = scrollY, lastInput = 'none';   // Sprungmarken beim Laden nicht fangen
  const snapsPx = () => SNAP.map(yOf);
  const grab = (P, dir, now) => { stop(); hold = { P, dir, t: now, last: now, acc: 0 }; window.scrollTo({ top: P, behavior: 'instant' }); prevY = P; };
  const release = () => { if (hold) passP = hold.P; hold = null; };
  addEventListener('wheel', e => {
    lastInput = 'wheel';
    if (reduce || e.ctrlKey || innerWidth <= 820) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    if (!dy) return;
    const now = performance.now();
    if (hold && now - hold.last > 1500) hold = null;                       // lange Pause: Rastung vergessen
    if (hold) {
      hold.last = now;
      if (Math.sign(dy) !== hold.dir) { release(); return; }               // Gegenrichtung: frei
      if (now - hold.t > HOLD) hold.acc += Math.abs(dy);                    // nur was nach der Haltezeit kommt, zählt
      if (now - hold.t > HOLD && hold.acc > RELEASE) { release(); return; } // genug weitergescrollt: frei
      e.preventDefault(); return;
    }
    const y = scrollY, to = y + dy;
    const P = snapsPx().find(p => p !== passP && (dy > 0 ? (y < p - 1 && to >= p) : (y > p + 1 && to <= p)));
    if (P === undefined) return;
    e.preventDefault(); grab(P, Math.sign(dy), now);
  }, { passive: false });
  addEventListener('keydown', e => {
    if (!/^(ArrowDown|ArrowUp|PageDown|PageUp|Space| |Home|End)$/.test(e.key)) return;
    lastInput = 'key';
    if (hold && performance.now() - hold.t > HOLD) release();               // Tastatur: nach der Haltezeit frei
  });
  addEventListener('mousedown', () => { lastInput = 'pointer'; hold = null; }, { passive: true });
  addEventListener('scroll', () => {
    const y = scrollY, now = performance.now();
    if (reduce || innerWidth <= 820 || (lastInput !== 'wheel' && lastInput !== 'key')) { prevY = y; return; }
    if (passP !== null && Math.abs(y - passP) > innerHeight * .3) passP = null;
    if (hold && now - hold.last > 1500) hold = null;
    if (hold) { if (Math.abs(y - hold.P) > 1) window.scrollTo({ top: hold.P, behavior: 'instant' }); prevY = hold.P; return; }   // festhalten
    const P = snapsPx().find(p => p !== passP && ((prevY < p - 1 && y >= p) || (prevY > p + 1 && y <= p)));
    if (P !== undefined) grab(P, y > prevY ? 1 : -1, now); else prevY = y;
  }, { passive: true });
  // Einrasten nach dem Scrollen nur bei Touch (dort gibt es keine Rastung über das Rad)
  addEventListener('touchstart', () => { lastInput = 'touch'; hold = null; }, { passive: true });
  addEventListener('scroll', () => {
    if (gliding || reduce || lastInput !== 'touch') return;
    clearTimeout(quiet);
    quiet = setTimeout(() => {
      const v = sNow(); if (v < SNAP[0] - .35 || v > SNAP[SNAP.length - 1] + .35 || (v > T.pre + PRE.length * T.per && v < T.post - .2)) return;
      const i = SNAP.reduce((b, x, k) => Math.abs(x - v) < Math.abs(SNAP[b] - v) ? k : b, 0);
      if (Math.abs(SNAP[i] - v) > .01) glide(SNAP[i]);
    }, 220);
  }, { passive: true });

  function update() {
    const r = sec.getBoundingClientRect(), s = clamp(-r.top / innerHeight, 0, TOTAL);
    const desk = innerWidth > 820;
    // 1) Schriftzug öffnet sich: Wörter gleiten nach außen und blenden aus
    const o = ease(seg(T.open, s));
    if (MOB) { w1.style.transform = `translateY(${-o * 30}svh)`; w2.style.transform = `translateY(${o * 30}svh)`; }
    else { w1.style.transform = `translateX(${-o * 42}vw)`; w2.style.transform = `translateX(${o * 42}vw)`; }
    title.style.opacity = 1 - seg([T.open[0] + .5, T.open[1]], s);
    // 2) Gerät erscheint klein in der Lücke, wandert langsam nach links und dreht dabei aus der Frontalansicht
    const a = ease(seg(T.show, s)), m = ease(seg(T.move, s));
    cv.style.opacity = a;
    moveT = desk ? `translate(${lerp(25, 0, m)}vw, 0) scale(${lerp(.62, 1, m)})` : `scale(${lerp(.62, 1, m)})`;
    // 3) geschlossen: Gehäuse und Band; dann Explosion; dann Core und Pucks (Bild steht während der Schritte still)
    const e = seg(T.expl, s);
    if (N) draw(s < T.expl[0] ? Math.round(ease(seg([T.show[0], T.move[1]], s)) * Math.max(0, NI - 1)) : NI + Math.round(e * (N - NI - 1)));
    cv.style.transform = moveT;
    const k = stepAt(s); hlTarget(k); steps_(k, desk);
  }
  // Station aktiv: ihre Bildfolge vorwärts abspielen; beim Verlassen rückwärts, dann die nächste vorwärts. Grundbild
  // und Kamera sind für alle Stationen gleich, das Gerät bleibt also stehen.
  function hlTarget(k) {
    const li = steps[k]; hlWant = li ? HLN[li.dataset.anchor] : null;
    const kind = n => n === 'case' || n === 'band' ? 'pre' : n ? 'post' : null;
    if (hlCur && (!hlWant || kind(hlCur) !== kind(hlWant))) { hlCur = hlWant; hlP = 0; }   // anderes Grundbild: sofort zurücksetzen
    if (!hlRaf && (hlWant !== hlCur || (hlCur && hlP < 1))) hlRaf = requestAnimationFrame(hlStep);
  }
  let hlT = 0;
  function hlStep(now) {
    hlRaf = 0; const dt = Math.min(.05, (now - (hlT || now)) / 1000); hlT = now;
    const speed = reduce ? 99 : 1 / 1.0;                        // 1 s je Richtung, Verlauf weich (ease beim Zeichnen)
    if (hlCur !== hlWant) { hlP = Math.max(0, hlP - dt * speed * 1.4); if (hlP === 0) hlCur = hlWant; }
    else if (hlCur) hlP = Math.min(1, hlP + dt * speed);
    draw(last, true); steps_(stepAt(clamp(-sec.getBoundingClientRect().top / innerHeight, 0, TOTAL)), innerWidth > 820);
    if (hlCur !== hlWant || (hlCur && hlP < 1)) hlRaf = requestAnimationFrame(hlStep); else hlT = 0;
  }
  // Rechter Rand des Modells in einer Bildzeile (Pixel weichen von der Seitenfarbe ab) – Linie beginnt dort, nicht im Teil
  function edgeAt(y, x0) {
    const h = 14, yy = Math.max(0, Math.round(y - h / 2));
    let d; try { d = ctx.getImageData(0, yy, cv.width, h).data; } catch (_) { return x0; }
    let best = x0;
    const xr = Math.min(cv.width - 1, Math.floor(fit.x + fit.w) - 2);   // nur innerhalb des Bildes, Rand ist transparent
    for (let row = 0; row < h; row += 2) for (let x = xr; x > best; x--) {
      const i = (row * cv.width + x) * 4;
      if (d[i + 3] > 200 && Math.abs(d[i] - 248) + Math.abs(d[i + 1] - 246) + Math.abs(d[i + 2] - 242) > 24) { best = x; break; }
    }
    return best;
  }
  // Band ist in der Explosion ausgeblendet und hat keinen Ankerpunkt: im geschlossenen Bild die navyfarbenen Pixel suchen
  function bandAnchor() {
    let d; try { d = ctx.getImageData(0, 0, cv.width, cv.height).data; } catch (_) { return null; }
    let mx = -1, pts = [];
    for (let y = 0; y < cv.height; y += 3) for (let x = 0; x < cv.width; x += 3) {
      const i = (y * cv.width + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
      if (d[i + 3] > 200 && b > r + 16 && b > g + 4 && r < 120) { pts.push([x, y]); if (x > mx) mx = x; }
    }
    if (!pts.length) return null;
    const right = pts.filter(p => p[0] > mx - cv.width * .04);
    return [mx, right.reduce((a, p) => a + p[1], 0) / right.length];
  }
  let edgeKey = '', A = null, shown = -2;
  function steps_(k, desk) {
    steps.forEach((li, i) => li.classList.toggle('on', i === k));
    note.style.opacity = k >= 0 ? 1 : 0;
    const li = steps[k];
    if (!(desk && li && anchors && N && last >= 0)) { lead.classList.remove('on'); steps.forEach(l => l.style.top = ''); shown = -2; return; }
    const cr = cv.getBoundingClientRect(), pr = lead.getBoundingClientRect(), d = cv.width / cr.width;
    const key = lastKey + '|' + k + '|' + cv.width;
    if (key !== edgeKey) {     // Punkt neben dem Teil (Bildpixel), einmal je Bild und Schritt
      edgeKey = key; A = null;
      if (li.dataset.anchor === 'band') { const b = bandAnchor(); if (b) A = [b[0], b[1]]; }
      else {
        const hk = HLN[li.dataset.anchor], k_ = li.dataset.anchor;
        let an = anchors[last][k_];
        if (hlCur === hk && hlP > 0 && HLA) {   // Ankerpunkt zwischen den Nachbarbildern mitlaufen lassen
          const f = ease(hlP) * (HLM - 1), i0 = Math.floor(f), i1 = Math.min(HLM - 1, i0 + 1), t = f - i0, a0 = HLA[hk][i0][k_], a1 = HLA[hk][i1][k_];
          if (a0 && a1) an = [a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t];
        }
        if (an) { const py = fit.y + an[1] * fit.h; A = [edgeAt(py, fit.x + an[0] * fit.w), py]; }
      }
    }
    if (!A) { lead.classList.remove('on'); return; }
    const ax = cr.left + A[0] / d + 18 - pr.left, ay = cr.top + A[1] / d - pr.top;
    // Text auf Höhe des Teils: die erste Zeile der Überschrift liegt auf der Linie (innerhalb des Bildschirms gehalten)
    const h3 = li.querySelector('h3'), lh = parseFloat(getComputedStyle(h3).lineHeight) || 40, off = h3.offsetTop + lh / 2;
    const top = Math.max(innerHeight * .1, (innerHeight - li.offsetHeight) / 2);   // Textblock immer senkrecht mittig
    li.style.top = top + 'px';
    const bx = li.getBoundingClientRect().left - pr.left - 22, by = top + off;
    // waagrecht vom Punkt, erst kurz vor dem Text zur Überschrift (nur wenn der Text am Rand gehalten wird)
    const x0 = ax + 8, k1 = x0 + (bx - x0) * .3, k2 = x0 + (bx - x0) * .72, km = (k1 + k2) / 2;
    line.setAttribute('d', Math.abs(by - ay) < 1 ? `M${x0} ${ay}H${bx}` : `M${x0} ${ay}H${k1}C${km} ${ay} ${km} ${by} ${k2} ${by}H${bx}`);
    dot.setAttribute('cx', ax); dot.setAttribute('cy', ay); halo.setAttribute('cx', ax); halo.setAttribute('cy', ay);
    if (shown !== k) {   // Linie zeichnet sich bei jedem Schrittwechsel vom Teil zum Text
      shown = k; const L = line.getTotalLength();
      line.style.transition = 'none'; line.style.strokeDasharray = L; line.style.strokeDashoffset = L; line.getBoundingClientRect();
      line.style.transition = 'stroke-dashoffset .9s cubic-bezier(.2,.7,.1,1) .1s'; line.style.strokeDashoffset = 0;
      lead.classList.remove('pop'); void lead.getBoundingClientRect(); lead.classList.add('pop');
    }
    lead.classList.add('on');
  }
  let tick = 0;
  addEventListener('scroll', () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; update(); }); }, { passive: true });
  addEventListener('resize', size); size();
  if (reduce) sec.classList.add('reduce');
})();
