const STORAGE_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_REST_API_URL;

const STORAGE_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_REST_API_TOKEN;

const PREFIX = process.env.VOTE_STATS_PREFIX || "op:votes";
const STATS_TIME_ZONE = process.env.VOTE_STATS_TIME_ZONE || "Europe/Berlin";
const TEN_MINUTE_START_HOUR = Number(process.env.VOTE_STATS_TEN_MINUTE_START_HOUR || 15);
const EXPORT_LIMIT = Math.max(1, Number(process.env.VOTE_STATS_EXPORT_LIMIT) || 10000);

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

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function localDateTimeParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" };
  }

  const parts = timeZoneParts(date, STATS_TIME_ZONE);
  return {
    date: [
      parts.year,
      String(parts.month).padStart(2, "0"),
      String(parts.day).padStart(2, "0"),
    ].join("-"),
    time: [
      String(parts.hour).padStart(2, "0"),
      String(parts.minute).padStart(2, "0"),
      String(parts.second).padStart(2, "0"),
    ].join(":"),
  };
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

function addMinutes(date, minutes) {
  const copy = new Date(date);
  copy.setUTCMinutes(copy.getUTCMinutes() + minutes);
  return copy;
}

function tenMinuteKey(date) {
  const copy = new Date(date);
  copy.setUTCMinutes(Math.floor(copy.getUTCMinutes() / 10) * 10, 0, 0);
  return copy.toISOString().slice(0, 16);
}

function timeZoneParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function zonedDateTimeToUtc({ year, month, day, hour, minute }, timeZone) {
  let utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  for (let index = 0; index < 3; index += 1) {
    const actual = timeZoneParts(utcDate, timeZone);
    const expectedUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const actualUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second || 0,
      0
    );
    utcDate = new Date(utcDate.getTime() - (actualUtc - expectedUtc));
  }

  return utcDate;
}

function recentLocalStartAtHour(now, timeZone, hour) {
  const local = timeZoneParts(now, timeZone);
  let start = zonedDateTimeToUtc({
    year: local.year,
    month: local.month,
    day: local.day,
    hour,
    minute: 0,
  }, timeZone);

  if (start > now) {
    const previousLocalDay = new Date(Date.UTC(local.year, local.month - 1, local.day - 1, 12, 0, 0, 0));
    const previous = timeZoneParts(previousLocalDay, timeZone);
    start = zonedDateTimeToUtc({
      year: previous.year,
      month: previous.month,
      day: previous.day,
      hour,
      minute: 0,
    }, timeZone);
  }

  return start;
}

