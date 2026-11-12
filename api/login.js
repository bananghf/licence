const { configured, checkPassword, sessionCookie } = require("../lib/auth");
const { clientIp, limited, sendJson, readBody, csrf, secure } = require("../lib/api-util");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "method" });
  if (!csrf(req)) return sendJson(res, 403, { error: "csrf" });
  if (!configured()) return sendJson(res, 503, { error: "unconfigured" });
  if (limited(`login:${clientIp(req)}`, 8, 15 * 60 * 1000)) return sendJson(res, 429, { error: "rate" });
  try {
    const body = await readBody(req);
    if (!checkPassword(body.password)) return sendJson(res, 401, { error: "auth" });
    return sendJson(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(secure(req)) });
  } catch {
    return sendJson(res, 400, { error: "bad" });
  }
};
