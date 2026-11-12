const { init, addLead, listLeads } = require("../lib/store");
const { isAuthed } = require("../lib/auth");
const telegram = require("../lib/telegram");
const { sendJson, readBody, clientIp, limited } = require("../lib/api-util");

let ready;
function ensure() {
  if (!ready) ready = init().catch(() => {});
  return ready;
}

module.exports = async function leads(req, res) {
  await ensure();
  if (req.method === "GET") {
    if (!isAuthed(req.headers.cookie)) return sendJson(res, 401, { error: "auth" });
    return sendJson(res, 200, await listLeads());
  }
  if (req.method === "POST") {
    if (limited(`lead:${clientIp(req)}`, 5, 60 * 60 * 1000)) return sendJson(res, 429, { error: "rate" });
    try {
      const body = await readBody(req);
      const lead = await addLead(body);
      if (!lead) return sendJson(res, 400, { error: "invalid" });
      await telegram.notifyLead(lead);
      return sendJson(res, 201, { ok: true });
    } catch {
      return sendJson(res, 400, { error: "bad" });
    }
  }
  return sendJson(res, 405, { error: "method" });
};
