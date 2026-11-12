const { isAuthed } = require("../lib/auth");
const { sendJson } = require("../lib/api-util");

module.exports = async function session(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "method" });
  const ok = isAuthed(req.headers.cookie);
  return sendJson(res, ok ? 200 : 401, { ok });
};
