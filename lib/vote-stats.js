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
const SCAN_LIMIT = Math.max(1, Number(process.env.VOTE_STATS_SCAN_LIMIT) || 20000);
const HIDDEN_SOURCE_TERMS = ["sproutgigs"];

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

function cleanSourceLabel(value) {
  const label = String(value || "").trim().replace(/\s+/g, " ");
  return label ? label.slice(0, 80) : "direct";
}

function compactSourceText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isHiddenVoteEvent(event) {
  const sourceText = [
    event?.source,
    event?.referer,
    event?.sourceUrl,
  ].map(compactSourceText).join(" ");

  return HIDDEN_SOURCE_TERMS.some((term) => sourceText.includes(compactSourceText(term)));
}

function visibleVoteEvents(events) {
  return (events || []).filter((event) => !isHiddenVoteEvent(event));
}

function getTrackingSource(sourceUrl, referer) {
  try {
    const url = new URL(sourceUrl);
    return cleanSourceLabel(
      url.searchParams.get("utm_source") ||
      url.searchParams.get("source") ||
      url.searchParams.get("platform") ||
      url.searchParams.get("ref") ||
      getRefererHost(referer)
    );
  } catch {
    return cleanSourceLabel(getRefererHost(referer));
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
  if (!value) {
    return { date: "", time: "" };
  }

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

async function redisCommand(command) {
  const { configured, results } = await redisPipeline([command]);
  return { configured, result: resultAt(results, 0, null) };
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

function parseScanResult(value) {
  if (!Array.isArray(value)) return { cursor: "0", keys: [] };
  return {
    cursor: String(value[0] || "0"),
    keys: Array.isArray(value[1]) ? value[1] : [],
  };
}

async function scanKeys(pattern) {
  const keys = [];
  let cursor = "0";
  let guard = 0;

  do {
    const { configured, result } = await redisCommand([
      "SCAN",
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      1000,
    ]);
    if (!configured) return [];

    const scan = parseScanResult(result);
    keys.push(...scan.keys);
    cursor = scan.cursor;
    guard += 1;
  } while (cursor !== "0" && keys.length < SCAN_LIMIT && guard < 200);

  return keys.slice(0, SCAN_LIMIT);
}

async function getCountKeys(kind) {
  const prefix = `${PREFIX}:${kind}:`;
  const keys = await scanKeys(`${prefix}*`);
  const rows = [];

  for (let index = 0; index < keys.length; index += 250) {
    const chunk = keys.slice(index, index + 250);
    const { results } = await redisPipeline(chunk.map((key) => ["GET", key]));
    chunk.forEach((key, resultIndex) => {
      const count = numberValue(resultAt(results, resultIndex, 0));
      if (count > 0) {
        rows.push({
          bucket: key.slice(prefix.length),
          count,
        });
      }
    });
  }

  return rows.sort((a, b) => a.bucket.localeCompare(b.bucket));
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

function sourcesFromEvents(events) {
  const counts = new Map();

  for (const event of events || []) {
    const source = cleanSourceLabel(event.source || event.referer || "direct");
    counts.set(source, (counts.get(source) || 0) + 1);
  }

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

function rowsFromEvents(events, valueForEvent) {
  const counts = new Map();

  for (const event of events || []) {
    const value = valueForEvent(event);
    if (!value) continue;
    const label = cleanSourceLabel(value);
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

function uniqueVisitorCount(events) {
  const visitors = new Set();

  for (const event of events || []) {
    if (event.visitorId) {
      visitors.add(event.visitorId);
    }
  }

  return visitors.size;
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
  const source = getTrackingSource(event.sourceUrl, event.referer);
  const device = compactUserAgent(event.userAgent);
  const geo = normalizeGeo(event.geo);
  const recentEvent = JSON.stringify({
    at: now.toISOString(),
    hitId: event.hitId,
    visitorId: event.visitorId,
    source,
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
    ["HINCRBY", `${PREFIX}:sources`, source, 1],
    ["SET", `${PREFIX}:event:${event.hitId}`, recentEvent],
    ["ZADD", `${PREFIX}:event-index`, now.getTime(), event.hitId],
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
  const { events } = await getVoteEvents();
  const rawEvents = events.filter((event) => !event.backfilled);
  const dailyCounts = countBy(events, dayKey);
  const hourlyCounts = countBy(events, (date) => date.toISOString().slice(0, 13));
  const tenMinuteCounts = countBy(events, tenMinuteKey);
  const daily = days.map((date, index) => ({
    date: dayKey(date),
    count: dailyCounts.get(dayKey(date)) || 0,
  }));
  const hourly = hours.map((date, index) => ({
    hour: date.toISOString().slice(0, 13),
    count: hourlyCounts.get(date.toISOString().slice(0, 13)) || 0,
  }));
  const tenMinute = tenMinuteBuckets.map((date, index) => {
    const bucket = tenMinuteKey(date);
    return {
      bucket,
      count: tenMinuteCounts.get(bucket) || 0,
    };
  });

  const recent = rawEvents.slice(0, 50);
  const sources = sourcesFromEvents(rawEvents);
  const locations = locationsFromRecent(rawEvents);
  const locatedClicks = locations.reduce((sum, location) => sum + location.count, 0);
  const total = events.length;

  return {
    configured: true,
    total,
    uniqueVisitors: uniqueVisitorCount(rawEvents),
    referers: rowsFromEvents(rawEvents, (event) => event.referer || "direct"),
    devices: rowsFromEvents(rawEvents, (event) => event.device || "Unknown"),
    sources,
    locations,
    countries: rowsFromEvents(rawEvents, (event) => normalizeGeo(event.geo)?.country),
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

async function getIndexedEvents() {
  const { result } = await redisCommand(["ZRANGE", `${PREFIX}:event-index`, 0, -1]);
  const ids = Array.isArray(result) ? result : [];
  const events = [];

  for (let index = 0; index < ids.length; index += 250) {
    const chunk = ids.slice(index, index + 250);
    if (chunk.length === 0) continue;
    const { results } = await redisPipeline([
      ["MGET", ...chunk.map((id) => `${PREFIX}:event:${id}`)],
    ]);
    events.push(...parseEventList(resultAt(results, 0, [])));
  }

  return events;
}

function eventId(event) {
  return event.hitId || [event.at, event.visitorId, event.sourceUrl, event.referer].join("|");
}

function uniqueEvents(events) {
  const seen = new Set();
  const unique = [];

  for (const event of events || []) {
    const id = eventId(event);
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(event);
  }

  return unique;
}

function countBy(events, keyForEvent) {
  const counts = new Map();

  for (const event of events) {
    const date = new Date(event.at);
    if (Number.isNaN(date.getTime())) continue;
    const key = keyForEvent(date);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

function bucketIso(bucket, kind) {
  if (kind === "ten") return `${bucket}:00.000Z`;
  if (kind === "hour") return `${bucket}:00:00.000Z`;
  if (kind === "day") return `${bucket}T00:00:00.000Z`;
  return null;
}

function makeBackfillEvents(kind, bucket, count) {
  const at = bucketIso(bucket, kind);
  return Array.from({ length: Math.max(0, count) }, (_, index) => ({
    at,
    hitId: `backfill:${kind}:${bucket}:${index + 1}`,
    visitorId: "",
    referer: "",
    device: "",
    geo: null,
    sourceUrl: "",
    backfilled: true,
    backfillBucket: kind,
    missingParameters: "location, device, source",
  }));
}

async function getVoteEvents(options = {}) {
  if (!isStorageConfigured()) {
    return { configured: false, events: [] };
  }

  const includeHidden = Boolean(options.includeHidden);

  const { results } = await redisPipeline([
    ["GET", `${PREFIX}:total`],
    ["LRANGE", `${PREFIX}:events`, 0, -1],
    ["LRANGE", `${PREFIX}:recent`, 0, 49],
  ]);

  const total = numberValue(resultAt(results, 0, 0));
  const indexedEvents = await getIndexedEvents();
  const rawEvents = uniqueEvents([
    ...indexedEvents,
    ...parseEventList(resultAt(results, 1, [])),
    ...parseEventList(resultAt(results, 2, [])),
  ]);
  const tenBuckets = await getCountKeys("ten");
  const hourBuckets = await getCountKeys("hour");
  const dayBuckets = await getCountKeys("day");
  const tenBucketSet = new Set(tenBuckets.map((bucket) => bucket.bucket));
  const hourBucketSet = new Set(hourBuckets.map((bucket) => bucket.bucket));
  const rawByTen = countBy(rawEvents, tenMinuteKey);
  const coveredByTenByHour = new Map();
  const coveredByHourByDay = new Map();
  const backfilled = [];

  for (const bucket of tenBuckets) {
    const hour = bucket.bucket.slice(0, 13);
    coveredByTenByHour.set(hour, (coveredByTenByHour.get(hour) || 0) + bucket.count);
    const missing = bucket.count - (rawByTen.get(bucket.bucket) || 0);
    backfilled.push(...makeBackfillEvents("ten", bucket.bucket, missing));
  }

  for (const bucket of hourBuckets) {
    const day = bucket.bucket.slice(0, 10);
    coveredByHourByDay.set(day, (coveredByHourByDay.get(day) || 0) + bucket.count);
    const rawWithoutTen = rawEvents.filter((event) => {
      const date = new Date(event.at);
      if (Number.isNaN(date.getTime())) return false;
      return date.toISOString().slice(0, 13) === bucket.bucket && !tenBucketSet.has(tenMinuteKey(date));
    }).length;
    const missing = bucket.count - (coveredByTenByHour.get(bucket.bucket) || 0) - rawWithoutTen;
    backfilled.push(...makeBackfillEvents("hour", bucket.bucket, missing));
  }

  for (const bucket of dayBuckets) {
    const rawWithoutHour = rawEvents.filter((event) => {
      const date = new Date(event.at);
      if (Number.isNaN(date.getTime())) return false;
      return dayKey(date) === bucket.bucket && !hourBucketSet.has(date.toISOString().slice(0, 13));
    }).length;
    const missing = bucket.count - (coveredByHourByDay.get(bucket.bucket) || 0) - rawWithoutHour;
    backfilled.push(...makeBackfillEvents("day", bucket.bucket, missing));
  }

  const knownCount = rawEvents.length + backfilled.length;
  if (total > knownCount) {
    backfilled.push(...makeBackfillEvents("total", "unknown", total - knownCount));
  }

  const allEvents = [...rawEvents, ...backfilled].sort((left, right) => {
    const leftTime = left.at ? new Date(left.at).getTime() : 0;
    const rightTime = right.at ? new Date(right.at).getTime() : 0;
    return rightTime - leftTime;
  });
  const events = includeHidden ? allEvents : visibleVoteEvents(allEvents);
  const rawCount = events.filter((event) => !event.backfilled).length;
  const backfilledCount = events.length - rawCount;

  return {
    configured: true,
    events,
    total: events.length,
    storedTotal: total,
    rawCount,
    backfilledCount,
    hiddenCount: allEvents.length - events.length,
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
    "row_type",
    "missing_parameters",
  ];

  const rows = (events || []).map((event) => {
    const geo = normalizeGeo(event.geo);
    const local = localDateTimeParts(event.at);
    const backfilled = Boolean(event.backfilled);

    return [
      local.date,
      local.time,
      event.at || "",
      geo?.label || (backfilled ? "" : "Unknown"),
      geo?.city || "",
      geo?.region || "",
      geo?.country || (backfilled ? "" : "Unknown"),
      geo?.latitude ?? "",
      geo?.longitude ?? "",
      event.device || (backfilled ? "" : "Unknown"),
      event.source || event.referer || (backfilled ? "" : "direct"),
      event.sourceUrl || "",
      event.visitorId || "",
      event.hitId || "",
      backfilled ? `backfilled_${event.backfillBucket || "unknown"}` : "raw",
      event.missingParameters || "",
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
