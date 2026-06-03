const {
  createSessionToken,
  getConfig,
  isAuthConfigured,
  safeEqual,
  sessionCookie,
} = require("../lib/dev-auth");

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16_384) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function parseBody(rawBody, contentType) {
  if ((contentType || "").includes("application/json")) {
    return JSON.parse(rawBody || "{}");
  }

  const params = new URLSearchParams(rawBody || "");
  return Object.fromEntries(params.entries());
}

module.exports = async function devLogin(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    res.end("Method not allowed");
    return;
  }

  if (!isAuthConfigured()) {
    res.writeHead(503, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(
      JSON.stringify({
        ok: false,
        error:
          "Dashboard login is not configured. Set DEV_DASHBOARD_PASSWORD and DEV_DASHBOARD_SECRET in Vercel.",
      })
    );
    return;
  }

  try {
    const body = parseBody(await readBody(req), req.headers["content-type"]);
    const config = getConfig();
    const username = body.username || "";
    const password = body.password || "";

    if (!safeEqual(username, config.username) || !safeEqual(password, config.password)) {
      res.writeHead(401, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ ok: false, error: "Invalid login." }));
      return;
    }

    const token = createSessionToken(config.username);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": sessionCookie(req, token),
    });
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    res.writeHead(400, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(
      JSON.stringify({
        ok: false,
        error: error && error.message ? error.message : "Invalid request.",
      })
    );
  }
};
