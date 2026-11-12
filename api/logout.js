const { clearCookie } = require("../lib/auth");
const { sendJson, csrf, secure } = require("../lib/api-util");

module.exports = async function logout(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "method" });
  if (!csrf(req)) return sendJson(res, 403, { error: "csrf" });
  return sendJson(res, 200, { ok: true }, { "Set-Cookie": clearCookie(secure(req)) });
};
