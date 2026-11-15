// Daten für dev.openpulse.eu (nur angemeldet): Aufgaben, Meilensteine, Aktivität.
// GET ?rev=n → { same:true } wenn unverändert, sonst alles. POST op = task.save | task.delete | ms.save | ms.delete
const crypto = require("crypto");
const S = require("../../lib/org-store");
const P = S.P;
const STATUS = ["backlog", "todo", "doing", "review", "done"];
const D = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, n) => String(v == null ? "" : v).slice(0, n);
const date = (v) => (D.test(String(v || "")) ? String(v) : "");

function cleanTask(t, prev, me) {
  const now = Date.now();
  return {
    id: prev ? prev.id : "t" + crypto.randomBytes(6).toString("hex"),
    title: str(t.title, 200).trim() || "Ohne Titel",
    desc: str(t.desc, 8000),
    status: STATUS.includes(t.status) ? t.status : "todo",
    assignee: S.USERS[t.assignee] ? t.assignee : "",
    area: str(t.area, 40).trim(),
    prio: [0, 1, 2, 3].includes(Number(t.prio)) ? Number(t.prio) : 1,
    start: date(t.start), due: date(t.due),
    milestone: str(t.milestone, 40),
    checklist: (Array.isArray(t.checklist) ? t.checklist : []).slice(0, 60).map((c) => ({ t: str(c && c.t, 300), done: !!(c && c.done) })).filter((c) => c.t.trim()),
    order: Number.isFinite(Number(t.order)) ? Number(t.order) : now,
    created: prev ? prev.created : now, createdBy: prev ? prev.createdBy : me.id,
    updated: now, updatedBy: me.id,
  };
}

const parseAll = (flat) => { const o = []; for (let i = 0; i < (flat || []).length; i += 2) { try { o.push(JSON.parse(flat[i + 1])); } catch {} } return o; };

module.exports = async function handler(req, res) {
  try {
    const me = await S.sessionUser(req);
    if (!me) return S.send(res, 401, { error: "Nicht angemeldet." });

    if (req.method === "GET") {
      const q = new URL(req.url, "http://x").searchParams;
      const [rev] = await S.redis([["GET", `${P}:rev`]]);
      if (q.get("rev") && q.get("rev") === String(rev || 0)) return S.send(res, 200, { same: true, rev: Number(rev || 0) });
      const [tasks, ms, log] = await S.redis([["HGETALL", `${P}:tasks`], ["HGETALL", `${P}:ms`], ["LRANGE", `${P}:log`, 0, 59]]);
      return S.send(res, 200, { me, rev: Number(rev || 0), tasks: parseAll(tasks), milestones: parseAll(ms), log: (log || []).map((x) => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean) });
    }
    if (req.method !== "POST") return S.send(res, 405, { error: "method" });
    if (!S.sameOriginWrite(req)) return S.send(res, 403, { error: "forbidden" });
    const b = await S.readJson(req);
    const logEntry = (what, title) => JSON.stringify({ at: Date.now(), by: me.id, what, title: str(title, 120) });

    if (b.op === "task.save") {
      const t = b.task || {};
      let prev = null;
      if (t.id) { const [raw] = await S.redis([["HGET", `${P}:tasks`, String(t.id)]]); prev = raw ? JSON.parse(raw) : null; }
      const task = cleanTask(t, prev, me);
      const what = !prev ? "erstellt" : prev.status !== task.status ? `→ ${task.status}` : "bearbeitet";
      const [, rev] = await S.redis([["HSET", `${P}:tasks`, task.id, JSON.stringify(task)], ["INCR", `${P}:rev`], ["LPUSH", `${P}:log`, logEntry(what, task.title)], ["LTRIM", `${P}:log`, 0, 199]]);
      return S.send(res, 200, { task, rev });
    }
    if (b.op === "task.delete") {
      const id = String(b.id || "");
      const [raw] = await S.redis([["HGET", `${P}:tasks`, id]]);
      if (!raw) return S.send(res, 404, { error: "nicht gefunden" });
      const [, rev] = await S.redis([["HDEL", `${P}:tasks`, id], ["INCR", `${P}:rev`], ["LPUSH", `${P}:log`, logEntry("gelöscht", JSON.parse(raw).title)], ["LTRIM", `${P}:log`, 0, 199]]);
      return S.send(res, 200, { ok: true, rev });
    }
    if (b.op === "ms.save") {
      const m = b.ms || {};
      const ms = { id: m.id ? str(m.id, 40) : "m" + crypto.randomBytes(5).toString("hex"), title: str(m.title, 120).trim() || "Meilenstein", date: date(m.date), done: !!m.done };
      const [, rev] = await S.redis([["HSET", `${P}:ms`, ms.id, JSON.stringify(ms)], ["INCR", `${P}:rev`], ["LPUSH", `${P}:log`, logEntry(m.id ? "Meilenstein bearbeitet" : "Meilenstein erstellt", ms.title)], ["LTRIM", `${P}:log`, 0, 199]]);
      return S.send(res, 200, { ms, rev });
    }
    if (b.op === "ms.delete") {
      const [, rev] = await S.redis([["HDEL", `${P}:ms`, String(b.id || "")], ["INCR", `${P}:rev`]]);
      return S.send(res, 200, { ok: true, rev });
    }
    return S.send(res, 400, { error: "op" });
  } catch (e) {
    console.error(JSON.stringify({ event: "org_data_error", error: String(e && e.message || e) }));
    return S.send(res, 500, { error: "Serverfehler. Bitte später erneut." });
  }
};
