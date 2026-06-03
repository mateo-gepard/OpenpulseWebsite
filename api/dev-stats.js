const { isAuthenticated } = require("../lib/dev-auth");
const { getVoteStats } = require("../lib/vote-stats");

module.exports = async function devStats(req, res) {
  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    res.end("Method not allowed");
    return;
  }

  if (!isAuthenticated(req)) {
    res.writeHead(401, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify({ ok: false, error: "Not authenticated." }));
    return;
  }

  try {
    const stats = await getVoteStats();
    const status = stats.configured ? 200 : 503;
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(
      JSON.stringify({
        ok: stats.configured,
        stats,
        setup: stats.configured
          ? null
          : {
              required:
                "Connect Vercel KV / Upstash Redis and expose REST env vars: KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.",
            },
      })
    );
  } catch (error) {
    res.writeHead(500, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(
      JSON.stringify({
        ok: false,
        error: error && error.message ? error.message : "Could not read stats.",
      })
    );
  }
};
