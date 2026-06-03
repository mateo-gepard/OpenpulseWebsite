const crypto = require("crypto");

const COOKIE_NAME = "op_dev_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function getConfig() {
  return {
    username: (process.env.DEV_DASHBOARD_USER || "openpulse").trim(),
    password: (process.env.DEV_DASHBOARD_PASSWORD || "").trim(),
    secret:
      (
        process.env.DEV_DASHBOARD_SECRET ||
        process.env.VOTE_STATS_SALT ||
        process.env.DEV_DASHBOARD_PASSWORD ||
        ""
      ).trim(),
  };
}

function isAuthConfigured() {
  const config = getConfig();
  return Boolean(config.password && config.secret);
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) return cookies;
    cookies[rawKey] = decodeURIComponent(rawValue.join("=") || "");
    return cookies;
  }, {});
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left, right) {
  const leftHash = crypto.createHash("sha256").update(String(left)).digest();
  const rightHash = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function createSessionToken(username) {
  const config = getConfig();
  const payload = Buffer.from(
    JSON.stringify({
      u: username,
      exp: Date.now() + SESSION_SECONDS * 1000,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload, config.secret)}`;
}

function verifySessionToken(token) {
  if (!token || !isAuthConfigured()) return false;

  const config = getConfig();
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, config.secret))) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.u === config.username && session.exp > Date.now();
  } catch {
    return false;
  }
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

function sessionCookie(req, token) {
  const isLocalhost = /localhost|127\.0\.0\.1/.test(req.headers.host || "");
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${SESSION_SECONDS}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isLocalhost ? "" : "Secure",
  ]
    .filter(Boolean)
    .join("; ");
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

module.exports = {
  clearSessionCookie,
  createSessionToken,
  getConfig,
  isAuthConfigured,
  isAuthenticated,
  safeEqual,
  sessionCookie,
};
