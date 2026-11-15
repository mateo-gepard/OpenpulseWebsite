// Abschnitt „So arbeiten wir zusammen“ (Mateo, 14.11.2026).
// Aufbau: Der Abschnitt heftet sich an (sticky). Beim Hineinscrollen wächst eine Karte zur fast vollen Bildfläche; hält man
// auf halbem Weg an, gleitet sie sanft ganz auf (jede Eingabe bricht das ab – nie Scrollen blockieren). Darin drei Szenen
// nacheinander, je ein kurzer Film mit Knopf zur nächsten; die Schrittnamen sind jederzeit klickbar.
//   1 Gespräch: Satz tippt sich, drei Angaben wandern in einen Vorschlag.
//   2 Konfiguration: wie ein Apple-Store-Konfigurator (Gerätebild, Ports als Kacheln, Preisleiste); erst gezeigt, dann bedienbar.
//   3 Pilot: Beispiel-Pilot als Projektzeitplan mit zwei Spuren „OpenPulse“ und „Ihr Team“ – unsere Spur voll, Ihre fast leer.
// Danach blendet alles aus und ein Kontaktformular erscheint. Links auf #contact führen direkt dorthin.
// Ehrlich: Beispielsatz, Beispielpilot (Handelsabteilung, 5 Geräte, 14 Tage) und Firmenablauf sind Beispiele, keine Zusagen.
// Datenweg nach docs/GEN2_SPEC.md 4.4: Gerät speichert ≈ 3 Tage, Download über USB im Dock (≈ 11 min je 3 Tage, Rechnung).
// Datenmenge ≈ 225 MB je Gerät und Tag (Rechnung O5, keine Messung). Preis nach Mateo: ≈ 199 € + ≈ 29 € je Puck.
// Das Formular sendet über Formspree (Formular xnjeyvzr, dasselbe wie auf www.openpulse.eu) an contact@openpulse.eu.
(function () {
  const how = document.getElementById('how'); if (!how) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqS = matchMedia('(max-width: 760px)');
  const L = () => window.OP_LANG === 'de' ? 'de' : 'en';
  const I = k => (window.I18N?.[L()] || {})[k] || '';
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a, b, e) => a + (b - a) * e;
  const FORM = 'https://formspree.io/f/xnjeyvzr';   // Formspree-Formular der Live-Seite www.openpulse.eu, Empfänger contact@openpulse.eu
  const BASE = 199, PUCK = 29, MB_DAY = 225, PIMG = p => `assets/pucks/top/${PUCKS[p][1]}.webp`;
  const MARK = `<svg viewBox="10 10 80 80" aria-hidden="true"><path d="M 18.8 39.26 A 33 33 0 0 1 64.98 20.6" stroke="#101f3c"/><path d="M 74.91 28.35 A 33 33 0 0 1 67.97 77.68" stroke="#b08d83"/><path d="M 56.3 82.39 A 33 33 0 0 1 17.05 51.73" stroke="#cf3826"/></svg>`;
  const CHECK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3 5 8.6 9.6 3.6"/></svg>';
  const TXT = {
    en: { h1: 'Do you have a use case?', h2: 'Let’s work together.',
      steps: [['Talk', 'Tell us what you want to measure, on whom and for how long. You get a proposal in writing.'],
        ['Configure', 'Pick a puck for each port. Any port can change, any time.'],
        ['Pilot', 'A few devices on real people first. We do the work; your team hands out devices and docks them.']],
      q: ['“We want to see how ', ['40 traders', 'n'], ' handle ', ['stress', 's'], ' over ', ['8 weeks', 'd'], '.”'],
      doc: { t: 'Proposal', s: 'Signals', n: 'Devices', d: 'Duration', sum: 'Per device', nv: '40', dv: '8 weeks' },
      k: { title: 'Configure your OpenPulse.', sub: 'One core. Three ports.', inside: 'Inside your device',
        gh: { A: ['Port A.', 'On the skin.'], B: ['Port B.', 'On the skin, too.'], E: ['Port E.', 'Facing the air.'] },
        none: 'None', noneD: 'Leave this port empty.', add: '+ 29 €', name: 'OpenPulse Gen 2', per: 'per device', core: 'Core' },
      p: { kick: 'Example pilot · trading desk · 5 traders · 14 days', title: 'Stress pilot', day: 'Day', done: 'Complete',
        op: 'OpenPulse', you: 'Your team',
        ev: { built: n => `Built 5 devices: ${n}`, test: 'Tested each one, labelled P01–P05', ship: 'Shipped charged, ready to wear', check: 'Check-in call, 15 min', review: 'Pilot review, plan for 40',
          hand: 'Hand out 5 devices', dock: 'Dock overnight · data copies itself' },
        data: 'Raw data on your machine', s: ['Tasks for your team', 'Done by OpenPulse', 'Raw data, all yours', 'Sent to OpenPulse'], bytes: '0 bytes',
        next: 'Next: 40 devices, same configuration.' },
      c: { t: 'Let’s talk about your use case.', s: 'Tell us what you want to measure. You get a written proposal, like the one above.',
        name: 'Name', org: 'Company', mail: 'Email', msg: 'What do you want to measure?', cfg: 'Your configuration', send: 'Send',
        done: 'Thank you. We will reply with a proposal.', again: 'Watch again', sending: 'Sending…', err: 'That did not go through. Please write to contact@openpulse.eu.', priv: 'We use your details only to reply to you. More in our <a href="datenschutz.html">privacy policy</a>.' } },
    de: { h1: 'Sie haben einen Anwendungsfall?', h2: 'Dann arbeiten wir zusammen.',
      steps: [['Gespräch', 'Sagen Sie uns, was Sie messen wollen, an wem und wie lange. Sie erhalten einen schriftlichen Vorschlag.'],
        ['Konfiguration', 'Wählen Sie für jeden Port einen Puck. Jeder Port lässt sich ändern, jederzeit.'],
        ['Pilot', 'Zuerst wenige Geräte an echten Menschen. Wir erledigen die Arbeit; Ihr Team verteilt die Geräte und legt sie ins Dock.']],
      q: ['„Wir wollen sehen, wie ', ['40 Händler', 'n'], ' über ', ['8 Wochen', 'd'], ' mit ', ['Stress', 's'], ' umgehen.“'],
      doc: { t: 'Vorschlag', s: 'Signale', n: 'Geräte', d: 'Dauer', sum: 'Je Gerät', nv: '40', dv: '8 Wochen' },
      k: { title: 'Konfigurieren Sie Ihr OpenPulse.', sub: 'Ein Core. Drei Ports.', inside: 'In Ihrem Gerät',
        gh: { A: ['Port A.', 'Auf der Haut.'], B: ['Port B.', 'Ebenfalls auf der Haut.'], E: ['Port E.', 'Zur Luft hin.'] },
        none: 'Leer', noneD: 'Diesen Port leer lassen.', add: '+ 29 €', name: 'OpenPulse Gen 2', per: 'je Gerät', core: 'Core' },
      p: { kick: 'Beispielpilot · Handelsabteilung · 5 Händler · 14 Tage', title: 'Stress-Pilot', day: 'Tag', done: 'Abgeschlossen',
        op: 'OpenPulse', you: 'Ihr Team',
        ev: { built: n => `5 Geräte gebaut: ${n}`, test: 'Jedes geprüft, beschriftet P01–P05', ship: 'Geladen verschickt, tragebereit', check: 'Zwischengespräch, 15 min', review: 'Auswertung, Plan für 40',
          hand: '5 Geräte ausgeben', dock: 'Über Nacht ins Dock · Daten kopieren sich' },
        data: 'Rohdaten auf Ihrem Rechner', s: ['Aufgaben für Ihr Team', 'Erledigt von OpenPulse', 'Rohdaten, alle Ihre', 'An OpenPulse gesendet'], bytes: '0 Byte',
        next: 'Als Nächstes: 40 Geräte, gleiche Konfiguration.' },
      c: { t: 'Sprechen wir über Ihren Anwendungsfall.', s: 'Sagen Sie uns, was Sie messen wollen. Sie erhalten einen schriftlichen Vorschlag wie oben.',
        name: 'Name', org: 'Firma', mail: 'E-Mail', msg: 'Was möchten Sie messen?', cfg: 'Ihre Konfiguration', send: 'Senden',
        done: 'Danke. Wir antworten mit einem Vorschlag.', again: 'Noch einmal ansehen', sending: 'Wird gesendet …', err: 'Das hat nicht geklappt. Bitte schreiben Sie an contact@openpulse.eu.', priv: 'Wir nutzen Ihre Angaben nur, um Ihnen zu antworten. Mehr in der <a href="datenschutz.html">Datenschutzerklärung</a>.' } },
  };
  const PUCKS = { pulse: ['Pulse', 'mod-pulse'], thermo: ['Thermo+', 'mod-thermo'], ekg: ['EKG', 'mod-ekg'], eda: ['EDA / BioZ', 'mod-eda'], air: ['Air', 'mod-air'] };
  const OPTS = { A: ['pulse', 'thermo', 'ekg', 'eda', null], B: ['pulse', 'thermo', 'ekg', 'eda', null], E: ['air', null] };
  const KCOL = { s: '#cf3826', n: '#101f3c', d: '#b08d83' }, KBG = { s: 'rgba(207,56,38,.13)', n: 'rgba(16,31,60,.10)', d: 'rgba(176,141,131,.22)' };
  Object.keys(PUCKS).forEach(p => { new Image().src = PIMG(p); });
  const st = { i: 0, t: 0, playing: false, started: false, visible: false, touched: false, contact: false, P: { A: 'pulse', B: 'thermo', E: 'air' } };
  const count = () => ['A', 'B', 'E'].filter(k => st.P[k]).length;
  const names = () => ['A', 'B', 'E'].map(k => st.P[k] && PUCKS[st.P[k]][0]).filter(Boolean).join(' · ') || '–';
  const per = () => BASE + PUCK * count();
  let T, scenes = [], els = {}, raf = 0, prev = 0;

  // Rollende Ziffern (Zählwerk)
  const OLH = 1.12;
  const odoHTML = n => `<span class="odo">${Array.from({ length: n }, () => `<span class="od"><span class="od-c">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<i>${d}</i>`).join('')}</span></span>`).join('')}</span>`;
  function odo(el, v) {
    const cols = el._c || (el._c = [...el.querySelectorAll('.od-c')]);
    cols.forEach((c, i) => { const u = Math.pow(10, cols.length - 1 - i), pos = u === 1 ? v % 10 : Math.floor(v / u) % 10 + Math.max(0, (v % u) - (u - 1));
      c.style.transform = `translateY(${(-pos * OLH).toFixed(4)}em)`; });
  }

  // ── Szene 1: Gespräch ──
  function talk() {
    let el, q, chars, caret, ph, fly, doc, rows, sum, sumO, pos = [], from = {}, to = {}, kf = 1, lastN = -1, tt = [];
    const KEYS = ['s', 'n', 'd'], T0 = .4, T1 = 3.5;
    return { id: 'talk', dur: 9.4,
      html: () => `<div class="t-box"><p class="t-q" aria-label="${T.q.map(s => Array.isArray(s) ? s[0] : s).join('')}">${T.q.map(s => { const txt = Array.isArray(s) ? s[0] : s, cs = [...txt].map(c => `<span class="c">${c}</span>`).join('');
          return Array.isArray(s) ? `<span class="ph" data-k="${s[1]}" style="--k:${KCOL[s[1]]};--kb:${KBG[s[1]]}">${cs}</span>` : cs; }).join('')}</p><span class="t-caret"></span>
        <div class="t-doc"><div class="t-dh">${MARK}<b>OpenPulse</b><span>${T.doc.t}</span></div>
          ${KEYS.map(k => `<div class="t-row" data-k="${k}" style="--k:${KCOL[k]}"><span>${T.doc[k]}</span><b>${k === 's' ? 'Pulse · Thermo+ · Air' : T.doc[k + 'v']}</b></div>`).join('')}
          <div class="t-row t-sum"><span>${T.doc.sum}</span><b>≈ ${odoHTML(3)} €</b></div></div>
        ${KEYS.map(k => `<span class="t-fly" data-k="${k}" style="--k:${KCOL[k]}">${T.q.find(s => Array.isArray(s) && s[1] === k)[0]}</span>`).join('')}</div>`,
      init(e) { el = e.querySelector('.t-box'); q = el.querySelector('.t-q'); chars = [...q.querySelectorAll('.c')]; caret = el.querySelector('.t-caret'); doc = el.querySelector('.t-doc');
        ph = {}; fly = {}; rows = {}; KEYS.forEach(k => { ph[k] = el.querySelector(`.ph[data-k="${k}"]`); fly[k] = el.querySelector(`.t-fly[data-k="${k}"]`); rows[k] = el.querySelector(`.t-row[data-k="${k}"]`); });
        sum = el.querySelector('.t-sum'); sumO = sum.querySelector('.odo'); lastN = -1;
        let acc = 0; tt = chars.map((c, i) => { const pv = chars[i - 1]; acc += 1 + (pv && pv.textContent === ',' ? 5 : 0) + (c.textContent === ' ' ? .5 : 0) + (pv && c.parentElement !== pv.parentElement ? 1.6 : 0) + .5 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1); return acc; });
        tt = tt.map(v => T0 + v / acc * (T1 - T0)); },
      layout() { const sr = el.getBoundingClientRect(), rel = r => ({ l: r.left - sr.left, t: r.top - sr.top, w: r.width, h: r.height, r: r.right - sr.left });
        const tf = doc.style.transform; doc.style.transform = 'none';
        pos = chars.map(c => rel(c.getBoundingClientRect()));
        KEYS.forEach(k => { from[k] = rel(ph[k].getBoundingClientRect()); to[k] = rel(rows[k].querySelector('b').getBoundingClientRect()); });
        doc.style.transform = tf;
        kf = parseFloat(getComputedStyle(rows.s.querySelector('b')).fontSize) / parseFloat(getComputedStyle(q).fontSize); },
      render(t, now) {
        const N = chars.length; let n = 0; while (n < N && tt[n] <= t) n++;
        if (n !== lastN) { chars.forEach((c, i) => { c.style.opacity = i < n ? 1 : 0; }); lastN = n; }
        const p = pos[Math.max(0, n - 1)];
        if (p) { caret.style.transform = `translate(${(n ? p.r : p.l) + 2}px, ${p.t + p.h * .12}px)`; caret.style.height = p.h * .78 + 'px';
          caret.style.opacity = t < 4 ? (n < N ? 1 : .5 + .5 * Math.cos(now / 160)) * (1 - seg(t, 3.7, 4)) : 0; }
        T.q.filter(Array.isArray).forEach((s, j) => ph[s[1]].style.setProperty('--u', eo(seg(t, 3.8 + j * .3, 4.4 + j * .3)).toFixed(3)));
        q.style.opacity = lerp(1, .5, seg(t, 4.9, 5.7)).toFixed(3);
        const de = eo(seg(t, 4.8, 5.8)); doc.style.opacity = seg(t, 4.8, 5.3).toFixed(3);
        doc.style.transform = `perspective(900px) translateY(${((1 - de) * 44).toFixed(1)}px) rotateX(${((1 - de) * 16).toFixed(2)}deg)`;
        KEYS.forEach((k, j) => {
          rows[k].firstElementChild.style.opacity = eo(seg(t, 5.3 + j * .15, 5.8 + j * .15)).toFixed(3);
          const a = 6.0 + j * .7, raw = seg(t, a, a + .85), e = eio(raw), f = from[k], g = to[k]; if (!f) return;
          rows[k].lastElementChild.style.opacity = seg(raw, .72, 1).toFixed(3);
          rows[k].style.setProperty('--d', eo(seg(raw, .7, 1)).toFixed(3));
          const s = lerp(1, kf, e), x = lerp(f.l, g.r - f.w * kf, e), y = lerp(f.t, g.t + (g.h - f.h * kf) / 2, e) - 34 * Math.sin(Math.PI * e);
          fly[k].style.opacity = raw <= 0 || raw >= 1 ? 0 : (1 - seg(raw, .78, 1)).toFixed(3);
          fly[k].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
          fly[k].style.filter = `blur(${(Math.sin(Math.PI * e) * 1.2).toFixed(2)}px)`; });
        sum.style.opacity = seg(t, 8.1, 8.4).toFixed(3);
        odo(sumO, lerp(BASE, BASE + 3 * PUCK, eio(seg(t, 8.2, 9.2))));
      } };
  }

  // ── Szene 2: Konfiguration wie im Apple Store ──
  function cfg() {
    let el, left, bar, groups = {}, tiles = {}, slots = {}, descs = {}, priceO, brk, sumCfg, cursor, tc = {}, pv = BASE, tw = 0, shown = '';
    const SEQ = [['A', 'pulse', 1.7], ['B', 'thermo', 2.7], ['E', 'air', 3.7]];
    const desc = p => p ? I('pk.' + p) : T.k.noneD;
    function paint(sel) {
      const key = JSON.stringify(sel); if (key === shown) return; shown = key;
      ['A', 'B', 'E'].forEach(k => {
        tiles[k].forEach(b => { const on = k in sel && (b.dataset.v || null) === sel[k]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
        descs[k].textContent = k in sel ? desc(sel[k]) : '';
        const s = slots[k], p = k in sel ? sel[k] : null, im = s.querySelector('img');
        s.classList.toggle('full', !!p); if (p) im.src = PIMG(p);
        s.querySelector('span').textContent = `${k} · ${p ? PUCKS[p][0] : T.k.none}`;
      });
      sumCfg.textContent = ['A', 'B', 'E'].map(k => sel[k] && PUCKS[sel[k]][0]).filter(Boolean).join(' · ') || '–';
    }
    function price(v, n) { odo(priceO, v); brk.textContent = `${T.k.core} ${BASE} € + ${n} × ${PUCK} €`; pv = v; }
    function pick(k, v) { if (!el.classList.contains('live')) return;
      st.P[k] = v; st.touched = true; paint({ ...st.P });
      if (!reduce) slots[k].animate([{ transform: 'scale(.86)', opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.7,.1,1)' });
      const a = pv, b = per(), t0 = performance.now(); cancelAnimationFrame(tw);
      (function step(now) { const e = reduce ? 1 : eio(cl((now - t0) / 450)); price(lerp(a, b, e), count()); if (e < 1) tw = requestAnimationFrame(step); })(t0); }
    return { id: 'cfg', dur: 5.2,
      html: () => `<div class="k">
        <div class="k-left"><div class="k-dev"><img src="assets/video/rest_4.jpg" alt="OpenPulse Gen 2" draggable="false"></div>
          <div class="k-in"><p>${T.k.inside}</p><div class="k-slots">${['A', 'B', 'E'].map(k => `<div class="k-slot" data-k="${k}"><i><img alt=""></i><span></span></div>`).join('')}</div></div></div>
        <div class="k-right"><h3 class="k-title">${T.k.title} <span>${T.k.sub}</span></h3>
          ${['A', 'B', 'E'].map(k => `<div class="k-g" data-k="${k}"><p class="k-gh"><b>${T.k.gh[k][0]}</b> ${T.k.gh[k][1]}</p>
            <div class="k-tiles">${OPTS[k].map(o => `<button type="button" class="k-t" data-v="${o || ''}" aria-pressed="false">
              <span class="k-ti">${o ? `<img src="${PIMG(o)}" alt="" draggable="false">` : '<i></i>'}</span><b>${o ? PUCKS[o][0] : T.k.none}</b><span>${o ? T.k.add : '–'}</span></button>`).join('')}</div>
            <p class="k-desc"></p></div>`).join('')}</div>
        <div class="k-bar"><div class="k-sum"><b>${T.k.name}</b><span class="k-cfg"></span></div><div class="k-price"><b>≈ ${odoHTML(3)} €</b><span><em class="k-brk"></em> · ${T.k.per}</span></div></div>
        <svg class="k-cur" viewBox="0 0 20 24" aria-hidden="true"><path d="M2 2v17l4.6-4.4 3 7 3.2-1.4-3-6.8H16z"/></svg></div>`,
      init(e) { el = e.querySelector('.k'); shown = ''; left = el.querySelector('.k-left'); bar = el.querySelector('.k-bar');
        ['A', 'B', 'E'].forEach(k => { groups[k] = el.querySelector(`.k-g[data-k="${k}"]`); tiles[k] = [...groups[k].querySelectorAll('.k-t')]; descs[k] = groups[k].querySelector('.k-desc'); slots[k] = el.querySelector(`.k-slot[data-k="${k}"]`);
          tiles[k].forEach(b => b.addEventListener('click', () => pick(k, b.dataset.v || null))); });
        priceO = el.querySelector('.odo'); brk = el.querySelector('.k-brk'); sumCfg = el.querySelector('.k-cfg'); cursor = el.querySelector('.k-cur'); },
      layout() { const sr = el.getBoundingClientRect(); if (!sr.width) return;
        SEQ.forEach(([k, p]) => { const b = tiles[k].find(x => x.dataset.v === p).getBoundingClientRect(); tc[k] = { x: b.left - sr.left + b.width * .62, y: b.top - sr.top + b.height * .58 }; }); },
      render(t) {
        const live = st.touched || t >= this.dur; el.classList.toggle('live', live);
        ['A', 'B', 'E'].forEach((k, j) => { const e = live ? 1 : eo(seg(t, .3 + j * .18, 1.1 + j * .18)); groups[k].style.opacity = e.toFixed(3); groups[k].style.transform = `translateY(${((1 - e) * 18).toFixed(1)}px)`; });
        const le = live ? 1 : eo(seg(t, 0, .9)); left.style.opacity = le.toFixed(3); left.style.transform = `scale(${lerp(.96, 1, le).toFixed(4)})`;
        bar.style.opacity = live ? 1 : seg(t, .8, 1.3).toFixed(3);
        if (live) { cursor.style.opacity = 0; paint({ ...st.P }); cancelAnimationFrame(tw); price(per(), count()); return; }
        // Vorführung: ein Zeiger wählt nacheinander Pulse, Thermo+, Air
        const sel = {}; let extra = 0, n = 0;
        SEQ.forEach(([k, p, a]) => { if (t >= a) { sel[k] = p; n++; } extra += eio(seg(t, a, a + .6)); });
        paint(sel); price(BASE + PUCK * extra, n);
        if (tc.A) { const pts = [{ x: tc.A.x + 160, y: tc.A.y + 120 }, ...SEQ.map(([k]) => tc[k])]; let x = pts[0].x, y = pts[0].y;
          SEQ.forEach(([, , a], j) => { const e = eio(seg(t, a - .75, a - .08)); x = lerp(x, pts[j + 1].x, e); y = lerp(y, pts[j + 1].y, e); });
          const press = SEQ.reduce((m, [, , a]) => Math.max(m, 1 - Math.abs(t - a) / .12), 0);
          cursor.style.opacity = (seg(t, .9, 1.2) * (1 - seg(t, 4.3, 4.7))).toFixed(3);
          cursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - .14 * cl(press)).toFixed(3)})`; }
      } };
  }

  // ── Szene 3: Pilot als Projektzeitplan ──
  function pilot() {
    let el, head, tl, dayO, stEl, ph, evs, bar, barGB, stats, statsEl, nxt, built;
    const D0 = -10, D1 = 14, x = d => (d - D0) / (D1 - D0), P0 = .9, P1 = 9.4;
    const EV = [['built', 'op', -9, 0], ['test', 'op', -6, 1], ['ship', 'op', -3, 0], ['hand', 'you', 0, 0, 1], ['dock', 'you', 3, 0], ['check', 'op', 7, 1], ['review', 'op', 14, 0, 1]];   // [Text, Spur, Tag, Reihe, links vom Punkt]
    const DOCKS = [3, 6, 9, 12, 14];
    const ez = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const dayAt = t => lerp(D0, D1, ez(seg(t, P0, P1)));
    const dl = d => d > 0 ? '+' + d : d < 0 ? '−' + -d : '0';
    return { id: 'pilot', dur: 11.2,
      html: () => `<div class="pl">
        <header class="pl-h"><div><p class="pl-k">${T.p.kick}</p><h3>${T.p.title}</h3></div><p class="pl-st"><i></i><span class="pl-dl">${T.p.day} <em class="pl-sg">−</em><b>${odoHTML(2)}</b></span><span class="pl-done">${T.p.done}</span></p></header>
        <div class="pl-tl">
          <div class="pl-ax">${[-10, -7, 0, 7, 14].map(d => `<span style="--x:${x(d)}">${T.p.day} ${dl(d)}</span>`).join('')}</div>
          ${['op', 'you'].map(l => `<div class="pl-lane" data-l="${l}"><p class="pl-ln">${l === 'op' ? `${MARK}<b>${T.p.op}</b>` : `<i></i><b>${T.p.you}</b>`}</p><div class="pl-tr">
            ${l === 'you' ? `<div class="pl-bar" style="--x0:${x(0)}"><i></i>${DOCKS.map(d => `<u style="--x:${x(d)}"></u>`).join('')}<span>${T.p.data} · <b></b></span></div>` : ''}
            ${EV.filter(e => e[1] === l).map(([k, , d, r, end]) => `<div class="pl-ev" data-k="${k}" style="--x:${x(d)};--r:${r}"${end ? ' data-end' : ''}><em>${CHECK}</em><span><small>${T.p.day} ${dl(d)}</small><span class="pl-et">${k === 'built' ? '' : T.p.ev[k]}</span></span></div>`).join('')}
          </div></div>`).join('')}
          <div class="pl-ph"><i></i></div>
        </div>
        <div class="pl-stats">${T.p.s.map((s, i) => `<div${i === 3 ? ' class="z"' : ''}><b class="pl-sv"></b><span>${s}</span></div>`).join('')}</div>
        <p class="pl-next">${T.p.next}</p></div>`,
      init(e) { el = e.querySelector('.pl'); head = el.querySelector('.pl-h'); tl = el.querySelector('.pl-tl'); dayO = el.querySelector('.pl-dl .odo'); stEl = el.querySelector('.pl-st'); ph = el.querySelector('.pl-ph');
        evs = EV.map(v => ({ v, el: el.querySelector(`.pl-ev[data-k="${v[0]}"]`) })); bar = el.querySelector('.pl-bar'); barGB = bar.querySelector('b');
        statsEl = el.querySelector('.pl-stats'); stats = [...el.querySelectorAll('.pl-sv')]; nxt = el.querySelector('.pl-next'); built = el.querySelector('.pl-ev[data-k="built"] .pl-et'); },
      layout() {},
      render(t) {
        const d = dayAt(t), sm = mqS.matches;
        built.textContent = T.p.ev.built(names());
        const he = eo(seg(t, 0, .8)); head.style.opacity = he.toFixed(3); head.style.transform = `translateY(${((1 - he) * 14).toFixed(1)}px)`;
        tl.style.opacity = seg(t, .3, .9).toFixed(3);
        odo(dayO, Math.round(Math.abs(d))); stEl.classList.toggle('neg', d < -.5); stEl.classList.toggle('end', t >= P1 + .1);
        ph.style.setProperty('--x', x(d).toFixed(4)); ph.style.opacity = (seg(t, .5, .9) * (1 - seg(t, P1 + .2, P1 + .8))).toFixed(3);
        let you = 0, op = 0;
        evs.forEach(({ v: [, l, dd], el: n }) => { const e = eo(seg(d, dd - .9, dd + .15)), on = d >= dd - .05;
          n.style.opacity = e.toFixed(3);
          n.style.transform = sm ? `translateX(${((1 - e) * -10).toFixed(1)}px)` : `translateY(${((1 - e) * 10).toFixed(1)}px) scale(${lerp(.94, 1, e).toFixed(3)})`;
          n.classList.toggle('ok', on); if (on) l === 'you' ? you++ : op++; });
        // Rohdaten wachsen nur beim Andocken (alle 3 Tage) – so arbeitet Gen 2: Speicher im Gerät, Download über USB im Dock
        const docked = DOCKS.filter(k => d >= k), lastDock = docked.length ? docked[docked.length - 1] : 0, gb = MB_DAY * 5 * lastDock / 1000;
        bar.style.setProperty('--w', cl(d / D1).toFixed(4)); bar.style.setProperty('--f', cl(lastDock / D1).toFixed(4));
        bar.style.opacity = seg(d, -.5, .5).toFixed(3);
        bar.querySelectorAll('u').forEach((u, i) => u.classList.toggle('on', d >= DOCKS[i]));
        const fmt = v => v.toLocaleString(L() === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        barGB.textContent = `≈ ${fmt(gb)} GB`;
        statsEl.style.opacity = seg(t, P1 - .2, P1 + .6).toFixed(3);
        stats[0].textContent = you; stats[1].textContent = op; stats[2].textContent = `≈ ${fmt(gb)} GB`; stats[3].textContent = T.p.bytes;
        const ne = eo(seg(t, P1 + .5, P1 + 1.2)); nxt.style.opacity = ne.toFixed(3); nxt.style.transform = `translateY(${((1 - ne) * 10).toFixed(1)}px)`;
      } };
  }

  // ── Bühne ──
  function ui() {
    const sc = scenes[st.i], done = st.t >= sc.dur;
    els.steps.forEach((b, i) => { b.classList.toggle('on', i === st.i); b.setAttribute('aria-selected', i === st.i); b.style.setProperty('--p', i < st.i ? 1 : i === st.i ? cl(st.t / sc.dur).toFixed(4) : 0); });
    els.next.classList.toggle('show', done && st.i < 2);
  }
  function frame(now) { const sc = scenes[st.i]; if (!sc) return; sc.render(Math.min(st.t, sc.dur), now); ui(); }
  const AFTER = 1.8;   // nach dem Pilot kurz stehen lassen, dann zum Kontakt
  function loop(now) {
    raf = 0; const sc = scenes[st.i]; if (!st.visible || !sc) return;
    const dt = Math.min(.05, (now - (prev || now)) / 1000); prev = now;
    if (st.playing) { st.t += dt; const end = st.i === 2 ? sc.dur + AFTER : sc.dur;
      if (st.t >= end) { st.t = end; st.playing = false; if (st.i === 2 && !st.contact) contact(true); } }
    frame(now);
    if (st.playing) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf && st.visible && st.playing) { prev = 0; raf = requestAnimationFrame(loop); } };
  function show(i, t) {
    if (st.contact) contact(false);
    st.i = i; const sc = scenes[i];
    els.scenes.forEach((e, k) => { e.hidden = k !== i; });
    els.cap.textContent = T.steps[i][1];
    els.next.firstElementChild.textContent = T.steps[Math.min(2, i + 1)][0];
    sc.layout(); st.t = reduce ? sc.dur : t; st.playing = st.t < sc.dur + (i === 2 && !reduce ? AFTER : 0);
    frame(performance.now()); kick();
  }
  const play = i => show(i, i === 1 && st.touched ? scenes[1].dur : 0);
  function contact(on) {
    st.contact = on; how.classList.toggle('ct-on', on);
    els.flow.inert = on; els.ct.inert = !on; els.ct.setAttribute('aria-hidden', String(!on));
    if (on) { st.started = true; st.playing = false; els.ct.querySelector('.cx-cfg b').textContent = `${names()} · ≈ ${per()} € ${T.k.per}`; }
  }
  function build() {
    T = TXT[L()]; scenes = [talk(), cfg(), pilot()];
    const C = T.c;
    how.innerHTML = `<div class="ws-pin"><header class="ws-head"><h2 class="ws-title" id="how-title"><span>${T.h1}</span><span class="g">${T.h2}</span></h2></header>
      <div class="ws-card"><div class="ws-in">
        <div class="ws-flow">
          <div class="ws-steps" role="tablist">${T.steps.map((s, i) => `<button type="button" role="tab" class="ws-step" data-i="${i}"><span class="ws-n">0${i + 1}</span>${s[0]}<i><b></b></i></button>`).join('')}</div>
          <div class="ws-stage">${scenes.map((sc, i) => `<div class="ws-scene ws-${sc.id}" data-i="${i}" role="tabpanel" hidden>${sc.html()}</div>`).join('')}</div>
          <div class="ws-foot"><p class="ws-cap"></p><button type="button" class="ws-next"><span></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button></div>
        </div>
        <div class="ws-ct" aria-hidden="true">
          <div class="cx"><h3 class="cx-t">${C.t}</h3><p class="cx-s">${C.s}</p>
            <form class="cx-f" novalidate>
              <p class="cx-cfg"><span>${C.cfg}</span><b></b></p>
              <div class="cx-row"><label><span>${C.name}</span><input name="name" required autocomplete="name"></label><label><span>${C.org}</span><input name="company" autocomplete="organization"></label></div>
              <label><span>${C.mail}</span><input name="email" type="email" required autocomplete="email"></label>
              <label><span>${C.msg}</span><textarea name="message" rows="3"></textarea></label>
              <div class="cx-end"><button type="button" class="cx-again">${C.again}</button><p class="cx-done" hidden></p><button type="submit" class="cx-send">${C.send}</button></div>
              <p class="cx-priv">${C.priv}</p>
            </form></div></div>
      </div></div></div>`;
    els = { pin: how.querySelector('.ws-pin'), head: how.querySelector('.ws-head'), card: how.querySelector('.ws-card'), inn: how.querySelector('.ws-in'), flow: how.querySelector('.ws-flow'), ct: how.querySelector('.ws-ct'),
      steps: [...how.querySelectorAll('.ws-step')], scenes: [...how.querySelectorAll('.ws-scene')], cap: how.querySelector('.ws-cap'), next: how.querySelector('.ws-next') };
    scenes.forEach((sc, i) => sc.init(els.scenes[i]));
    els.steps.forEach((b, i) => b.addEventListener('click', () => { st.started = true; play(i); }));
    els.next.addEventListener('click', () => play(Math.min(2, st.i + 1)));
    els.ct.querySelector('.cx-again').addEventListener('click', () => { st.touched = false; play(0); });
    const f = els.ct.querySelector('.cx-f');
    f.addEventListener('submit', e => { e.preventDefault(); let ok = true;
      f.querySelectorAll('[required]').forEach(i => { const v = i.type === 'email' ? /.+@.+\..+/.test(i.value) : i.value.trim(); i.closest('label').classList.toggle('bad', !v); if (!v) ok = false; });
      if (!ok) return;
      // Versand über Formspree; die gewählte Konfiguration geht mit
      const btn = f.querySelector('.cx-send'), msg = f.querySelector('.cx-done'), fd = new FormData(f);
      fd.append('configuration', `${names()} · ≈ ${per()} € ${T.k.per}`); fd.append('_subject', `OpenPulse: ${fd.get('company') || fd.get('name')}`); fd.append('source', 'website, how we work together');
      btn.disabled = true; btn.textContent = C.sending; msg.hidden = true; msg.classList.remove('bad');
      fetch(FORM, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(r => { if (!r.ok) throw r; msg.textContent = C.done; msg.hidden = false; btn.textContent = C.send; f.querySelectorAll('input,textarea').forEach(i => { i.value = ''; }); })
        .catch(() => { msg.textContent = C.err; msg.classList.add('bad'); msg.hidden = false; btn.disabled = false; btn.textContent = C.send; }); });
    const wasContact = st.contact; contact(false);
    expand();
    show(st.i, st.started ? Math.max(st.t, scenes[st.i].dur) : 0); if (!st.started) st.playing = false;
    if (wasContact) contact(true);
  }

  // ── Anheften und Aufziehen ──
  const RUN = .75;   // Bildschirmhöhen zum Aufziehen; danach bleibt die Bühne angeheftet (Höhe des Abschnitts in CSS)
  let vh = innerHeight, lastY = scrollY, dir = 1, glide = 0, idle = 0;
  const top0 = () => how.getBoundingClientRect().top + scrollY;
  function expand() {
    if (!els.card) return;
    const W = els.pin.clientWidth, H = els.pin.clientHeight, sm = mqS.matches;
    const e = reduce ? 1 : eio(cl((scrollY - top0()) / (vh * RUN)));
    const T0 = Math.min(H * (sm ? .3 : .38), els.head.offsetTop + els.head.offsetHeight + (sm ? 24 : 40)), S0 = sm ? 12 : Math.max(24, (W - 1240) / 2), B0 = sm ? 12 : 24;
    const t = T0 * (1 - e), s = S0 * (1 - e), b = B0 * (1 - e);
    Object.assign(els.card.style, { top: t + 'px', left: s + 'px', right: s + 'px', bottom: b + 'px', borderRadius: (28 * (1 - e)).toFixed(1) + 'px' });
    els.inn.style.transform = `translate(${-s}px, ${-t}px)`; els.inn.style.width = W + 'px'; els.inn.style.height = H + 'px';
    els.head.style.opacity = (1 - seg(e, 0, .4)).toFixed(3); els.head.style.transform = `translateY(${(-90 * e).toFixed(1)}px) scale(${lerp(1, .94, e).toFixed(4)})`;
    const r = els.pin.getBoundingClientRect(); st.visible = r.bottom > 0 && r.top < vh;
    if (!st.started && e >= .9 && st.visible) { st.started = true; play(0); }
    kick();
  }
  // Einrasten: nach dem Scrollen abwärts auf halbem Weg sanft ganz aufziehen; jede Eingabe bricht ab
  const stopGlide = () => { cancelAnimationFrame(glide); glide = 0; };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, stopGlide, { passive: true }));
  function glideTo(y) { stopGlide(); const y0 = scrollY, t0 = performance.now(), D = Math.min(800, 300 + Math.abs(y - y0) * .6);
    (function step(now) { const e = eio(cl((now - t0) / D)); scrollTo(0, lerp(y0, y, e)); glide = e < 1 ? requestAnimationFrame(step) : 0; })(t0); }
  function settle() {
    if (reduce || glide) return; const a = top0(), y = scrollY, yE = a + vh * RUN;
    if (dir > 0 && y > a - vh * .25 && y < yE - 4) glideTo(yE);
  }
  addEventListener('scroll', () => { const y = scrollY; if (Math.abs(y - lastY) > 1) dir = Math.sign(y - lastY); lastY = y; expand(); clearTimeout(idle); if (!glide) idle = setTimeout(settle, 200); }, { passive: true });
  addEventListener('resize', () => { vh = innerHeight; expand(); const sc = scenes[st.i]; if (sc) { sc.layout(); frame(performance.now()); } });
  mqS.addEventListener('change', () => build());
  document.fonts?.ready.then(() => { const sc = scenes[st.i]; if (sc) { sc.layout(); frame(performance.now()); } });
  // Links auf #contact: zum Abschnitt, aufgezogen, mit Formular
  function goContact(smooth) { contact(true); const y = top0() + vh * RUN; smooth && !reduce ? glideTo(y) : scrollTo(0, y); }
  document.addEventListener('click', e => { const a = e.target.closest('a[href="#contact"]'); if (!a) return; e.preventDefault(); goContact(true); });
  build();
  if (location.hash === '#contact') requestAnimationFrame(() => goContact(false));
  window.addEventListener('langchange', build);
  window.__how = { st, seek(i, t) { st.started = true; show(i, t); st.playing = false; st.t = t; frame(performance.now()); }, contact, expand, at: () => top0() + vh * RUN };
})();
