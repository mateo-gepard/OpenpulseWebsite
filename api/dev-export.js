const { isAuthenticated } = require("../lib/dev-auth");
const { getVoteEvents, voteEventsToCsv } = require("../lib/vote-stats");

module.exports = async function devExport(req, res) {
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
    const result = await getVoteEvents();
    if (!result.configured) {
      res.writeHead(503, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ ok: false, error: "Stats storage is not connected." }));
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const csv = voteEventsToCsv(result.events);

    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="openpulse-vote-visits-${today}.csv"`,
      "Cache-Control": "no-store",
    });
    res.end(csv);
  } catch (error) {
    res.writeHead(500, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(
      JSON.stringify({
        ok: false,
        error: error && error.message ? error.message : "Could not export visits.",
      })
    );
  }
};
