const { init, getContent, saveContent } = require("../lib/store");
const { isAuthed } = require("../lib/auth");
const { sendJson, readBody, csrf } = require("../lib/api-util");

let ready;
function ensure() {
  if (!ready) ready = init().catch(() => {});
  return ready;
}

module.exports = async function content(req, res) {
  await ensure();
  if (req.method === "GET") {
    if (!isAuthed(req.headers.cookie)) return sendJson(res, 401, { error: "auth" });
    return sendJson(res, 200, await getContent());
  }
  if (req.method === "PUT") {
    if (!csrf(req) || !isAuthed(req.headers.cookie)) return sendJson(res, 401, { error: "auth" });
    try {
      const body = await readBody(req);
      return sendJson(res, 200, await saveContent(body));
    } catch {
      return sendJson(res, 400, { error: "bad" });
    }
  }
  return sendJson(res, 405, { error: "method" });
};
