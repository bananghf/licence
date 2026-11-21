const { init } = require("../lib/store");
const telegram = require("../lib/telegram");
const { sendJson } = require("../lib/api-util");

let webhookKick = null;

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "method" });
  await init().catch(() => {});
  if (!webhookKick) {
    webhookKick = telegram.ensureWebhook().catch(() => ({ ok: false }));
  }
  const hook = await webhookKick;
  if (hook && hook.ok === false) webhookKick = null;
  const info = await telegram.webhookInfo().catch(() => null);
  return sendJson(res, 200, {
    ok: true,
    webhook: Boolean(hook && hook.ok),
    webhookUrl: info && info.url ? info.url.replace(/([?&]k=)[^&]+/i, "$1***") : "",
    pending: info ? info.pending : null,
    lastError: info ? info.lastError : "",
  });
};
