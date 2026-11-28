const { init, addLead } = require("../lib/store");
const { notifyLead, ensureWebhook } = require("../lib/telegram");
const { clientIp, limited, sendJson, readBody } = require("../lib/api-util");

module.exports = async function handler(req, res) {
  await init().catch(() => {});
  ensureWebhook().catch(() => {});
  if (req.method === "POST") {
    if (limited(`lead:${clientIp(req)}`, 5, 60 * 60 * 1000)) return sendJson(res, 429, { error: "rate" });
    try {
      const body = await readBody(req);
      const lead = await addLead(body);
      if (!lead) return sendJson(res, 400, { error: "invalid" });
      await notifyLead(lead);
      return sendJson(res, 201, { ok: true });
    } catch {
      return sendJson(res, 400, { error: "bad" });
    }
  }
  return sendJson(res, 405, { error: "method" });
};
