// OpenPulse intern (dev.openpulse.eu): Speicher (Upstash Redis über REST), Konten, Sitzungen.
// Konten: mateo, juan, roman. Jeder legt sein Passwort beim ersten Mal selbst fest; als Einladungscode gilt
// DEV_DASHBOARD_PASSWORD (in Vercel hinterlegt). Gespeichert wird nur ein scrypt-Hash mit Salz.
// Sitzung: signiertes Cookie (HMAC-SHA256 mit DEV_DASHBOARD_SECRET), 14 Tage, HttpOnly, Secure, SameSite=Strict.
// Passwortwechsel macht alle alten Sitzungen ungültig (Passwortversion pv im Token).
const crypto = require("crypto");

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const P = "op:org";
const COOKIE = "op_org";
const SESSION_DAYS = 14;

const USERS = {
  mateo: { name: "Mateo" },
  juan: { name: "Juan" },
  roman: { name: "Roman" },
};

// Für Tests ohne Redis (ORG_REDIS_MOCK=1): einfacher Speicher im Arbeitsspeicher
const mem = new Map();
function mockCmd([c, k, ...a]) {
  const C = c.toUpperCase();
  const h = () => { if (!mem.has(k)) mem.set(k, new Map()); return mem.get(k); };
  const l = () => { if (!mem.has(k)) mem.set(k, []); return mem.get(k); };
  switch (C) {
    case "GET": return mem.has(k) ? mem.get(k) : null;
    case "SET": mem.set(k, a[0]); return "OK";
    case "DEL": return mem.delete(k) ? 1 : 0;
    case "INCR": { const v = Number(mem.get(k) || 0) + 1; mem.set(k, String(v)); return v; }
    case "EXPIRE": return 1;
    case "HGET": return h().get(a[0]) ?? null;
    case "HSET": { for (let i = 0; i < a.length; i += 2) h().set(a[i], a[i + 1]); return 1; }
    case "HDEL": return h().delete(a[0]) ? 1 : 0;
    case "HGETALL": return [...h().entries()].flat();
    case "LPUSH": l().unshift(...a); return l().length;
    case "LTRIM": mem.set(k, l().slice(Number(a[0]), Number(a[1]) + 1)); return "OK";
    case "LRANGE": return l().slice(Number(a[0]), Number(a[1]) + 1);
    default: throw new Error("mock: " + C);
  }
}

async function redis(cmds) {
  if (process.env.ORG_REDIS_MOCK === "1") return cmds.map(mockCmd);
  if (!URL_ || !TOKEN) throw new Error("storage_missing");
  const r = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("storage_http_" + r.status);
  const out = await r.json();
  return out.map((x) => { if (x.error) throw new Error("storage: " + x.error); return x.result; });
}

const secret = () => (process.env.DEV_DASHBOARD_SECRET || "").trim();
const invite = () => (process.env.DEV_DASHBOARD_PASSWORD || "").trim();

function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function hashPassword(pw, salt) {
  return new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k.toString("base64")))));
}

async function getUser(id) {
  const [raw] = await redis([["HGET", `${P}:users`, id]]);
  return raw ? JSON.parse(raw) : null;
}

async function setPassword(id, pw) {
  const salt = crypto.randomBytes(16).toString("base64");
  const rec = { salt, hash: await hashPassword(pw, salt), pv: crypto.randomBytes(6).toString("hex"), at: Date.now() };
  await redis([["HSET", `${P}:users`, id, JSON.stringify(rec)]]);
  return rec;
}

async function checkPassword(id, pw) {
  const rec = await getUser(id);
  if (!rec) return null;
  const h = await hashPassword(pw, rec.salt);
  return safeEqual(h, rec.hash) ? rec : null;
}

function sign(payload) { return crypto.createHmac("sha256", secret()).update(payload).digest("base64url"); }

function makeToken(id, pv) {
  const payload = Buffer.from(JSON.stringify({ u: id, pv, exp: Date.now() + SESSION_DAYS * 864e5 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function cookies(req) {
  return (req.headers.cookie || "").split(";").reduce((o, p) => {
    const [k, ...v] = p.trim().split("=");
    if (k) o[k] = decodeURIComponent(v.join("=") || "");
    return o;
  }, {});
}

// Gibt { id, name } zurück, wenn die Sitzung gültig ist, sonst null
async function sessionUser(req) {
  const t = cookies(req)[COOKIE];
  if (!t || !secret()) return null;
  const [payload, sig] = t.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  let s; try { s = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { return null; }
  if (!USERS[s.u] || !(s.exp > Date.now())) return null;
  const rec = await getUser(s.u);
  if (!rec || rec.pv !== s.pv) return null;
  return { id: s.u, name: USERS[s.u].name };
}

function setSessionCookie(res, token) {
  const maxAge = token ? SESSION_DAYS * 86400 : 0;
  res.setHeader("Set-Cookie", `${COOKIE}=${token ? encodeURIComponent(token) : ""}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
}

function clientIp(req) {
  const f = req.headers["x-forwarded-for"];
  return (Array.isArray(f) ? f[0] : f || "").split(",")[0].trim() || "local";
}

// höchstens 8 Fehlversuche je Konto und IP in 15 Minuten
async function rateLimited(key) {
  const k = `${P}:rl:${key}`;
  const [n] = await redis([["INCR", k], ["EXPIRE", k, 900]]);
  return n > 8;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let b = "";
    req.on("data", (c) => { b += c; if (b.length > 200000) { reject(new Error("too_large")); req.destroy(); } });
    req.on("end", () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.end(JSON.stringify(obj));
}

// Schreibende Anfragen nur mit eigenem Kopf (gegen fremde Formulare) – zusätzlich zu SameSite=Strict
function sameOriginWrite(req) { return req.method === "GET" || req.headers["x-op-req"] === "1"; }

module.exports = { P, USERS, redis, invite, secret, getUser, setPassword, checkPassword, makeToken, sessionUser, setSessionCookie, clientIp, rateLimited, readJson, send, sameOriginWrite, safeEqual };
