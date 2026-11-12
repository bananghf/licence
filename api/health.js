const { sendJson } = require("../lib/api-util");

module.exports = async function health(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "method" });
  return sendJson(res, 200, { ok: true });
};
