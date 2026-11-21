// Abschnitt „Jedes Signal. Roh. Ihres.“: gekippte Karten-Bühne (Maße nach vexoai.com) mit sechs realistischen
// Programmfenstern, in denen die Rohdaten eines Geräts ankommen: Live-Fenster, Python-Notebook, Tabelle, Terminal,
// EDF/BDF-Viewer, Assistent per MCP. Kurven werden auf Canvas gezeichnet; Kanäle und Raten nach docs/GEN2_SPEC.md O5
// (PPG 2 PD × 3 LED × 100 Hz × 24 bit, IMU 6 × 50 Hz × 16 bit, Thermo 1 Hz, Air alle 3 s). Signale sind hier erzeugt
// (plausible Form, keine Messung). Darunter tippt die passende Anfrage; Wechsel alle 8 s, Reiter, Klick, Pfeile, Wischen.
(function () {
  const stage = document.getElementById('api-stage'); if (!stage) return;
  const tabs = document.getElementById('api-tabs'), capL = document.getElementById('api-cap-l');
  const capT = document.querySelector('#api-cap-t .typed');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t_ = k => (window.I18N?.[window.OP_LANG] || window.I18N.en)[k];
  const HOLD = 8000, CW = 720, CH = 500;   // Kartengröße in Layout-Pixeln (wird als Ganzes skaliert)

  // ── Signale (deterministisch aus t in s) ──
  const TAU = Math.PI * 2;
  const phase = t => ((63 * t - 3 * 4.2 / TAU * Math.cos(TAU * t / 4.2) - 2 * 37 / TAU * Math.cos(TAU * t / 37)) / 60) % 1;
  const beat = u => -(Math.exp(-Math.pow((u - .16) / .055, 2)) + .42 * Math.exp(-Math.pow((u - .40) / .075, 2)) + .08 * Math.exp(-Math.pow((u - .62) / .12, 2)));
  const nz = (t, k) => { const x = Math.sin(t * 12.9898 * k + k * 78.233) * 43758.5453; return x - Math.floor(x) - .5; };
  const resp = t => Math.sin(TAU * t / 4.2);
  const ppg = (base, amp, wander, k) => t => Math.round(base + amp * beat(phase(t)) + wander * resp(t) + 46 * nz(t, k));
  const SIG = {
    'ppg.green.pd1': ppg(182400, 2600, 320, 1), 'ppg.green.pd2': ppg(176900, 2300, 290, 2), 'ppg.red.pd1': ppg(241300, 880, 260, 3),
    'ppg.red.pd2': ppg(236800, 790, 240, 4), 'ppg.ir.pd1': ppg(263100, 1400, 300, 5), 'ppg.ir.pd2': ppg(258700, 1260, 280, 6),
    'acc.x': t => .021 + .012 * Math.sin(TAU * t / 3.1) + .004 * Math.sin(TAU * t * 1.3) + .0015 * nz(t, 7),
    'acc.y': t => -.143 + .009 * Math.sin(TAU * t / 5.3) + .0015 * nz(t, 8),
    'acc.z': t => -.987 + .006 * resp(t) + .003 * Math.sin(TAU * t * .9) + .0015 * nz(t, 9),
    'gyro.x': t => 1.8 * Math.sin(TAU * t / 2.7) + .9 * nz(t, 10), 'gyro.y': t => -.7 + 1.1 * Math.sin(TAU * t / 4.1) + .9 * nz(t, 11),
    'gyro.z': t => .4 * Math.sin(TAU * t / 6) + .9 * nz(t, 12),
    'skin.temp1': t => Math.round((33.42 + .06 * Math.sin(TAU * t / 90) + .01 * nz(Math.floor(t), 13)) / .0078125) * .0078125,
    'skin.temp2': t => Math.round((33.17 + .05 * Math.sin(TAU * t / 110) + .01 * nz(Math.floor(t), 14)) / .0078125) * .0078125,
    'air.temp': t => 23.81 + .04 * Math.sin(t / 60), 'air.humidity': t => 41.6 + .3 * Math.sin(t / 45) + .05 * nz(Math.floor(t / 3), 15),
    'air.pressure': t => 1013.24 + .02 * Math.sin(t / 80) + .008 * nz(Math.floor(t / 3), 16), 'air.gas': t => 142.3 + 3.1 * Math.sin(t / 50) + .6 * nz(Math.floor(t / 3), 17),
  };
  const FS = id => id.startsWith('ppg') ? 100 : /^(acc|gyro)/.test(id) ? 50 : id.startsWith('skin') ? 1 : 1 / 3;
  const UNIT = id => id.startsWith('ppg') ? 'counts' : id.startsWith('acc') ? 'g' : id.startsWith('gyro') ? '°/s' : id.endsWith('humidity') ? '%RH' : id.endsWith('pressure') ? 'hPa' : id.endsWith('gas') ? 'kΩ' : '°C';
  const COL = id => id.startsWith('ppg') ? '#cf3826' : /^(acc|gyro)/.test(id) ? '#101f3c' : id.startsWith('skin') ? '#b8892f' : '#3c6ea6';
  const fmtV = (id, v) => { const u = UNIT(id); return u === 'counts' ? String(Math.round(v)) : u === 'g' ? v.toFixed(3) : u === '°/s' ? v.toFixed(2) : u === 'hPa' ? v.toFixed(2) : id.startsWith('skin') ? v.toFixed(4) : v.toFixed(2); };
  const at = (id, t) => SIG[id](Math.floor(t * FS(id)) / FS(id));
  // Artefakte in der Nacht (für MCP und EDF): Bewegung lässt das IR-Signal anschlagen
  const ART = [[61, 68], [244, 257], [452, 459]];   // Sekunden ab 02:55
  const night = (id, t) => {        // t = Sekunden ab 02:55:00
    let v = SIG[id](t + 9000), m = 0;
    ART.forEach(([a, b]) => { if (t > a && t < b) m = Math.sin(Math.PI * (t - a) / (b - a)); });
    if (id.startsWith('ppg')) v += m * (5200 * Math.sin(TAU * t * .9) + 3000 * nz(t, 31));
    if (id.startsWith('acc')) v += m * (.35 * Math.sin(TAU * t * 1.7 + id.length) + .1 * nz(t, 32));
    return v;
  };

  // ── Zeichnen ──
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', SANS = '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';
  function prep(cv) {
    const w = cv.clientWidth, h = cv.clientHeight, d = Math.min(2, devicePixelRatio || 1) * 1.15;
    if (!w || !h) return null;
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h); return { c, w, h };
  }
  // Linie f(t) über [t0, t1] in Rechteck (x, y, w, h), min/max je Pixel bei vielen Werten; gibt [lo, hi] zurück
  function trace(c, f, fs, t0, t1, x, y, w, h, o = {}) {
    const n = Math.ceil((t1 - t0) * fs) + 1, pts = [];
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) { const t = Math.floor(t0 * fs) / fs + i / fs; const v = f(t); pts.push([t, v]); if (t >= t0) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    if (o.lo != null) { lo = o.lo; hi = o.hi; }
    if (o.min && hi - lo < o.min) { const m = (hi + lo) / 2; lo = m - o.min / 2; hi = m + o.min / 2; }
    const p = (hi - lo) * (o.pad ?? .12); lo -= p; hi += p;
    const X = t => x + (t - t0) / (t1 - t0) * w, Y = v => y + h - (v - lo) / (hi - lo) * h;
    c.save(); c.beginPath(); c.rect(x, y - 2, w, h + 4); c.clip();
    c.strokeStyle = o.col || '#101f3c'; c.lineWidth = o.lw || 1.2; c.lineJoin = 'round'; c.beginPath();
    if (o.step) { pts.forEach(([t, v], i) => { const xx = X(t), yy = Y(v); if (i) { c.lineTo(xx, Y(pts[i - 1][1])); c.lineTo(xx, yy); } else c.moveTo(xx, yy); }); }
    else if (n > w * 2) {
      const per = n / w;
      for (let px = 0; px < w; px++) {
        let a = Infinity, b = -Infinity; for (let j = Math.floor(px * per); j < Math.min(n, Math.floor((px + 1) * per) + 1); j++) { a = Math.min(a, pts[j][1]); b = Math.max(b, pts[j][1]); }
        if (px) c.lineTo(x + px, Y(a)); else c.moveTo(x + px, Y(a)); c.lineTo(x + px, Y(b));
      }
    } else pts.forEach(([t, v], i) => i ? c.lineTo(X(t), Y(v)) : c.moveTo(X(t), Y(v)));
    c.stroke();
    if (o.dots) { c.fillStyle = o.col; pts.forEach(([t, v]) => { if (t >= t0) { c.beginPath(); c.arc(X(t), Y(v), 1.9, 0, TAU); c.fill(); } }); }
    c.restore(); return [lo, hi, Y];
  }
  const clockAt = t => { const d = new Date(Date.UTC(2026, 10, 14, 9, 41, 7) + t * 1000); return d.toISOString().slice(11, 23); };
  const hms = s => { const x = Math.floor(s); return [Math.floor(x / 3600) % 24, Math.floor(x / 60) % 60, x % 60].map(v => String(v).padStart(2, '0')).join(':'); };
  const sp = n => n.toLocaleString('en-US').replace(/,/g, ' ');

  // ── Die sechs Fenster ──
  const bar = (title, right = '') => `<div class="w-bar"><span class="w-dots"><i></i><i></i><i></i></span><span class="w-t">${title}</span>${right}</div>`;
  const LIVE_SEL = ['ppg.green.pd1', 'ppg.ir.pd1', 'acc.z', 'skin.temp1'];
  const GROUPS = [['Pulse', 'Port A', '100 Hz · 24 bit', ['ppg.green.pd1', 'ppg.green.pd2', 'ppg.red.pd1', 'ppg.red.pd2', 'ppg.ir.pd1', 'ppg.ir.pd2']],
    ['IMU', 'Core', '50 Hz · 16 bit', ['acc.x', 'acc.y', 'acc.z', 'gyro.x', 'gyro.y', 'gyro.z']], ['Thermo+', 'Port B', '1 Hz · 16 bit', ['skin.temp1', 'skin.temp2']],
    ['Air', 'Port E', '1 / 3 s · 20 bit', ['air.temp', 'air.humidity', 'air.pressure', 'air.gas']]];
  const nbRows = () => { const r = []; for (let i = 0; i < 6; i++) { const t = 10800 + i / 100; r.push([hms(t) + '.' + String(i * 10).padStart(3, '0'), SIG['ppg.green.pd1'](t), SIG['ppg.ir.pd1'](t), i % 2 ? 'NaN' : SIG['acc.z'](t).toFixed(4)]); } return r; };
  const xlRows = () => { const r = []; for (let i = 0; i < 17; i++) { const t = 10800 + i / 100; r.push([String(Math.round((Date.UTC(2026, 10, 14, 3, 0, 0) / 1000 + i / 100) * 1e6)), ...['ppg.green.pd1', 'ppg.green.pd2', 'ppg.red.pd1', 'ppg.red.pd2', 'ppg.ir.pd1', 'ppg.ir.pd2'].map(id => SIG[id](t))]); } return r; };

  const SCREENS = [
    { key: 'live', tab: 'api.t1', lab: 'api.l1', mono: true, q: () => 'op.stream(["ppg.*", "acc.*", "skin.*", "air.*"])   # 100 Hz · 24 bit',
      html: () => `<div class="ui ui-live">${bar('op-2F41', '<span class="w-r"><i class="ok"></i>USB-C · local · no cloud</span>')}
        <div class="lv"><aside class="lv-side">${GROUPS.map(([n, p, r, ids]) => `<div class="lv-g"><div class="lv-gh"><i style="background:${COL(ids[0])}"></i><b>${n}</b><span>${p}</span></div><div class="lv-gm">${r}</div>
          ${ids.map(id => `<div class="lv-c${LIVE_SEL.includes(id) ? ' on' : ''}" style="--c:${COL(id)}"><i></i><span>${id}</span><output data-v="${id}"></output></div>`).join('')}</div>`).join('')}</aside>
        <div class="lv-m"><div class="lv-tools"><span class="seg"><b class="on"><i class="rec"></i>Live</b><b>24 h</b></span><span class="lv-clk" data-clock></span><span class="lv-rate">4 / 18 ch · 0.70 of 2.41 kB/s</span></div>
        <canvas data-plot></canvas></div></div></div>`,
      draw(el, t) {
        const cv = el.querySelector('canvas'), g = prep(cv); if (!g) return; const { c, w, h } = g;
        const x0 = 64, x1 = w - 70, pw = x1 - x0, lh = (h - 22) / LIVE_SEL.length, span = 8;
        c.font = `500 9.5px ${MONO}`; c.textBaseline = 'middle';
        c.strokeStyle = 'rgba(18,20,23,.06)'; c.fillStyle = '#9aa0a6'; c.textAlign = 'center';
        for (let s = Math.ceil(t - span); s <= t; s++) { const x = Math.round(x0 + (s - t + span) / span * pw) + .5; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h - 22); c.stroke(); const k = s - Math.round(t); if (k % 2 === 0) c.fillText(k ? k + ' s' : 'now', x, h - 10); }
        LIVE_SEL.forEach((id, i) => {
          const y = i * lh; if (i) { c.strokeStyle = 'rgba(18,20,23,.09)'; c.beginPath(); c.moveTo(0, Math.round(y) + .5); c.lineTo(w, Math.round(y) + .5); c.stroke(); }
          c.textAlign = 'left'; c.fillStyle = COL(id); c.fillRect(x0, y + 9, 5, 5); c.fillStyle = '#1d2228'; c.font = `600 10px ${MONO}`; c.fillText(id, x0 + 10, y + 12);
          const nw = c.measureText(id).width; c.font = `500 9.5px ${MONO}`; c.fillStyle = '#a5aab0'; c.fillText(`${UNIT(id)} · ${FS(id) >= 1 ? FS(id) + ' Hz' : '1/3 Hz'}`, x0 + 18 + nw, y + 12);
          const slow = FS(id) < 50;
          const [lo, hi, Y] = trace(c, SIG[id], FS(id), t - span, t, x0, y + 24, pw, lh - 32, { col: COL(id), lw: slow ? 1.5 : 1.25, step: slow, dots: slow, min: { counts: 900, g: .05, '°C': .06 }[UNIT(id)] });
          c.textAlign = 'right'; c.fillStyle = '#a5aab0'; [lo + (hi - lo) * .2, lo + (hi - lo) * .8].forEach(v => c.fillText(fmtV(id, v), x0 - 8, Y(v)));
          c.textAlign = 'left'; c.fillStyle = '#1d2228'; c.font = `600 10px ${MONO}`; const v = at(id, t); c.fillText(fmtV(id, v), x1 + 9, Y(v)); c.font = `500 9.5px ${MONO}`;
        });
        el.querySelectorAll('[data-v]').forEach(o => o.textContent = fmtV(o.dataset.v, at(o.dataset.v, t)));
        const ck = el.querySelector('[data-clock]'); if (ck) ck.textContent = clockAt(t) + ' UTC';
      }, live: true },

    { key: 'py', tab: 'api.t2', lab: 'api.l2', mono: true, q: () => 'df = dev.raw(["ppg.green.pd1", "ppg.ir.pd1", "acc.z"], start="22:00", end="06:00")',
      html: () => `<div class="ui ui-nb">${bar('raw_last_night.ipynb', '<span class="w-r"><i class="ok"></i>Python 3.12 · idle</span>')}
        <div class="nb">
          <div class="nb-c"><span class="nb-p">[1]:</span><pre><b>import</b> openpulse <b>as</b> op
dev = op.Device.usb()                <i># local, no account, no upload</i>
df = dev.raw([<q>"ppg.green.pd1"</q>, <q>"ppg.ir.pd1"</q>, <q>"acc.z"</q>],
             start=<q>"2026-11-13 22:00"</q>, end=<q>"2026-11-14 06:00"</q>)
df.loc[<q>"03:00"</q>:].head(<n>6</n>)</pre></div>
          <div class="nb-o"><span class="nb-p o">[1]:</span><div><table><thead><tr><th>t (UTC)</th><th>ppg.green.pd1</th><th>ppg.ir.pd1</th><th>acc.z</th></tr></thead>
            <tbody>${nbRows().map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td${r[3] === 'NaN' ? ' class="na"' : ''}>${r[3]}</td></tr>`).join('')}</tbody></table>
            <p class="nb-dim">2 880 000 rows × 3 columns · acc.z at its native 50 Hz</p></div></div>
          <div class="nb-c"><span class="nb-p">[2]:</span><pre>df[<q>"ppg.green.pd1"</q>][<q>"03:00:00"</q>:<q>"03:00:06"</q>].plot(figsize=(<n>9</n>, <n>2.4</n>))</pre></div>
          <div class="nb-o"><span class="nb-p o">[2]:</span><canvas data-plot></canvas></div>
        </div></div>`,
      draw(el) {
        const g = prep(el.querySelector('canvas')); if (!g) return; const { c, w, h } = g;
        const x0 = 58, y0 = 8, pw = w - x0 - 30, ph = h - 30;
        const [lo, hi, Y] = trace(c, SIG['ppg.green.pd1'], 100, 10800, 10806, x0, y0, pw, ph, { col: '#1f5fa8', lw: 1.3, pad: .08 });
        c.strokeStyle = '#1d2228'; c.lineWidth = 1; c.strokeRect(x0 + .5, y0 + .5, pw, ph);
        c.font = `10px ${SANS}`; c.fillStyle = '#1d2228'; c.textBaseline = 'middle';
        c.textAlign = 'right'; for (let v = Math.ceil(lo / 1000) * 1000; v <= hi; v += 1000) { const yy = Y(v); c.beginPath(); c.moveTo(x0 - 3, yy); c.lineTo(x0, yy); c.stroke(); c.fillText(v, x0 - 6, yy); }
        c.textAlign = 'center'; for (let s = 0; s <= 6; s++) { const xx = x0 + s / 6 * pw; c.beginPath(); c.moveTo(xx, y0 + ph); c.lineTo(xx, y0 + ph + 3); c.stroke(); c.fillText('03:00:0' + s, xx, y0 + ph + 13); }
      } },

    { key: 'xl', tab: 'api.t3', lab: 'api.l3', mono: true, q: () => 'GET /v1/devices/op-2F41/raw?channels=ppg.*&from=2026-11-14T00:00Z&format=csv',
      html: () => { const rows = xlRows(), cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        return `<div class="ui ui-xl">${bar('op-2F41_2026-11-14_pulse.csv')}
        <div class="xl-rib"><span class="xl-b">B</span><span class="xl-b i">I</span><span class="xl-b u">U</span><span class="xl-sep"></span><span class="xl-dd">Calibri</span><span class="xl-dd s">11</span><span class="xl-sep"></span><span class="xl-dd">General</span><span class="xl-b">Σ</span><span class="xl-b">%</span></div>
        <div class="xl-fx"><span class="xl-ref">C8</span><span class="xl-fi">fx</span><span>${rows[6][2]}</span></div>
        <div class="xl-g"><table><thead><tr><th></th>${cols.map(c => `<th${c === 'C' ? ' class="hl"' : ''}>${c}</th>`).join('')}</tr></thead><tbody>
          <tr><th>1</th><td class="h">t_us</td>${['ppg.green.pd1', 'ppg.green.pd2', 'ppg.red.pd1', 'ppg.red.pd2', 'ppg.ir.pd1', 'ppg.ir.pd2'].map(n => `<td class="h">${n}</td>`).join('')}<td></td></tr>
          ${rows.map((r, i) => `<tr><th${i === 6 ? ' class="hl"' : ''}>${i + 2}</th>${r.map((v, j) => `<td class="${j ? 'n' : 'n t'}${i === 6 && j === 1 ? ' sel' : ''}">${v}</td>`).join('')}<td></td></tr>`).join('')}
        </tbody></table></div>
        <div class="xl-st"><span class="xl-tab on">op-2F41_2026-11-14_pulse</span><span class="xl-tab">+</span><span class="xl-s">Ready</span><span class="xl-s r">Count: 8 640 000 · 100 rows per second</span></div></div>`; } },

    { key: 'term', tab: 'api.t4', lab: 'api.l4', mono: true, q: () => 'op export op-2F41 --from 2026-11-13 --format parquet,bdf --out ./raw',
      html: () => `<div class="ui ui-term">${bar('study — zsh — 104×30')}
        <pre class="tm"><span class="tl"><u>~/study</u> <b>$</b> op devices</span>
