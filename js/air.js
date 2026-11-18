// Umgebungs-Port: Geschichten, eine nach der anderen. Je Geschichte ein Satz als Aufhänger, ein Messwert mit kleiner Kurve,
// die das Ereignis zeigt (Gasanstieg, Druckabfall …), ein Satz zur Bedeutung und welcher Puck es braucht (verfügbar / auf Anfrage).
// Reiter mit Fortschrittslinie, wechselt selbst alle 8 s, bis jemand klickt. Video spielt nur sichtbar. Werte sind Beispiele.
(function () {
  const sec = document.getElementById('air'); if (!sec) return;
  const vid = document.getElementById('air-vid'), stage = document.getElementById('air-story'), tabs = document.getElementById('air-tabs');
  const N = 64, rnd = (i, s) => Math.abs(Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1;   // feste Pseudozufallswerte (gleiche Kurve bei jedem Besuch)
  const ser = f => Array.from({ length: N }, (_, i) => f(i / (N - 1), i));
  const S = [
    { k: 'factory', av: 1, tab: { en: 'Factory', de: 'Werkhalle' },
      h: { en: 'A solvent leak in hall 3.', de: 'Ein Lösungsmittel-Leck in Halle 3.' },
      p: { en: 'The Air puck notices volatile gases rising before anyone smells them. Your system can warn the wearer and the safety team right away.',
           de: 'Der Air-Puck bemerkt aufsteigende flüchtige Gase, bevor jemand sie riecht. Ihr System kann Träger und Sicherheitsteam sofort warnen.' },
      l: { en: 'Gas index', de: 'Gas-Index' }, v: 412, d: 0, u: '', mk: { en: 'Leak', de: 'Leck' }, mx: .62,
      y: ser((t, i) => 60 + 6 * rnd(i, 1) + (t > .62 ? 352 * (1 - Math.exp(-(t - .62) * 14)) : 0)),
      puck: { en: 'Air puck', de: 'Air-Puck' } },
    { k: 'mountain', av: 1, tab: { en: 'Mountain', de: 'Berg' },
      h: { en: 'The pressure drops 4 hPa in three hours.', de: 'Der Luftdruck fällt um 4 hPa in drei Stunden.' },
      p: { en: 'A storm is on its way. The same sensor knows the altitude, and the pulse shows how the body copes with both.',
           de: 'Ein Wetterumschwung kommt. Derselbe Sensor kennt die Höhe, und der Puls zeigt, wie der Körper mit beidem zurechtkommt.' },
      l: { en: 'Air pressure · 2,100 m', de: 'Luftdruck · 2.100 m' }, v: 789.6, d: 1, u: 'hPa', mk: { en: '−4 hPa', de: '−4 hPa' }, mx: .35,
      y: ser((t, i) => 793.6 - (t > .3 ? 4 * Math.min(1, (t - .3) / .62) : 0) + .25 * rnd(i, 2)),
      puck: { en: 'Air puck', de: 'Air-Puck' } },
    { k: 'cockpit', av: 0, tab: { en: 'Cockpit', de: 'Cockpit' },
      h: { en: '11,000 metres, nine hours over the Atlantic.', de: '11.000 Meter, neun Stunden über dem Atlantik.' },
      p: { en: 'Aircrew are among the most radiation-exposed workers. A dosimeter puck logs cosmic radiation and UV for every flight, next to heart rate and sleep.',
           de: 'Flugpersonal gehört zu den am stärksten strahlenbelasteten Berufsgruppen. Ein Dosimeter-Puck zeichnet kosmische Strahlung und UV je Flug auf, neben Puls und Schlaf.' },
      l: { en: 'Radiation dose, this flight', de: 'Strahlendosis, dieser Flug' }, v: 52, d: 0, u: 'µSv', mk: { en: 'Cruise', de: 'Reiseflug' }, mx: .12,
      y: ser((t, i) => 52 * Math.max(0, Math.min(1, (t - .06) / .9)) ** 1.05 + .4 * rnd(i, 3)),
      puck: { en: 'Radiation & UV puck', de: 'Strahlungs- & UV-Puck' } },
    { k: 'kitchen', av: 1, tab: { en: 'Kitchen', de: 'Küche' },
      h: { en: 'The milk has turned.', de: 'Die Milch ist umgekippt.' },
      p: { en: 'The gas sensor in the Air puck can be trained to recognise smells. For people who have lost their sense of smell, that is a second nose.',
           de: 'Der Gassensor im Air-Puck lässt sich auf Gerüche trainieren. Für Menschen, die nichts mehr riechen, ist das eine zweite Nase.' },
      l: { en: 'Smell match: spoiled', de: 'Geruch erkannt: verdorben' }, v: 94, d: 0, u: '%', mk: { en: 'Fridge open', de: 'Kühlschrank auf' }, mx: .4,
      y: ser((t, i) => 4 + 3 * rnd(i, 4) + (t > .4 ? 87 * (1 - Math.exp(-(t - .4) * 9)) : 0)),
      puck: { en: 'Air puck, trained', de: 'Air-Puck, trainiert' } },
    { k: 'heat', av: 1, tab: { en: 'Boiler room', de: 'Kesselhaus' },
      h: { en: '34 °C and 60 % humidity.', de: '34 °C und 60 % Luftfeuchte.' },
      p: { en: 'At that humidity, sweat barely cools. Air and skin temperature together show heat stress before it turns dangerous.',
           de: 'Bei dieser Feuchte kühlt Schweiß kaum noch. Luft- und Hauttemperatur zusammen zeigen Hitzestress, bevor er gefährlich wird.' },
      l: { en: 'Heat index', de: 'Hitzeindex' }, v: 43, d: 0, u: '°C', mk: { en: 'Shift starts', de: 'Schichtbeginn' }, mx: .18,
      y: ser((t, i) => 27 + 16 * (1 - Math.exp(-Math.max(0, t - .18) * 4)) + .4 * rnd(i, 5)),
      puck: { en: 'Air puck', de: 'Air-Puck' } },
    { k: 'yours', av: 0, q: 1, tab: { en: 'Your sensor', de: 'Ihr Sensor' },
      h: { en: 'What should your wearable notice?', de: 'Was soll Ihr Wearable bemerken?' },
      p: { en: 'Tell us what your application needs to measure around the wearer. We check whether it fits a puck and build it for the same port and the same API.',
           de: 'Sagen Sie uns, was Ihre Anwendung rund um den Träger messen soll. Wir prüfen, ob es in einen Puck passt, und bauen ihn für denselben Port und dieselbe API.' },
      i: { en: ['CO₂', 'Fine dust', 'Ozone', 'Pollen', 'Magnetic field', 'Water contact'], de: ['CO₂', 'Feinstaub', 'Ozon', 'Pollen', 'Magnetfeld', 'Wasserkontakt'] },
      puck: { en: 'Your puck', de: 'Ihr Puck' } },
  ];
  const T = { en: { av: 'Available', rq: 'On request', qc: 'Talk to us', ih: 'For example' }, de: { av: 'Verfügbar', rq: 'Auf Anfrage', qc: 'Mit uns sprechen', ih: 'Zum Beispiel' } };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, DUR = 8000;
  let idx = 0, auto = true, seen = false, t0 = performance.now(), raf = 0;
  const lang = () => (window.OP_LANG || document.documentElement.lang) === 'de' ? 'de' : 'en';   // OP_LANG steht schon beim Laden fest, das lang-Attribut erst nach DOMContentLoaded
  const fmt = (v, d) => v.toLocaleString(lang() === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  function curve(s) {
    const W = 360, H = 86, lo = Math.min(...s.y), hi = Math.max(...s.y), pad = (hi - lo) * .12 || 1;
    const X = i => i / (N - 1) * W, Y = v => H - 6 - (v - lo + pad) / (hi - lo + 2 * pad) * (H - 12);
    const d = s.y.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const mx = s.mx * W;
    return `<svg class="air-sv" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">` +
      `<line x1="${mx}" x2="${mx}" y1="0" y2="${H}" class="mk"/><path d="${d} L ${W} ${H} L 0 ${H} Z" class="ar"/><path d="${d}" class="ln" pathLength="1"/>` +
      `<circle cx="${W}" cy="${Y(s.y[N - 1]).toFixed(1)}" r="3.2" class="dt"/></svg><span class="air-mk" style="left:${s.mx * 100}%">${s.mk[lang()]}</span>`;
  }
  function buildTabs() {
    const g = lang();
    tabs.innerHTML = S.map((s, i) => `<button type="button" role="tab" data-i="${i}"><i><b></b></i><span>${s.tab[g]}</span></button>`).join('');
    tabs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { auto = false; show(+b.dataset.i); }));
  }
  function show(i) {
    idx = i; t0 = performance.now(); const s = S[i], g = lang(), t = T[g];
    tabs.querySelectorAll('button').forEach((b, j) => { b.classList.toggle('on', j === i); b.classList.toggle('done', j < i && auto); b.setAttribute('aria-selected', j === i); });
    const ob = tabs.querySelector('button.on'); if (ob && tabs.scrollWidth > tabs.clientWidth) tabs.scrollTo({ left: ob.offsetLeft - (tabs.clientWidth - ob.offsetWidth) / 2, behavior: 'smooth' });
    const tag = `<span class="air-tag">${s.puck[g]} · ${s.av ? t.av : t.rq}</span>`;
    const right = s.q
      ? `<div class="air-card q"><span class="air-l">${t.ih}</span><span class="air-ideas">${s.i[g].map(x => `<span>${x}</span>`).join('')}</span><a class="air-cta" href="#contact">${t.qc} →</a></div>`
      : `<div class="air-card"><span class="air-l">${s.l[g]}</span><b class="air-v"><i>${fmt(s.v, s.d)}</i><small>${s.u}</small></b><div class="air-cv">${curve(s)}</div></div>`;
    stage.innerHTML = `<div class="air-txt"><h3>${s.h[g]}</h3>${tag}</div>${right}`;
    stage.classList.remove('in'); void stage.offsetWidth; stage.classList.add('in');
    const el = stage.querySelector('.air-v i'); cancelAnimationFrame(raf);
    if (el && !reduce) {   // Wert zählt mit der Kurve hoch
      const a = performance.now(), from = s.y[0];
      const st = now => { const u = Math.min(1, (now - a) / 1600), e = 1 - Math.pow(1 - u, 3); el.textContent = fmt(from + (s.v - from) * e, s.d); if (u < 1) raf = requestAnimationFrame(st); };
      raf = requestAnimationFrame(st);
    }
  }
  function loop(now) {   // Fortschrittslinie im aktiven Reiter; nach DUR nächste Geschichte
    const b = tabs.querySelector('button.on b');
    if (b) b.style.transform = `scaleX(${auto ? Math.min(1, (now - t0) / DUR) : 1})`;
    if (auto && seen && !reduce && now - t0 > DUR) show((idx + 1) % S.length);
    if (!seen) t0 = now - Math.min(now - t0, DUR * .98);
    requestAnimationFrame(loop);
  }
  new IntersectionObserver(e => {
    seen = e[0].isIntersecting;
    if (seen && !reduce) vid.play().catch(() => {}); else vid.pause();
  }, { threshold: .3 }).observe(sec);
  // Telefon: Geschichte wischen = nächste / vorige (wie Story-Karten)
  let sx = null, sy = 0;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { auto = false; show((idx + (dx < 0 ? 1 : S.length - 1)) % S.length); }
  });
  window.addEventListener('langchange', () => { buildTabs(); show(idx); });
  buildTabs(); show(0); requestAnimationFrame(loop);
})();
