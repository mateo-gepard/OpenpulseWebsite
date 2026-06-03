const STORAGE_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_REST_API_URL;

const STORAGE_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_REST_API_TOKEN;

const PREFIX = process.env.VOTE_STATS_PREFIX || "op:votes";

function isStorageConfigured() {
  return Boolean(STORAGE_URL && STORAGE_TOKEN);
}

function compactUserAgent(userAgent) {
  if (!userAgent) return "Unknown";
  if (/iPhone|iPad|Android|Mobile/i.test(userAgent)) return "Mobile";
  if (/Macintosh|Windows|Linux/i.test(userAgent)) return "Desktop";
  return "Other";
}

function getRefererHost(referer) {
  if (!referer) return "direct";

  try {
    return new URL(referer).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

async function redisPipeline(commands) {
  if (!isStorageConfigured()) {
    return { configured: false, results: [] };
  }

  const response = await fetch(`${STORAGE_URL.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STORAGE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    throw new Error(`Vote stats storage failed with ${response.status}`);
  }

  return { configured: true, results: await response.json() };
}

function resultAt(results, index, fallback = null) {
  const item = results[index];
  if (!item) return fallback;
  if (Object.prototype.hasOwnProperty.call(item, "error") && item.error) {
    return fallback;
  }
  return Object.prototype.hasOwnProperty.call(item, "result")
    ? item.result
    : fallback;
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseHash(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    const pairs = [];
    for (let i = 0; i < value.length; i += 2) {
      pairs.push([value[i], numberValue(value[i + 1])]);
    }
    return pairs;
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([key, count]) => [key, numberValue(count)]);
  }

  return [];
}

async function trackVoteRedirect(event) {
  if (!isStorageConfigured()) {
    return { configured: false };
  }

  const now = new Date(event.timestamp || Date.now());
  const today = dayKey(now);
  const hour = now.toISOString().slice(0, 13);
  const refererHost = getRefererHost(event.referer);
  const device = compactUserAgent(event.userAgent);
  const recentEvent = JSON.stringify({
    at: now.toISOString(),
    hitId: event.hitId,
    visitorId: event.visitorId,
    referer: refererHost,
    device,
    sourceUrl: event.sourceUrl,
  });

  await redisPipeline([
    ["INCR", `${PREFIX}:total`],
    ["INCR", `${PREFIX}:day:${today}`],
    ["INCR", `${PREFIX}:hour:${hour}`],
    ["PFADD", `${PREFIX}:visitors`, event.visitorId],
    ["HINCRBY", `${PREFIX}:referers`, refererHost, 1],
    ["HINCRBY", `${PREFIX}:devices`, device, 1],
    ["LPUSH", `${PREFIX}:recent`, recentEvent],
    ["LTRIM", `${PREFIX}:recent`, 0, 49],
  ]);

  return { configured: true };
}

async function getVoteStats() {
  if (!isStorageConfigured()) {
    return { configured: false };
  }

  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => addDays(now, index - 6));
  const commands = [
    ["GET", `${PREFIX}:total`],
    ["PFCOUNT", `${PREFIX}:visitors`],
    ["HGETALL", `${PREFIX}:referers`],
    ["HGETALL", `${PREFIX}:devices`],
    ["LRANGE", `${PREFIX}:recent`, 0, 24],
    ...days.map((date) => ["GET", `${PREFIX}:day:${dayKey(date)}`]),
  ];

  const { results } = await redisPipeline(commands);
  const dayOffset = 5;
  const daily = days.map((date, index) => ({
    date: dayKey(date),
    count: numberValue(resultAt(results, dayOffset + index, 0)),
  }));

  return {
    configured: true,
    total: numberValue(resultAt(results, 0, 0)),
    uniqueVisitors: numberValue(resultAt(results, 1, 0)),
    referers: parseHash(resultAt(results, 2, [])).sort((a, b) => b[1] - a[1]),
    devices: parseHash(resultAt(results, 3, [])).sort((a, b) => b[1] - a[1]),
    recent: (resultAt(results, 4, []) || [])
      .map((item) => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      })
      .filter(Boolean),
    daily,
    today: daily[daily.length - 1]?.count || 0,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getVoteStats,
  isStorageConfigured,
  trackVoteRedirect,
};