<span class="tl"><s>op-2F41</s>  Gen 2   USB-C   Pulse·A  Thermo+·B  Air·E   stored 21 h  <g>●</g></span>
<span class="tl"><u>~/study</u> <b>$</b> op export op-2F41 --from 2026-11-13 --format parquet,bdf --out ./raw</span>
<span class="tl">  pulse    ppg.* ×6      100 Hz  24 bit  <span class="pb"><span></span></span>  7 560 000 / ch</span>
<span class="tl">  imu      acc,gyro ×6    50 Hz  16 bit  <span class="pb"><span></span></span>  3 780 000 / ch</span>
<span class="tl">  thermo   skin ×2         1 Hz  16 bit  <span class="pb"><span></span></span>      75 600 / ch</span>
<span class="tl">  air      ×4            1/3 Hz  20 bit  <span class="pb"><span></span></span>      25 200 / ch</span>
<span class="tl">  <g>✓</g> written to ./raw in 13 s     <i>local only · no network used</i></span>
<span class="tl"><u>~/study</u> <b>$</b> ls -lh raw/</span>
<span class="tl">-rw-r--r--  1 lab  staff    98M 14 Nov 09:40  op-2F41_pulse.parquet</span>
<span class="tl">-rw-r--r--  1 lab  staff    26M 14 Nov 09:40  op-2F41_imu.parquet</span>
<span class="tl">-rw-r--r--  1 lab  staff   0.6M 14 Nov 09:40  op-2F41_thermo_air.parquet</span>
<span class="tl">-rw-r--r--  1 lab  staff    96M 14 Nov 09:41  op-2F41_night.bdf</span>
<span class="tl"><u>~/study</u> <b>$</b> curl -s "localhost:8473/v1/devices/op-2F41/raw?channels=ppg.ir.pd1&amp;format=csv" | head -5</span>
<span class="tl">t_us,ppg.ir.pd1</span>
${[0, 1, 2, 3].map(i => `<span class="tl">${Math.round((Date.UTC(2026, 10, 14, 9, 41, 7) / 1000 + i / 100) * 1e6)},${SIG['ppg.ir.pd1'](40 + i / 100)}</span>`).join('\n')}
<span class="tl"><u>~/study</u> <b>$</b> <span class="cur"></span></span></pre></div>` },

    { key: 'edf', tab: 'api.t5', lab: 'api.l5', mono: true, q: () => 'GET /v1/devices/op-2F41/raw?from=2026-11-13T22:00Z&to=2026-11-14T06:00Z&format=bdf',
      html: () => `<div class="ui ui-edf">${bar('op-2F41_night_2026-11-13.bdf — Signal viewer')}
        <div class="ed-menu"><span>File</span><span>View</span><span>Montage</span><span>Filter</span><span>Tools</span><span>Window</span></div>
        <div class="ed-bar"><span class="ed-btn">◀</span><span class="ed-btn">▶</span><span class="ed-f"><em>Montage</em>PPG + motion</span><span class="ed-f"><em>Page</em>30 s</span><span class="ed-f"><em>Filter</em>none</span><span class="ed-time" data-clock></span></div>
        <canvas data-plot></canvas>
        <div class="ed-st"><span>BDF+ · 8 signals · 24 bit · 100 Hz / 50 Hz / 1 Hz</span><span>Start 2026-11-13 22:00:00 · Duration 08:00:00</span></div></div>`,
      draw(el, t) {
        const g = prep(el.querySelector('canvas')); if (!g) return; const { c, w, h } = g;
        const L = ['ppg.ir.pd1', 'ppg.red.pd1', 'ppg.green.pd1', 'acc.x', 'acc.y', 'acc.z', 'skin.temp1'], lx = 92, top = 20, rh = (h - top - 4) / L.length;
        const pg = 30, start = 228 + (t * 1.1) % 44;     // Seite läuft langsam durch (Wiedergabe)
        c.fillStyle = '#fbfbfa'; c.fillRect(lx, 0, w - lx, h); c.fillStyle = '#f1efeb'; c.fillRect(0, 0, lx, h);
        c.font = `500 9px ${MONO}`; c.textBaseline = 'middle';
        // Zeitlineal + Sekundenraster
        for (let s = Math.ceil(start); s <= start + pg; s++) {
          const x = Math.round(lx + (s - start) / pg * (w - lx)) + .5, five = s % 5 === 0;
          c.strokeStyle = five ? 'rgba(18,20,23,.16)' : 'rgba(18,20,23,.06)'; c.setLineDash(five ? [] : [1, 2]); c.beginPath(); c.moveTo(x, top); c.lineTo(x, h); c.stroke();
          if (five) { c.fillStyle = '#4c535a'; c.textAlign = 'center'; c.fillText(hms(10500 + s), x, 9); }
        }
        c.setLineDash([]); c.strokeStyle = 'rgba(18,20,23,.2)'; c.beginPath(); c.moveTo(lx, top - .5); c.lineTo(w, top - .5); c.stroke();
        // Artefakt-Markierung
        ART.forEach(([a, b]) => { const xa = lx + (a - start) / pg * (w - lx), xb = lx + (b - start) / pg * (w - lx); if (xb > lx && xa < w) { c.fillStyle = 'rgba(207,56,38,.07)'; c.fillRect(Math.max(lx, xa), top, Math.min(w, xb) - Math.max(lx, xa), h - top); } });
        L.forEach((id, i) => {
          const y = top + i * rh;
          c.strokeStyle = 'rgba(18,20,23,.08)'; c.beginPath(); c.moveTo(0, Math.round(y + rh) + .5); c.lineTo(w, Math.round(y + rh) + .5); c.stroke();
          c.textAlign = 'left'; c.fillStyle = '#1d2228'; c.font = `600 9.5px ${MONO}`; c.fillText(id, 8, y + rh / 2 - 6);
          c.fillStyle = '#9aa0a6'; c.font = `500 8.5px ${MONO}`; c.fillText(UNIT(id) === 'counts' ? '±4000 cnt' : UNIT(id) === 'g' ? '±0.5 g' : '±0.2 °C', 8, y + rh / 2 + 7);
          const range = { counts: 8000, g: 1, '°C': .4 }[UNIT(id)], f = s => night(id, s);
          const mid = f(start + 1) ;
          trace(c, f, FS(id), start, start + pg, lx, y + 4, w - lx, rh - 8, { col: '#14213f', lw: .9, lo: mid - range / 2, hi: mid + range / 2, pad: 0, step: FS(id) < 50 });
        });
        const ck = el.querySelector('[data-clock]'); if (ck) ck.textContent = hms(10500 + start) + ' – ' + hms(10500 + start + pg);
      }, live: true },

    { key: 'mcp', tab: 'api.t6', lab: 'api.l6', mono: false, q: () => t_('api.q6'),
      html: () => `<div class="ui ui-mcp">${bar('Assistant', '<span class="w-r"><i class="ok"></i>openpulse · local MCP server</span>')}
        <div class="mc">
          <div class="mc-u">${t_('api.q6')}</div>
          <div class="mc-tool"><div class="mc-th"><i class="spin"></i><b>openpulse.raw</b><span>local</span></div>
            <pre>{ <k>"channels"</k>: [<q>"ppg.ir.pd1"</q>, <q>"acc.x"</q>, <q>"acc.y"</q>, <q>"acc.z"</q>],
  <k>"start"</k>: <q>"2026-11-14T02:55:00Z"</q>, <k>"end"</k>: <q>"2026-11-14T03:05:00Z"</q> }</pre>
            <div class="mc-res">→ 60 000 + 3 × 30 000 samples · 100 / 50 Hz · raw counts and g · stayed on this computer</div></div>
          <div class="mc-a"><p>${t_('api.a6')}</p><canvas data-plot></canvas></div>
          <div class="mc-in">Reply…<span>↑</span></div>
        </div></div>`,
      draw(el) {
        const g = prep(el.querySelector('canvas')); if (!g) return; const { c, w, h } = g;
        const x0 = 4, pw = w - 8, ph = h - 18;
        ART.forEach(([a, b]) => { c.fillStyle = 'rgba(207,56,38,.10)'; c.fillRect(x0 + a / 600 * pw, 0, (b - a) / 600 * pw, ph); c.fillStyle = '#cf3826'; c.fillRect(x0 + a / 600 * pw, 0, (b - a) / 600 * pw, 2); });
        trace(c, s => night('ppg.ir.pd1', s), 100, 0, 600, x0, 4, pw, ph - 6, { col: '#14213f', lw: 1, pad: .05 });
        c.font = `500 9px ${MONO}`; c.fillStyle = '#9aa0a6'; c.textBaseline = 'middle'; c.textAlign = 'center';
        ['02:55', '02:57', '02:59', '03:01', '03:03', '03:05'].forEach((s, i) => c.fillText(s, x0 + 10 + i / 5 * (pw - 20), h - 6));
      } },
  ];

  // ── Bühne ──
  const n = SCREENS.length, N = n * 2;
  let cards = [], cur = 0;
  const mod = (a, m) => ((a % m) + m) % m;
  const off = i => { let d = mod(i - cur, N); if (d > N / 2) d -= N; return d; };
  const nearestOf = k => { let best = cur, bd = 99; for (let j = cur - n; j <= cur + n; j++) if (mod(j, n) === k && Math.abs(j - cur) < bd) { bd = Math.abs(j - cur); best = j; } return best; };
  function build() {
    stage.innerHTML = ''; tabs.innerHTML = '';
    cards = Array.from({ length: N }, (_, i) => {
      const sc = SCREENS[i % n], el = document.createElement('div');
      el.className = 'api-card'; el.dataset.k = sc.key; el.innerHTML = `<div class="api-card-in">${sc.html()}<span class="glare"></span></div>`;
      el.addEventListener('click', () => { const d = off(i); if (d) go(cur + d); });
      stage.appendChild(el); return el;
    });
    SCREENS.forEach((sc, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.innerHTML = `<span>${t_(sc.tab)}</span><i></i>`; b.addEventListener('click', () => go(nearestOf(i))); tabs.appendChild(b);
    });
  }
  let k = 1;
  function layout() {
    // Maße wie die Vorlage: vordere Karte ≈ 29 % der Breite, durch die Höhe begrenzt; Nachbarn deutlich angewinkelt
    const W = stage.clientWidth, mob = W < 760;
    k = (mob ? Math.min(W - 40, CW) : Math.min(CW, W * .29, innerHeight * .42 * CW / CH)) / CW;
    stage.style.height = Math.round(CH * k + 46) + 'px';
    cards.forEach((el, i) => {
      const d = off(i), a = Math.abs(d);
      const x = d * CW * k * (a > 1 ? 1.03 : 1.04), z = -a * 150, ry = mob ? 0 : -Math.sign(d) * Math.min(a, 2) * 17, s = (1 - Math.min(a, 2) * .02) * k;
      el.style.transform = `translate3d(calc(-50% + ${x}px), 0, ${z}px) rotateY(${ry}deg) scale(${s})`;
      el.style.zIndex = 10 - a; el.style.opacity = a > 2 ? 0 : 1;
      el.classList.toggle('front', d === 0); el.classList.toggle('side', a === 1);
      el.style.pointerEvents = a <= 1 ? '' : 'none'; el.setAttribute('aria-hidden', String(d !== 0));
    });
    [...tabs.children].forEach((b, j) => { b.classList.toggle('on', j === mod(cur, n)); b.setAttribute('aria-selected', String(j === mod(cur, n))); });
  }
  // einmal zeichnen (Seitenkarten stehen still, die vordere lebt)
  const tStart = performance.now() / 1000;
  const tNow = () => reduce ? 12 : performance.now() / 1000 - tStart + 20;
  function drawAll() { cards.forEach((el, i) => { const sc = SCREENS[i % n]; if (sc.draw) sc.draw(el, tNow()); }); }

  let typeGen = 0;
  async function caption() {
    const sc = SCREENS[mod(cur, n)], g = ++typeGen;
    capL.textContent = t_(sc.lab); capT.parentElement.classList.toggle('mono', sc.mono);
    const s = sc.q(); capT.textContent = '';
    if (reduce) { capT.textContent = s; return; }
    await new Promise(r => setTimeout(r, 350));
    for (let i = 1; i <= s.length; i++) { if (g !== typeGen) return; capT.textContent = s.slice(0, i); await new Promise(r => setTimeout(r, sc.mono ? 20 : 30)); }
  }
  let timer = 0, paused = false, visible = false;
  function go(j) {
    cur = j; layout(); caption();
    cards.forEach(el => el.classList.remove('play'));
    const f = cards[mod(cur, N)]; void f.offsetWidth; f.classList.add('play');
    schedule();
    tabs.style.setProperty('--hold', HOLD + 'ms'); tabs.classList.remove('run'); void tabs.offsetWidth; if (!paused && !reduce) tabs.classList.add('run');
  }
  function schedule() { clearTimeout(timer); if (!paused && !reduce && visible) timer = setTimeout(() => go(cur + 1), HOLD); }

  // Hover: anhalten, vordere Karte neigt sich zur Maus
  stage.addEventListener('mouseenter', () => { paused = true; clearTimeout(timer); tabs.classList.remove('run'); });
  stage.addEventListener('mouseleave', () => { paused = false; go(cur); const f = stage.querySelector('.api-card.front .api-card-in'); if (f) f.style.transform = ''; });
  stage.addEventListener('mousemove', e => {
    const f = stage.querySelector('.api-card.front'); if (!f || reduce) return;
    const r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    if (Math.abs(x) > .7 || Math.abs(y) > .7) return;
    const inn = f.querySelector('.api-card-in');
    inn.style.transform = `rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
    inn.style.setProperty('--gx', (x + .5) * 100 + '%'); inn.style.setProperty('--gy', (y + .5) * 100 + '%');
  });
  stage.tabIndex = 0;
  stage.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
  let tx = null;
  stage.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); tx = null; });

  // Schleife: nur die vordere Karte wird laufend neu gezeichnet, und nur wenn sichtbar
  let raf = 0;
  function loop() {
    raf = 0; if (!visible) return;
    const i = mod(cur, N), sc = SCREENS[i % n];
    if (sc.live) sc.draw(cards[i], tNow());
    if (!reduce) raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { go(cur); if (!raf) raf = requestAnimationFrame(loop); } else clearTimeout(timer); }, { threshold: .3 }).observe(stage);

  build(); layout(); requestAnimationFrame(drawAll);
  addEventListener('resize', () => { layout(); drawAll(); });
  window.addEventListener('langchange', () => { build(); layout(); drawAll(); go(cur); });
})();
