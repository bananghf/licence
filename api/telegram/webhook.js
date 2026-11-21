const { init } = require("../../lib/store");
const telegram = require("../../lib/telegram");
const { limited, sendJson, readBody } = require("../../lib/api-util");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "method" });
  if (!telegram.verifyWebhook(req)) return sendJson(res, 401, { error: "webhook" });
  if (limited("tg-hook", 120, 60 * 1000)) return sendJson(res, 429, { error: "rate" });
  try {
    await init().catch(() => {});
    const update = await readBody(req);
    await telegram.handleUpdate(update || {});
    return sendJson(res, 200, { ok: true });
  } catch {
    return sendJson(res, 400, { error: "bad" });
  }
};
