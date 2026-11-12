const { configured, isAuthed } = require("../lib/auth");
const telegram = require("../lib/telegram");
const { sendJson } = require("../lib/api-util");

module.exports = async function status(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "method" });
  if (!isAuthed(req.headers.cookie)) return sendJson(res, 401, { error: "auth" });
  return sendJson(res, 200, {
    adminConfigured: configured(),
    telegramConfigured: telegram.configured(),
  });
};