function tenMinuteBucketsBetween(start, end) {
  const buckets = [];
  let cursor = new Date(`${tenMinuteKey(start)}:00.000Z`);

  while (cursor <= end && buckets.length < 160) {
    buckets.push(cursor);
    cursor = addMinutes(cursor, 10);
  }

  return buckets;
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
  const tenMinute = tenMinuteKey(now);
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
    tenMinute,
  });

  const commands = [
    ["INCR", `${PREFIX}:total`],
    ["INCR", `${PREFIX}:day:${today}`],
    ["INCR", `${PREFIX}:hour:${hour}`],
    ["INCR", `${PREFIX}:ten:${tenMinute}`],
    ["PFADD", `${PREFIX}:visitors`, event.visitorId],
    ["HINCRBY", `${PREFIX}:referers`, refererHost, 1],
    ["HINCRBY", `${PREFIX}:devices`, device, 1],
    ["LPUSH", `${PREFIX}:events`, recentEvent],
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
  const currentTenMinute = new Date(`${tenMinuteKey(now)}:00.000Z`);
  const tenMinuteStart = recentLocalStartAtHour(now, STATS_TIME_ZONE, TEN_MINUTE_START_HOUR);
  const tenMinuteBuckets = tenMinuteBucketsBetween(tenMinuteStart, currentTenMinute);
  const commands = [
    ["GET", `${PREFIX}:total`],
    ["PFCOUNT", `${PREFIX}:visitors`],
    ["HGETALL", `${PREFIX}:referers`],
    ["HGETALL", `${PREFIX}:devices`],
    ["LRANGE", `${PREFIX}:recent`, 0, 49],
    ["HGETALL", `${PREFIX}:locations`],
    ["HGETALL", `${PREFIX}:countries`],
    ...days.map((date) => ["GET", `${PREFIX}:day:${dayKey(date)}`]),
    ...hours.map((date) => ["GET", `${PREFIX}:hour:${date.toISOString().slice(0, 13)}`]),
    ...tenMinuteBuckets.map((date) => ["GET", `${PREFIX}:ten:${tenMinuteKey(date)}`]),
  ];

  const { results } = await redisPipeline(commands);
  const dayOffset = 7;
  const hourOffset = dayOffset + days.length;
  const tenMinuteOffset = hourOffset + hours.length;
  const daily = days.map((date, index) => ({
    date: dayKey(date),
    count: numberValue(resultAt(results, dayOffset + index, 0)),
  }));
  const hourly = hours.map((date, index) => ({
    hour: date.toISOString().slice(0, 13),
    count: numberValue(resultAt(results, hourOffset + index, 0)),
  }));
  const tenMinuteByKey = new Map();
  const tenMinute = tenMinuteBuckets.map((date, index) => {
    const bucket = {
      bucket: tenMinuteKey(date),
      count: numberValue(resultAt(results, tenMinuteOffset + index, 0)),
    };
    tenMinuteByKey.set(bucket.bucket, bucket);
    return bucket;
  });
  const recent = (resultAt(results, 4, []) || [])
    .map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  for (const item of recent) {
    if (item.tenMinute) continue;
    const at = new Date(item.at);
    if (Number.isNaN(at.getTime())) continue;

    const bucket = tenMinuteByKey.get(tenMinuteKey(at));
    if (bucket) {
      bucket.count += 1;
    }
  }

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
    tenMinute,
    today: daily[daily.length - 1]?.count || 0,
    updatedAt: new Date().toISOString(),
  };
}

function parseEventList(items) {
  return (items || [])
    .map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function getVoteEvents(limit = EXPORT_LIMIT) {
  if (!isStorageConfigured()) {
    return { configured: false, events: [] };
  }

  const exportLimit = Math.max(1, Math.min(Number(limit) || EXPORT_LIMIT, EXPORT_LIMIT));
  const { results } = await redisPipeline([
    ["LRANGE", `${PREFIX}:events`, 0, exportLimit - 1],
    ["LRANGE", `${PREFIX}:recent`, 0, 49],
  ]);

  let events = parseEventList(resultAt(results, 0, []));
  const usedRecentFallback = events.length === 0;

  if (usedRecentFallback) {
    events = parseEventList(resultAt(results, 1, []));
  }

  return {
    configured: true,
    events,
    limit: exportLimit,
    usedRecentFallback,
  };
}

function voteEventsToCsv(events) {
  const headers = [
    "date",
    "time",
    "datetime_iso",
    "location",
    "city",
    "region",
    "country",
    "latitude",
    "longitude",
    "device",
    "source",
    "source_url",
    "visitor_id",
    "hit_id",
  ];

  const rows = (events || []).map((event) => {
    const geo = normalizeGeo(event.geo);
    const local = localDateTimeParts(event.at);

    return [
      local.date,
      local.time,
      event.at || "",
      geo?.label || "Unknown",
      geo?.city || "",
      geo?.region || "",
      geo?.country || "Unknown",
      geo?.latitude ?? "",
      geo?.longitude ?? "",
      event.device || "Unknown",
      event.referer || "direct",
      event.sourceUrl || "",
      event.visitorId || "",
      event.hitId || "",
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n") + "\n";
}

exports.getVoteEvents = getVoteEvents;
exports.getVoteStats = getVoteStats;
exports.isStorageConfigured = isStorageConfigured;
exports.trackVoteRedirect = trackVoteRedirect;
exports.voteEventsToCsv = voteEventsToCsv;
