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

function cleanGeoPart(value) {
  if (!value) return null;
  return String(value).trim() || null;
}

function roundedCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(4)) : null;
}

function normalizeGeo(geo) {
  if (!geo || typeof geo !== "object") return null;

  const latitude = roundedCoordinate(geo.latitude);
  const longitude = roundedCoordinate(geo.longitude);
  const country = cleanGeoPart(geo.country);
  const region = cleanGeoPart(geo.region);
  const city = cleanGeoPart(geo.city);

  if (!country && !region && !city && latitude === null && longitude === null) {
    return null;
  }

  const label = [city, region, country].filter(Boolean).join(", ") || "Unknown";

  return {
    country: country || "Unknown",
    region,
    city,
    latitude,
    longitude,
    label,
  };
}

function locationField(geo) {
  return JSON.stringify({
    country: geo.country,
    region: geo.region,
    city: geo.city,
    latitude: geo.latitude,
    longitude: geo.longitude,
    label: geo.label,
  });
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function addHours(date, hours) {
  const copy = new Date(date);
  copy.setUTCHours(copy.getUTCHours() + hours);
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

function parseLocationHash(value) {
  return parseHash(value)
    .map(([field, count]) => {
      try {
        const location = JSON.parse(field);
        return {
          country: location.country || "Unknown",
          region: location.region || null,
          city: location.city || null,
          latitude: roundedCoordinate(location.latitude),
          longitude: roundedCoordinate(location.longitude),
          label: location.label || "Unknown",
          count,
        };
      } catch {
        return {
          country: "Unknown",
          region: null,
          city: null,
          latitude: null,
          longitude: null,
          label: field || "Unknown",
          count,
        };
      }
    })
    .sort((a, b) => b.count - a.count);
}

function locationsFromRecent(recent) {
  const byKey = new Map();

  for (const item of recent) {
    const geo = normalizeGeo(item.geo);
    if (!geo || geo.latitude === null || geo.longitude === null) continue;

    const key = locationField(geo);
    const previous = byKey.get(key) || { ...geo, count: 0 };
    previous.count += 1;
    byKey.set(key, previous);
  }

  return Array.from(byKey.values()).sort((a, b) => b.count - a.count);
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
  const geo = normalizeGeo(event.geo);
  const recentEvent = JSON.stringify({
    at: now.toISOString(),
    hitId: event.hitId,
    visitorId: event.visitorId,
    referer: refererHost,
    device,
    geo,
    sourceUrl: event.sourceUrl,
  });

  const commands = [
    ["INCR", `${PREFIX}:total`],
    ["INCR", `${PREFIX}:day:${today}`],
    ["INCR", `${PREFIX}:hour:${hour}`],
    ["PFADD", `${PREFIX}:visitors`, event.visitorId],
    ["HINCRBY", `${PREFIX}:referers`, refererHost, 1],
    ["HINCRBY", `${PREFIX}:devices`, device, 1],
    ["LPUSH", `${PREFIX}:recent`, recentEvent],
    ["LTRIM", `${PREFIX}:recent`, 0, 49],
  ];

  if (geo) {
    commands.push(["HINCRBY", `${PREFIX}:countries`, geo.country, 1]);
  }

  if (geo && geo.latitude !== null && geo.longitude !== null) {
    commands.push(["HINCRBY", `${PREFIX}:locations`, locationField(geo), 1]);
  }

  await redisPipeline(commands);

  return { configured: true };
}

async function getVoteStats() {
  if (!isStorageConfigured()) {
    return { configured: false };
  }

  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => addDays(now, index - 6));
  const hours = Array.from({ length: 24 }, (_, index) => addHours(now, index - 23));
  const commands = [
    ["GET", `${PREFIX}:total`],
    ["PFCOUNT", `${PREFIX}:visitors`],
    ["HGETALL", `${PREFIX}:referers`],
    ["HGETALL", `${PREFIX}:devices`],
    ["LRANGE", `${PREFIX}:recent`, 0, 24],
    ["HGETALL", `${PREFIX}:locations`],
    ["HGETALL", `${PREFIX}:countries`],
    ...days.map((date) => ["GET", `${PREFIX}:day:${dayKey(date)}`]),
    ...hours.map((date) => ["GET", `${PREFIX}:hour:${date.toISOString().slice(0, 13)}`]),
  ];

  const { results } = await redisPipeline(commands);
  const dayOffset = 7;
  const hourOffset = dayOffset + days.length;
  const daily = days.map((date, index) => ({
    date: dayKey(date),
    count: numberValue(resultAt(results, dayOffset + index, 0)),
  }));
  const hourly = hours.map((date, index) => ({
    hour: date.toISOString().slice(0, 13),
    count: numberValue(resultAt(results, hourOffset + index, 0)),
  }));
  const recent = (resultAt(results, 4, []) || [])
    .map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  let locations = parseLocationHash(resultAt(results, 5, []));

  if (locations.length === 0) {
    locations = locationsFromRecent(recent);
  }

  const locatedClicks = locations.reduce((sum, location) => sum + location.count, 0);
  const total = numberValue(resultAt(results, 0, 0));

  return {
    configured: true,
    total,
    uniqueVisitors: numberValue(resultAt(results, 1, 0)),
    referers: parseHash(resultAt(results, 2, [])).sort((a, b) => b[1] - a[1]),
    devices: parseHash(resultAt(results, 3, [])).sort((a, b) => b[1] - a[1]),
    locations,
    countries: parseHash(resultAt(results, 6, [])).sort((a, b) => b[1] - a[1]),
    locatedClicks,
    unmappedClicks: Math.max(0, total - locatedClicks),
    recent,
    daily,
    hourly,
    today: daily[daily.length - 1]?.count || 0,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getVoteStats,
  isStorageConfigured,
  trackVoteRedirect,
};
