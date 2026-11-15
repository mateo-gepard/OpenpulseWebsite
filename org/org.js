// OpenPulse intern: Anmeldung, Board (Kanban), Zeitplan, Liste, Editor, Meilensteine, Aktivität.
// Daten liegen auf dem Server (/api/org/data); jede Änderung wird sofort gespeichert, andere sehen sie nach spätestens 15 s.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');
  const MARK = '<svg class="mark" viewBox="10 10 80 80" aria-hidden="true"><path d="M 18.8 39.26 A 33 33 0 0 1 64.98 20.6" stroke="#101f3c"/><path d="M 74.91 28.35 A 33 33 0 0 1 67.97 77.68" stroke="#b08d83"/><path d="M 56.3 82.39 A 33 33 0 0 1 17.05 51.73" stroke="#cf3826"/></svg>';
  const PEOPLE = [['mateo', 'Mateo'], ['juan', 'Juan'], ['roman', 'Roman']];
  const NAME = Object.fromEntries(PEOPLE);
  const COLOR = { mateo: '#101f3c', juan: '#b08d83', roman: '#cf3826', '': '#9aa0a6' };
  const STATUS = [['backlog', 'Ideen', '#cfcac2'], ['todo', 'Zu tun', '#9aa0a6'], ['doing', 'In Arbeit', '#c27a12'], ['review', 'Prüfen', '#101f3c'], ['done', 'Erledigt', '#2f7d4f']];
  const SNAME = Object.fromEntries(STATUS.map(s => [s[0], s[1]])), SCOL = Object.fromEntries(STATUS.map(s => [s[0], s[2]]));
  const PRIO = ['Niedrig', 'Normal', 'Hoch', 'Dringend'];
  const AREAS = ['Platine', 'Gehäuse', 'Firmware', 'Software', 'Website', 'Fertigung', 'Vertrieb', 'Organisation'];
  const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  const st = { me: null, users: [], tasks: [], ms: [], log: [], rev: -1, view: localStorage.getItem('org-view') || 'board',
    who: 'all', area: '', q: '', sort: ['due', 1], tlZoom: 'w', tlGroup: 'area', tlStart: null, edit: null };

  // ───────── Hilfen ─────────
  async function api(path, body) {
    const r = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-op-req': '1' }, body: JSON.stringify(body), credentials: 'same-origin' } : { credentials: 'same-origin', cache: 'no-store' });
    let j = {}; try { j = await r.json(); } catch {}
    if (r.status === 401 && path.includes('/data')) { showLogin(); throw new Error('auth'); }
    if (!r.ok && r.status !== 401) throw new Error(j.error || 'Fehler ' + r.status);
    return { status: r.status, ...j };
  }
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const pd = s => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const days = (a, b) => Math.round((b - a) / 864e5);
  const fmtD = s => { const d = pd(s); return d ? `${d.getDate()}. ${MON[d.getMonth()]}` : ''; };
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'gerade eben' : m < 60 ? `vor ${m} min` : m < 1440 ? `vor ${Math.round(m / 60)} h` : `vor ${Math.round(m / 1440)} Tagen`; };
  const av = (id, s) => `<span class="av ${id || 'none'}${s ? ' s' : ''}" title="${esc(NAME[id] || 'Niemand')}">${id ? NAME[id][0] : '–'}</span>`;
  const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const kw = d => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y) / 864e5 + 1) / 7); };
  function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.append(t); } t.textContent = msg; t.classList.add('in'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('in'), 2200); }
  function dueClass(t) { if (!t.due || t.status === 'done') return ''; const n = days(today(), pd(t.due)); return n < 0 ? 'late' : n <= 3 ? 'soon' : ''; }
  const areas = () => [...new Set([...AREAS, ...st.tasks.map(t => t.area).filter(Boolean)])];
  function visible() {
    const q = st.q.trim().toLowerCase();
    return st.tasks.filter(t => (st.who === 'all' || (st.who === 'none' ? !t.assignee : t.assignee === st.who)) && (!st.area || t.area === st.area)
      && (!q || (t.title + ' ' + t.desc + ' ' + t.area).toLowerCase().includes(q)));
  }

  // ───────── Anmeldung ─────────
  async function boot() {
    let r; try { r = await api('/api/org/auth'); } catch (e) { app.innerHTML = `<div class="lg"><div class="lg-card"><p class="err">${esc(e.message)}</p></div></div>`; return; }
    if (r.me) { st.me = r.me; await load(true); shell(); } else { st.users = r.users || []; showLogin(); }
  }
  function showLogin(mode = 'login') {
    st.me = null; clearInterval(st.poll);
    const pick = localStorage.getItem('org-user') || 'mateo';
    app.innerHTML = `<div class="lg"><form class="lg-card" id="lf" autocomplete="on">
      <div class="lg-brand">${MARK}<span>OpenPulse <em>intern</em></span></div>
      <h1>${mode === 'setup' ? 'Passwort festlegen.' : 'Willkommen zurück.'}</h1>
      <p class="sub">${mode === 'setup' ? 'Einmalig je Person. Den Einladungscode kennt Mateo.' : 'Aufgaben, Zeitplan und Stand von OpenPulse.'}</p>
      <div class="who" role="radiogroup">${PEOPLE.map(([id, n]) => `<button type="button" role="radio" data-u="${id}" class="${id === pick ? 'on' : ''}">${n}</button>`).join('')}</div>
      <input type="hidden" name="username" id="lu" value="${pick}" autocomplete="username">
      ${mode === 'setup' ? `<label class="fld"><span>Einladungscode</span><input class="inp" id="li" type="password" autocomplete="off" required></label>` : ''}
      <label class="fld"><span>${mode === 'setup' ? 'Neues Passwort (mind. 10 Zeichen)' : 'Passwort'}</span><input class="inp" id="lp" type="password" autocomplete="${mode === 'setup' ? 'new-password' : 'current-password'}" required minlength="${mode === 'setup' ? 10 : 1}"></label>
      ${mode === 'setup' ? `<label class="fld"><span>Passwort wiederholen</span><input class="inp" id="lp2" type="password" autocomplete="new-password" required></label>` : ''}
      <button class="btn wide" type="submit">${mode === 'setup' ? 'Festlegen und anmelden' : 'Anmelden'}</button>
      <p class="err" id="le" role="alert"></p>
      <div class="lg-foot"><button type="button" class="lnk" id="lm">${mode === 'setup' ? 'Ich habe schon ein Passwort' : 'Erstes Mal hier? Passwort festlegen'}</button><a class="lnk" href="https://www.openpulse.eu/">openpulse.eu</a></div>
    </form></div>`;
    $$('.who button').forEach(b => b.onclick = () => { $$('.who button').forEach(x => x.classList.toggle('on', x === b)); $('#lu').value = b.dataset.u; localStorage.setItem('org-user', b.dataset.u); $('#lp').focus(); });
    $('#lm').onclick = () => showLogin(mode === 'setup' ? 'login' : 'setup');
    $('#lf').onsubmit = async e => {
      e.preventDefault(); const er = $('#le'); er.textContent = '';
      const user = $('#lu').value, password = $('#lp').value;
      if (mode === 'setup' && password !== $('#lp2').value) { er.textContent = 'Die beiden Passwörter sind nicht gleich.'; return; }
      const btn = $('#lf .btn'); btn.disabled = true;
      try {
        const r = await api('/api/org/auth', mode === 'setup' ? { op: 'setup', user, invite: $('#li').value, password } : { op: 'login', user, password });
        if (r.me) { st.me = r.me; await load(true); shell(); } else er.textContent = r.error || 'Anmeldung fehlgeschlagen.';
      } catch (x) { er.textContent = x.message; } finally { btn.disabled = false; }
    };
    $(mode === 'setup' ? '#li' : '#lp').focus();
  }

  // ───────── Daten ─────────
  async function load(force) {
    const r = await api('/api/org/data' + (force || st.rev < 0 ? '' : '?rev=' + st.rev));
    if (r.same) return false;
    st.tasks = r.tasks || []; st.ms = (r.milestones || []).sort((a, b) => (a.date || '9').localeCompare(b.date || '9')); st.log = r.log || []; st.rev = r.rev; st.me = r.me || st.me;
    return true;
  }
  async function saveTask(t, quiet) {
    const i = st.tasks.findIndex(x => x.id === t.id);
    if (i >= 0) st.tasks[i] = { ...st.tasks[i], ...t };   // sofort anzeigen
    try { const r = await api('/api/org/data', { op: 'task.save', task: t }); const j = st.tasks.findIndex(x => x.id === r.task.id); if (j >= 0) st.tasks[j] = r.task; else st.tasks.push(r.task); st.rev = r.rev; if (!quiet) toast('Gespeichert'); return r.task; }
    catch (e) { if (e.message !== 'auth') toast('Nicht gespeichert: ' + e.message); await load(true); render(); }
  }

  // ───────── Rahmen ─────────
  function shell() {
    localStorage.setItem('org-user', st.me.id);
    app.innerHTML = `<header class="top"><nav class="pill">
        <div class="brand">${MARK}<span>OpenPulse <em>intern</em></span></div>
        <div class="tabs" role="tablist">${[['board', 'Board'], ['tl', 'Zeitplan'], ['list', 'Liste']].map(([k, n]) => `<button role="tab" data-v="${k}">${n}</button>`).join('')}</div>
        <button class="btn" id="new" title="Neue Aufgabe (N)">+ Aufgabe</button>
        <div class="me"><button id="meb" aria-haspopup="true">${av(st.me.id)}</button>
          <div class="menu" id="mem" hidden><b>${esc(st.me.name)}</b><small>angemeldet</small>
            <button data-a="ms">Meilensteine</button><button data-a="log">Aktivität</button><button data-a="pw">Passwort ändern</button><button data-a="out">Abmelden</button></div></div>
      </nav></header>
      <div class="bar">
        <div class="chips" id="who">${[['all', 'Alle'], ...PEOPLE, ['none', 'Offen']].map(([k, n]) => `<button class="chip" data-w="${k}">${k !== 'all' && k !== 'none' ? av(k) : ''}${n}</button>`).join('')}</div>
        <select class="sel" id="area"><option value="">Alle Bereiche</option></select>
        <input class="search" id="q" type="search" placeholder="Suchen  ( / )">
      </div>
      <main id="view"></main>`;
    $$('.tabs button').forEach(b => b.onclick = () => { st.view = b.dataset.v; localStorage.setItem('org-view', st.view); render(); });
    $('#new').onclick = () => openEditor(null);
    $$('#who .chip').forEach(b => b.onclick = () => { st.who = b.dataset.w; render(); });
    $('#area').onchange = e => { st.area = e.target.value; render(); };
    $('#q').oninput = e => { st.q = e.target.value; render(); };
    const mem = $('#mem');
    $('#meb').onclick = e => { e.stopPropagation(); mem.hidden = !mem.hidden; };
    document.addEventListener('click', e => { if (!e.target.closest('.me')) mem.hidden = true; });
    mem.onclick = async e => {
      const a = e.target.dataset.a; if (!a) return; mem.hidden = true;
      if (a === 'out') { await api('/api/org/auth', { op: 'logout' }); showLogin(); }
      if (a === 'ms') openMilestones(); if (a === 'log') openLog(); if (a === 'pw') openPassword();
    };
    render();
    clearInterval(st.poll);
    st.poll = setInterval(async () => { if (document.hidden || !st.me || st.drag) return; try { if (await load()) render(); } catch {} }, 15000);
  }

  function render() {
    if (!st.me || !$('#view')) return;
    $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === st.view));
    $$('#who .chip').forEach(b => b.classList.toggle('on', b.dataset.w === st.who));
    const sel = $('#area'), cur = st.area; sel.innerHTML = '<option value="">Alle Bereiche</option>' + areas().map(a => `<option ${a === cur ? 'selected' : ''}>${esc(a)}</option>`).join('');
    ({ board: renderBoard, tl: renderTimeline, list: renderList })[st.view]();
  }

  // ───────── Board ─────────
  function cardHTML(t) {
    const cl = t.checklist || [], dn = cl.filter(c => c.done).length;
    return `<article class="card" data-id="${t.id}" tabindex="0"><div class="t">${esc(t.title)}</div><div class="m">
      <i class="prio p${t.prio}" title="Priorität: ${PRIO[t.prio]}"></i>
      ${t.area ? `<span class="tag">${esc(t.area)}</span>` : ''}
      ${t.due ? `<span class="due ${dueClass(t)}">${fmtD(t.due)}</span>` : ''}
      ${cl.length ? `<span class="prog">${dn}/${cl.length}</span>` : ''}
      ${av(t.assignee, 1)}</div></article>`;
  }
  function renderBoard() {
    const v = visible();
    $('#view').innerHTML = `<section class="board">${STATUS.map(([k, n, c]) => {
      const list = v.filter(t => t.status === k).sort((a, b) => a.order - b.order);
      return `<div class="col" data-s="${k}"><h3><i style="background:${c}"></i>${n}<small>${list.length}</small></h3>
        <div class="cards">${list.map(cardHTML).join('')}</div>
        <button class="add" data-s="${k}">+ Aufgabe</button></div>`;
    }).join('')}</section>`;
    $$('.card').forEach(el => { el.addEventListener('pointerdown', dragStart); el.addEventListener('keydown', e => { if (e.key === 'Enter') openEditor(el.dataset.id); }); });
    $$('.add').forEach(b => b.onclick = () => quickAdd(b));
  }
  function quickAdd(btn) {
    const inp = document.createElement('input'); inp.className = 'quick'; inp.placeholder = 'Titel, Enter zum Anlegen'; btn.replaceWith(inp); inp.focus();
    const done = async () => {
      const title = inp.value.trim(); if (!title) { render(); return; }
      const s = btn.dataset.s, last = st.tasks.filter(t => t.status === s).reduce((m, t) => Math.max(m, t.order), 0);
      const t = await saveTask({ title, status: s, order: last + 1000, assignee: st.who !== 'all' && st.who !== 'none' ? st.who : '', area: st.area }, true);
      if (t) { render(); const nb = $(`.add[data-s="${s}"]`); if (nb) quickAdd(nb); }
    };
    inp.onkeydown = e => { if (e.key === 'Enter') done(); if (e.key === 'Escape') render(); };
    inp.onblur = () => setTimeout(() => { if (document.activeElement !== inp && inp.isConnected) done(); }, 120);
  }
  // Ziehen mit Zeiger (Maus und Touch): erst ab 6 px Bewegung, sonst Klick = öffnen
  function dragStart(e) {
    if (e.button !== 0) return;
    const el = e.currentTarget, sx = e.clientX, sy = e.clientY, r = el.getBoundingClientRect();
    let ghost = null;
    const move = ev => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        ghost = el.cloneNode(true); ghost.classList.add('drag'); ghost.style.width = r.width + 'px'; document.body.append(ghost); el.classList.add('ghost'); st.drag = true;
      }
      ghost.style.left = ev.clientX - (sx - r.left) + 'px'; ghost.style.top = ev.clientY - (sy - r.top) + 'px';
      const col = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.col');
      $$('.col').forEach(c => c.classList.toggle('over', c === col));
      if (col) {   // Platzhalter (das gezogene Original) an die passende Stelle schieben
        const cards = $('.cards', col), sibs = $$('.card:not(.ghost)', cards);
        const after = sibs.find(c => { const b = c.getBoundingClientRect(); return ev.clientY < b.top + b.height / 2; });
        after ? cards.insertBefore(el, after) : cards.append(el);
      }
    };
    const up = async () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (!ghost) { openEditor(el.dataset.id); return; }
      ghost.remove(); el.classList.remove('ghost'); $$('.col').forEach(c => c.classList.remove('over')); st.drag = false;
      const col = el.closest('.col'), s = col.dataset.s, cards = $$('.card', col), i = cards.indexOf(el);
      const ord = id => st.tasks.find(t => t.id === id)?.order;
      const prev = i > 0 ? ord(cards[i - 1].dataset.id) : null, next = i < cards.length - 1 ? ord(cards[i + 1].dataset.id) : null;
      const order = prev != null && next != null ? (prev + next) / 2 : prev != null ? prev + 1000 : next != null ? next - 1000 : Date.now();
      const t = st.tasks.find(x => x.id === el.dataset.id);
      if (t.status !== s || t.order !== order) { await saveTask({ ...t, status: s, order }, true); render(); }
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }

  // ───────── Zeitplan ─────────
  function renderTimeline() {
    const W = st.tlZoom === 'w' ? 30 : 9, N = st.tlZoom === 'w' ? 84 : 273;
    if (!st.tlStart) { const t = today(); t.setDate(t.getDate() - (st.tlZoom === 'w' ? 14 : 30)); st.tlStart = monday(t); }
    const t0 = st.tlStart, LW = innerWidth < 820 ? 150 : 240, X = d => days(t0, d) * W;
    const v = visible().filter(t => t.start || t.due), none = visible().length - v.length;
    const key = t => st.tlGroup === 'area' ? (t.area || 'Ohne Bereich') : (NAME[t.assignee] || 'Offen');
    const groups = [...new Set(v.map(key))].sort((a, b) => a.localeCompare(b, 'de'));
    let head = '';
    if (st.tlZoom === 'w') for (let i = 0; i < N; i += 7) { const d = new Date(t0); d.setDate(d.getDate() + i); head += `<div class="tl-cell${d.getDate() <= 7 ? ' mon' : ''}" style="width:${7 * W}px">KW ${kw(d)} · ${d.getDate()}. ${MON[d.getMonth()]}</div>`; }
    else { let d = new Date(t0); const end = new Date(t0); end.setDate(end.getDate() + N); while (d < end) { const n = new Date(d.getFullYear(), d.getMonth() + 1, 1); const w = Math.min(days(d, n), days(d, end)) * W; head += `<div class="tl-cell mon" style="width:${w}px">${MON[d.getMonth()]} ${d.getFullYear()}</div>`; d = n; } }
    const grid = st.tlZoom === 'w' ? `background:repeating-linear-gradient(90deg,transparent 0 ${7 * W - 1}px,rgba(18,20,23,.06) ${7 * W - 1}px ${7 * W}px)` : '';
    const rows = groups.map(g => {
      const list = v.filter(t => key(t) === g).sort((a, b) => (a.start || a.due).localeCompare(b.start || b.due));
      return `<div class="tl-row tl-grp"><div class="tl-lab" style="width:${LW}px">${esc(g)}</div><div class="tl-track" style="width:${N * W}px"></div></div>` + list.map(t => {
        const a = pd(t.start || t.due), b = pd(t.due || t.start), pt = !(t.start && t.due);
        const l = X(a), w = Math.max(W, (days(a, b) + 1) * W);
        return `<div class="tl-row"><div class="tl-lab" style="width:${LW}px">${av(t.assignee, 1)}<span title="${esc(t.title)}">${esc(t.title)}</span></div>
          <div class="tl-track" style="width:${N * W}px;${grid}"><div class="tl-bar${t.status === 'done' ? ' done' : ''}${pt ? ' pt' : ''}" data-id="${t.id}" style="left:${pt ? l + W / 2 - 7 : l}px;width:${w}px;background:${COLOR[t.assignee]}" title="${esc(t.title)} · ${fmtD(t.start)}${t.start && t.due ? ' – ' : ''}${fmtD(t.due)}">${pt ? '' : esc(t.title)}</div></div></div>`;
      }).join('');
    }).join('');
    const tdx = X(today()), msl = st.ms.filter(m => m.date).map(m => `<div class="tl-ms" style="left:${LW + X(pd(m.date)) + W / 2}px"><span data-ms="${m.id}">◆ ${esc(m.title)}</span></div>`).join('');
    $('#view').innerHTML = `<section class="tl-wrap"><div class="tl-nav">
        <button class="chip" data-n="-1">‹</button><button class="chip" data-n="0">Heute</button><button class="chip" data-n="1">›</button>
        <div class="chips" style="margin-left:12px"><button class="chip${st.tlZoom === 'w' ? ' on' : ''}" data-z="w">Wochen</button><button class="chip${st.tlZoom === 'm' ? ' on' : ''}" data-z="m">Monate</button></div>
        <div class="chips" style="margin-left:12px"><button class="chip${st.tlGroup === 'area' ? ' on' : ''}" data-g="area">nach Bereich</button><button class="chip${st.tlGroup === 'who' ? ' on' : ''}" data-g="who">nach Person</button></div>
        <b style="margin-left:auto;color:var(--dim);font-weight:400">${none ? `${none} ohne Datum · ` : ''}Balken ziehen verschiebt die Termine</b></div>
      <div class="tl"><div class="tl-grid" style="width:${LW + N * W}px"><div class="tl-head"><div class="tl-lab" style="width:${LW}px"></div>${head}</div>
        ${rows || `<div class="empty">Noch keine Aufgaben mit Datum. Start- oder Fälligkeitsdatum im Editor setzen.</div>`}
        ${tdx >= 0 && tdx <= N * W ? `<div class="tl-today" style="left:${LW + tdx + W / 2}px"></div>` : ''}${msl}</div></div></section>`;
    $$('[data-n]').forEach(b => b.onclick = () => { const n = +b.dataset.n; if (!n) st.tlStart = null; else { const d = new Date(st.tlStart); d.setDate(d.getDate() + n * (st.tlZoom === 'w' ? 28 : 91)); st.tlStart = d; } render(); });
    $$('[data-z]').forEach(b => b.onclick = () => { st.tlZoom = b.dataset.z; st.tlStart = null; render(); });
    $$('[data-g]').forEach(b => b.onclick = () => { st.tlGroup = b.dataset.g; render(); });
    $$('[data-ms]').forEach(s => s.onclick = () => openMilestones());
    $$('.tl-bar').forEach(b => b.addEventListener('pointerdown', e => barDrag(e, W)));
    if (!st.tlScrolled) { st.tlScrolled = true; const tl = $('.tl'); if (tl) tl.scrollLeft = Math.max(0, tdx - 3 * W * 7 / (st.tlZoom === 'w' ? 1 : 3)); }
  }
  function barDrag(e, W) {
    const el = e.currentTarget, sx = e.clientX, l0 = parseFloat(el.style.left); let moved = 0;
    const mv = ev => { moved = Math.round((ev.clientX - sx) / W); if (Math.abs(ev.clientX - sx) > 4) { st.drag = true; el.style.left = l0 + moved * W + 'px'; } };
    const up = async ev => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); st.drag = false;
      if (Math.abs(ev.clientX - sx) <= 4) { openEditor(el.dataset.id); return; }
      if (!moved) { render(); return; }
      const t = st.tasks.find(x => x.id === el.dataset.id), sh = s => { if (!s) return ''; const d = pd(s); d.setDate(d.getDate() + moved); return iso(d); };
      await saveTask({ ...t, start: sh(t.start), due: sh(t.due) }, true); toast(`${moved > 0 ? '+' : ''}${moved} Tage`); render();
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }

  // ───────── Liste ─────────
  function renderList() {
    const [k, dir] = st.sort, so = { title: t => t.title.toLowerCase(), status: t => STATUS.findIndex(s => s[0] === t.status), who: t => NAME[t.assignee] || 'zz', area: t => t.area || 'zz', prio: t => -t.prio, due: t => t.due || '9999' };
    const v = visible().sort((a, b) => { const x = so[k](a), y = so[k](b); return (x < y ? -1 : x > y ? 1 : 0) * dir; });
    const th = (key, n, c = '') => `<th data-k="${key}" class="${c}${k === key ? ' on' : ''}">${n}${k === key ? (dir > 0 ? ' ↑' : ' ↓') : ''}</th>`;
    $('#view').innerHTML = `<section class="ls-wrap"><table class="ls"><thead><tr>${th('title', 'Aufgabe')}${th('status', 'Status')}${th('who', 'Person')}${th('area', 'Bereich', 'hide-s')}${th('prio', 'Priorität', 'hide-s')}${th('due', 'Fällig')}</tr></thead>
      <tbody>${v.map(t => `<tr data-id="${t.id}"><td>${esc(t.title)}</td><td><span class="st"><i style="background:${SCOL[t.status]}"></i>${SNAME[t.status]}</span></td>
        <td>${av(t.assignee, 1)}</td><td class="hide-s">${esc(t.area)}</td><td class="hide-s"><i class="prio p${t.prio}" style="display:inline-block"></i> ${PRIO[t.prio]}</td>
        <td><span class="due ${dueClass(t)}">${fmtD(t.due) || '–'}</span></td></tr>`).join('') || `<tr><td colspan="6" class="empty">Keine Aufgaben.</td></tr>`}</tbody></table></section>`;
    $$('.ls th').forEach(h => h.onclick = () => { st.sort = [h.dataset.k, st.sort[0] === h.dataset.k ? -st.sort[1] : 1]; render(); });
    $$('.ls tbody tr[data-id]').forEach(r => r.onclick = () => openEditor(r.dataset.id));
  }

  // ───────── Seitenblatt ─────────
  function sheet(html, onClose) {
    closeSheet(true);
    const s = document.createElement('div'); s.className = 'scrim'; const p = document.createElement('aside'); p.className = 'sheet'; p.innerHTML = html;
    document.body.append(s, p); requestAnimationFrame(() => { s.classList.add('in'); p.classList.add('in'); });
    s.onclick = () => closeSheet(); st.sheet = { s, p, onClose }; $('.x', p)?.addEventListener('click', () => closeSheet()); return p;
  }
  function closeSheet(now) {
    const o = st.sheet; if (!o) return; st.sheet = null; o.onClose?.();
    o.s.classList.remove('in'); o.p.classList.remove('in'); setTimeout(() => { o.s.remove(); o.p.remove(); }, now ? 0 : 300);
  }

  function openEditor(id) {
    const base = id ? st.tasks.find(t => t.id === id) : null;
    if (id && !base) return;
    const t = JSON.parse(JSON.stringify(base || { title: '', desc: '', status: 'todo', assignee: st.who !== 'all' && st.who !== 'none' ? st.who : st.me.id, area: st.area, prio: 1, start: '', due: '', milestone: '', checklist: [], order: Date.now() }));
    let dirty = false;
    const p = sheet(`<div class="sh-head"><span class="st"><i style="background:${SCOL[t.status]}"></i>${base ? SNAME[t.status] : 'Neue Aufgabe'}</span><button class="x" aria-label="Schließen">×</button></div>
      <div class="sh-body">
        <textarea class="ttl" rows="1" placeholder="Was ist zu tun?">${esc(t.title)}</textarea>
        <div class="row"><span>Status</span><div class="seg" data-f="status">${STATUS.map(([k, n]) => `<button data-v="${k}">${n}</button>`).join('')}</div></div>
        <div class="row"><span>Person</span><div class="seg" data-f="assignee">${PEOPLE.map(([k, n]) => `<button data-v="${k}">${av(k)}${n}</button>`).join('')}<button data-v="">Offen</button></div></div>
        <div class="row"><span>Bereich</span><div><input class="inp" list="areas" data-f="area" value="${esc(t.area)}" placeholder="z. B. Platine"><datalist id="areas">${areas().map(a => `<option value="${esc(a)}">`).join('')}</datalist></div></div>
        <div class="row"><span>Priorität</span><div class="seg" data-f="prio">${PRIO.map((n, i) => `<button data-v="${i}">${n}</button>`).join('')}</div></div>
        <div class="row"><span>Zeitraum</span><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input type="date" data-f="start" value="${t.start}"> <span style="color:var(--dim)">bis</span> <input type="date" data-f="due" value="${t.due}"></div></div>
        <div class="row"><span>Meilenstein</span><select data-f="milestone"><option value="">–</option>${st.ms.map(m => `<option value="${m.id}" ${m.id === t.milestone ? 'selected' : ''}>${esc(m.title)}${m.date ? ' · ' + fmtD(m.date) : ''}</option>`).join('')}</select></div>
        <textarea class="desc" data-f="desc" placeholder="Beschreibung, Links, Notizen …">${esc(t.desc)}</textarea>
        <div class="cl"><h4>Checkliste</h4><div id="cl"></div><button class="add" id="cla">+ Punkt</button></div>
      </div>
      <div class="sh-foot"><small>${base ? `Erstellt von ${NAME[base.createdBy] || '?'} ${ago(base.created)}<br>Zuletzt ${NAME[base.updatedBy] || '?'} ${ago(base.updated)}` : 'Strg/⌘ + Enter speichert'}</small>
        ${base ? '<button class="btn bad" id="del">Löschen</button>' : ''}<button class="btn" id="sv">${base ? 'Speichern' : 'Anlegen'}</button></div>`,
      () => { document.removeEventListener('keydown', key); });
    const mark = () => { dirty = true; };
    const segSync = () => $$('.seg[data-f]', p).forEach(s => $$('button', s).forEach(b => b.classList.toggle('on', String(t[s.dataset.f]) === b.dataset.v)));
    $$('.seg[data-f]', p).forEach(s => s.onclick = e => { const b = e.target.closest('button'); if (!b) return; t[s.dataset.f] = s.dataset.f === 'prio' ? +b.dataset.v : b.dataset.v; segSync(); mark(); });
    $$('[data-f]:not(.seg)', p).forEach(i => i.oninput = () => { t[i.dataset.f] = i.value; mark(); });
    const ttl = $('.ttl', p), grow = () => { ttl.style.height = 'auto'; ttl.style.height = ttl.scrollHeight + 'px'; };
    ttl.oninput = () => { t.title = ttl.value; grow(); mark(); }; grow();
    const cl = () => {
      $('#cl', p).innerHTML = t.checklist.map((c, i) => `<label class="${c.done ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${c.done ? 'checked' : ''}><input type="text" data-i="${i}" value="${esc(c.t)}"><button class="rm" data-i="${i}" aria-label="Entfernen">×</button></label>`).join('');
      $$('#cl input[type=checkbox]', p).forEach(x => x.onchange = () => { t.checklist[x.dataset.i].done = x.checked; cl(); mark(); });
      $$('#cl input[type=text]', p).forEach(x => { x.oninput = () => { t.checklist[x.dataset.i].t = x.value; mark(); }; x.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('#cla', p).click(); } }; });
      $$('#cl .rm', p).forEach(x => x.onclick = e => { e.preventDefault(); t.checklist.splice(x.dataset.i, 1); cl(); mark(); });
    };
    $('#cla', p).onclick = () => { t.checklist.push({ t: '', done: false }); cl(); const ins = $$('#cl input[type=text]', p); ins[ins.length - 1]?.focus(); };
    cl(); segSync();
    const save = async () => {
      if (!t.title.trim()) { ttl.focus(); toast('Bitte einen Titel eingeben'); return; }
      if (t.start && t.due && t.start > t.due) { toast('Start liegt nach dem Fälligkeitsdatum'); return; }
      t.checklist = t.checklist.filter(c => c.t.trim());
      const r = await saveTask(t); if (r) { dirty = false; closeSheet(); render(); }
    };
    $('#sv', p).onclick = save;
    $('#del', p)?.addEventListener('click', async () => {
      if (!confirm(`„${t.title}“ löschen? Das lässt sich nicht rückgängig machen.`)) return;
      try { const r = await api('/api/org/data', { op: 'task.delete', id: t.id }); st.tasks = st.tasks.filter(x => x.id !== t.id); st.rev = r.rev; closeSheet(); render(); toast('Gelöscht'); } catch (e) { toast(e.message); }
    });
    const key = e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save(); if (e.key === 'Escape' && (!dirty || confirm('Änderungen verwerfen?'))) closeSheet(); };
    document.addEventListener('keydown', key);
    if (!base) setTimeout(() => ttl.focus(), 60);
  }

  function openMilestones() {
    const p = sheet(`<div class="sh-head"><b style="font-weight:500;font-size:17px">Meilensteine</b><button class="x" aria-label="Schließen">×</button></div>
      <div class="sh-body"><p style="color:var(--mute);margin:4px 0 16px">Erscheinen als Linien im Zeitplan; Aufgaben lassen sich einem Meilenstein zuordnen.</p>
      <div class="ms-list" id="msl"></div><button class="add" id="msa" style="margin-top:10px">+ Meilenstein</button></div>`);
    const draw = () => {
      $('#msl', p).innerHTML = st.ms.map(m => `<div class="ms-item" data-id="${m.id}"><input class="inp" value="${esc(m.title)}" data-k="title"><input class="inp" type="date" value="${m.date}" data-k="date"><button class="lnk rm" title="Löschen">×</button></div>`).join('') || '<p style="color:var(--dim)">Noch keine Meilensteine.</p>';
      $$('.ms-item', p).forEach(r => {
        const m = st.ms.find(x => x.id === r.dataset.id);
        $$('input', r).forEach(i => i.onchange = async () => { m[i.dataset.k] = i.value; const x = await api('/api/org/data', { op: 'ms.save', ms: m }); st.rev = x.rev; toast('Gespeichert'); render(); });
        $('.rm', r).onclick = async () => { if (!confirm(`Meilenstein „${m.title}“ löschen?`)) return; const x = await api('/api/org/data', { op: 'ms.delete', id: m.id }); st.ms = st.ms.filter(y => y.id !== m.id); st.rev = x.rev; draw(); render(); };
      });
    };
    $('#msa', p).onclick = async () => { const d = today(); d.setDate(d.getDate() + 30); const x = await api('/api/org/data', { op: 'ms.save', ms: { title: 'Neuer Meilenstein', date: iso(d) } }); st.ms.push(x.ms); st.rev = x.rev; draw(); render(); $$('.ms-item input', p).slice(-2)[0]?.select(); };
    draw();
  }

  function openLog() {
    sheet(`<div class="sh-head"><b style="font-weight:500;font-size:17px">Aktivität</b><button class="x" aria-label="Schließen">×</button></div>
      <div class="sh-body"><ul class="log">${st.log.map(l => `<li>${av(l.by, 1)}<div><b style="font-weight:500">${esc(NAME[l.by] || '?')}</b> ${esc(l.what)}: ${esc(l.title)}<small>${ago(l.at)}</small></div></li>`).join('') || '<li>Noch nichts passiert.</li>'}</ul></div>`);
  }

  function openPassword() {
    const p = sheet(`<div class="sh-head"><b style="font-weight:500;font-size:17px">Passwort ändern</b><button class="x" aria-label="Schließen">×</button></div>
      <form class="sh-body" id="pwf" style="max-width:380px"><input type="hidden" autocomplete="username" value="${st.me.id}">
        <label class="fld"><span>Aktuelles Passwort</span><input class="inp" type="password" id="po" autocomplete="current-password" required></label>
        <label class="fld"><span>Neues Passwort (mind. 10 Zeichen)</span><input class="inp" type="password" id="pn" autocomplete="new-password" minlength="10" required></label>
        <label class="fld"><span>Wiederholen</span><input class="inp" type="password" id="pn2" autocomplete="new-password" required></label>
        <button class="btn" type="submit">Ändern</button><p class="err" id="pe"></p>
        <p style="color:var(--dim);font-size:12.5px">Danach endet die Anmeldung auf allen anderen Geräten.</p></form>`);
    $('#pwf', p).onsubmit = async e => {
      e.preventDefault(); const er = $('#pe', p);
      if ($('#pn', p).value !== $('#pn2', p).value) { er.textContent = 'Die beiden Passwörter sind nicht gleich.'; return; }
      try { const r = await api('/api/org/auth', { op: 'password', old: $('#po', p).value, password: $('#pn', p).value }); if (r.error) { er.textContent = r.error; return; } closeSheet(); toast('Passwort geändert'); } catch (x) { er.textContent = x.message; }
    };
  }

  document.addEventListener('keydown', e => {
    if (!st.me || st.sheet || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    if (e.key === 'n') { e.preventDefault(); openEditor(null); }
    if (e.key === '/') { e.preventDefault(); $('#q')?.focus(); }
  });
  addEventListener('resize', () => { if (st.view === 'tl') render(); });
  boot();
})();
