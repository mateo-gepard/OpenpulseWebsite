const { clearSessionCookie } = require("../lib/dev-auth");

module.exports = function devLogout(_req, res) {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Set-Cookie": clearSessionCookie(),
  });
  res.end(JSON.stringify({ ok: true }));
};
