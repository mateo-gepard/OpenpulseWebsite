const { randomUUID } = require("crypto");
const { trackVoteRedirect } = require("../lib/vote-stats");

const TARGET_URL =
  "https://www.startupteens.de/challenge-2026/voting/" +
  "?utm_source=openpulse.eu&utm_medium=redirect&utm_campaign=startupteens_2026_vote&utm_content=vote_for_openpulse" +
  "#:~:text=OPENPULSE";

function getHeader(headers, name) {
  const value = headers[name] || headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function getClientIp(headers) {
  const forwarded = getHeader(headers, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return getHeader(headers, "x-real-ip") || null;
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

async function sendWebhook(event) {
  const webhookUrl = process.env.VOTE_TRACKING_WEBHOOK_URL;
  if (!webhookUrl || typeof fetch !== "function") return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      signal: controller.signal,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "openpulse_vote_tracking_webhook_failed",
        error: error && error.message ? error.message : String(error),
        hitId: event.hitId,
      })
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function persistStats(event) {
  try {
    const result = await trackVoteRedirect(event);
    if (!result.configured) {
      console.error(
        JSON.stringify({
          event: "openpulse_vote_stats_storage_missing",
          hitId: event.hitId,
          hint: "Set KV_REST_API_URL and KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
        })
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "openpulse_vote_stats_storage_failed",
        error: error && error.message ? error.message : String(error),
        hitId: event.hitId,
      })
    );
  }
}

module.exports = async function voteForOpenPulse(req, res) {
  const cookies = parseCookies(getHeader(req.headers, "cookie"));
  const visitorId = cookies.op_vote_visitor || randomUUID();
  const hitId = randomUUID();
  const host = getHeader(req.headers, "host") || "openpulse.eu";
  const path = req.url || "/Vote-for-Openpulse";

  const event = {
    event: "openpulse_vote_redirect",
    hitId,
    visitorId,
    timestamp: new Date().toISOString(),
    sourceUrl: `https://${host}${path}`,
    targetUrl: TARGET_URL,
    method: req.method,
    ip: getClientIp(req.headers),
    userAgent: getHeader(req.headers, "user-agent") || null,
    referer: getHeader(req.headers, "referer") || null,
    vercelId: getHeader(req.headers, "x-vercel-id") || null,
  };

  console.log(JSON.stringify(event));
  await Promise.all([persistStats(event), sendWebhook(event)]);

  res.writeHead(302, {
    Location: TARGET_URL,
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Set-Cookie": `op_vote_visitor=${encodeURIComponent(
      visitorId
    )}; Max-Age=2592000; Path=/; SameSite=Lax; Secure`,
    "Content-Type": "text/plain; charset=utf-8",
  });
  res.end("Redirecting to the OpenPulse voting section.");
};
