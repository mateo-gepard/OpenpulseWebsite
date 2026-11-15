// Anmeldung für dev.openpulse.eu: GET = wer bin ich; POST op = login | logout | setup | password
const S = require("../../lib/org-store");

module.exports = async function handler(req, res) {
  try {
    if (!S.secret()) return S.send(res, 503, { error: "Anmeldung ist noch nicht eingerichtet (DEV_DASHBOARD_SECRET fehlt)." });
    if (req.method === "GET") {
      const me = await S.sessionUser(req);
      if (me) return S.send(res, 200, { me });
      const open = {};
      for (const id of Object.keys(S.USERS)) open[id] = !(await S.getUser(id));
      return S.send(res, 401, { me: null, users: Object.entries(S.USERS).map(([id, u]) => ({ id, name: u.name, needsSetup: open[id] })) });
    }
    if (req.method !== "POST") return S.send(res, 405, { error: "method" });
    if (!S.sameOriginWrite(req)) return S.send(res, 403, { error: "forbidden" });
    const b = await S.readJson(req);
    const id = String(b.user || "").toLowerCase();

    if (b.op === "logout") { S.setSessionCookie(res, ""); return S.send(res, 200, { ok: true }); }

    if (b.op === "login") {
      if (!S.USERS[id]) return S.send(res, 400, { error: "Unbekanntes Konto." });
      if (await S.rateLimited(`login:${id}:${S.clientIp(req)}`)) return S.send(res, 429, { error: "Zu viele Versuche. Bitte in 15 Minuten erneut." });
      const rec = await S.checkPassword(id, String(b.password || ""));
      if (!rec) return S.send(res, 401, { error: "Passwort falsch, oder für dieses Konto ist noch keins festgelegt." });
      S.setSessionCookie(res, S.makeToken(id, rec.pv));
      return S.send(res, 200, { me: { id, name: S.USERS[id].name } });
    }

    if (b.op === "setup") {   // erstes Passwort: nur mit Einladungscode und nur, solange keins existiert
      if (!S.USERS[id]) return S.send(res, 400, { error: "Unbekanntes Konto." });
      if (!S.invite()) return S.send(res, 503, { error: "Einladungscode ist nicht eingerichtet (DEV_DASHBOARD_PASSWORD)." });
      if (await S.rateLimited(`setup:${S.clientIp(req)}`)) return S.send(res, 429, { error: "Zu viele Versuche. Bitte in 15 Minuten erneut." });
      if (await S.getUser(id)) return S.send(res, 409, { error: "Für dieses Konto gibt es schon ein Passwort. Bitte anmelden." });
      if (!S.safeEqual(String(b.invite || "").trim(), S.invite())) return S.send(res, 401, { error: "Einladungscode stimmt nicht." });
      const pw = String(b.password || "");
      if (pw.length < 10) return S.send(res, 400, { error: "Das Passwort braucht mindestens 10 Zeichen." });
      const rec = await S.setPassword(id, pw);
      S.setSessionCookie(res, S.makeToken(id, rec.pv));
      return S.send(res, 200, { me: { id, name: S.USERS[id].name } });
    }

    if (b.op === "password") {   // Passwort ändern (angemeldet, mit altem Passwort); alte Sitzungen enden
      const me = await S.sessionUser(req);
      if (!me) return S.send(res, 401, { error: "Nicht angemeldet." });
      if (!(await S.checkPassword(me.id, String(b.old || "")))) return S.send(res, 401, { error: "Altes Passwort stimmt nicht." });
      const pw = String(b.password || "");
      if (pw.length < 10) return S.send(res, 400, { error: "Das Passwort braucht mindestens 10 Zeichen." });
      const rec = await S.setPassword(me.id, pw);
      S.setSessionCookie(res, S.makeToken(me.id, rec.pv));
      return S.send(res, 200, { ok: true });
    }
    return S.send(res, 400, { error: "op" });
  } catch (e) {
    console.error(JSON.stringify({ event: "org_auth_error", error: String(e && e.message || e) }));
    return S.send(res, 500, { error: "Serverfehler. Bitte später erneut." });
  }
};
