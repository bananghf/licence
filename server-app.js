const fs = require("fs");
const path = require("path");
const { init, getContent, addLead } = require("./lib/store");
const { renderPage } = require("./lib/render");
const telegram = require("./lib/telegram");
const { clientIp, limited, sendJson, readBody } = require("./lib/api-util");

const root = __dirname;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};
const publicPrefixes = ["/css/", "/js/", "/images/", "/fonts/"];

function siteUrl() {
  return String(process.env.SITE_URL || "https://schastia.apps.grok.bot").replace(/\/$/, "");
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Cache-Control": "no-store", ...headers });
  res.end(body);
}

function publicFile(urlPath) {
  if (urlPath.includes("\0") || urlPath.includes("..")) return null;
  const allowed =
    publicPrefixes.some((prefix) => urlPath.startsWith(prefix)) ||
    urlPath === "/favicon.svg" ||
    urlPath === "/robots.txt" ||
    urlPath === "/sitemap.xml" ||
    urlPath === "/index.html";
  if (!allowed) return null;
  const candidates = [path.resolve(root, `.${urlPath}`), path.resolve(root, `public${urlPath}`)];
  for (const file of candidates) {
    if ((file.startsWith(root + path.sep) || file === root) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return file;
    }
  }
  return null;
}

async function handler(req, res) {
  try {
    let pathname;
    try {
      const url = new URL(req.url || "/", "http://localhost");
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return send(res, 400, "Bad request");
    }

    const base = siteUrl();

    if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      const html = renderPage(await getContent(), base);
      return send(res, 200, html, { "Content-Type": "text/html; charset=utf-8" });
    }
    if (req.method === "GET" && pathname === "/robots.txt") {
      return send(res, 200, `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`, {
        "Content-Type": "text/plain; charset=utf-8",
      });
    }
    if (req.method === "GET" && pathname === "/sitemap.xml") {
      const content = await getContent();
      const urls = ["", ...content.services.map((service) => `#${service.id}`), "#kontakty"];
      const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((item) => `  <url><loc>${base}/${item}</loc></url>`)
        .join("\n")}\n</urlset>\n`;
      return send(res, 200, body, { "Content-Type": "application/xml; charset=utf-8" });
    }
    if (req.method === "GET" && pathname === "/api/health") {
      await init().catch(() => {});
      const hook = await telegram.ensureWebhook().catch(() => ({ ok: false }));
      const info = await telegram.webhookInfo().catch(() => null);
      return sendJson(res, 200, {
        ok: true,
        webhook: Boolean(hook && hook.ok),
        webhookUrl: info && info.url ? info.url.replace(/([?&]k=)[^&]+/i, "$1***") : "",
        pending: info ? info.pending : null,
        lastError: info ? info.lastError : "",
      });
    }
    if (
      req.method === "POST" &&
      (pathname === "/api/telegram/webhook" || pathname === "/api/telegram-webhook")
    ) {
      if (!telegram.verifyWebhook(req)) return sendJson(res, 401, { error: "webhook" });
      if (limited("tg-hook", 120, 60 * 1000)) return sendJson(res, 429, { error: "rate" });
      await init().catch(() => {});
      const update = await readBody(req);
      await telegram.handleUpdate(update || {});
      return sendJson(res, 200, { ok: true });
    }
    if (req.method === "POST" && pathname === "/api/leads") {
      if (limited(`lead:${clientIp(req)}`, 5, 60 * 60 * 1000)) return sendJson(res, 429, { error: "rate" });
      await init().catch(() => {});
      telegram.ensureWebhook().catch(() => {});
      const lead = await addLead(await readBody(req));
      if (!lead) return sendJson(res, 400, { error: "invalid" });
      await telegram.notifyLead(lead);
      return sendJson(res, 201, { ok: true });
    }
    if (req.method === "GET") {
      const file = publicFile(pathname);
      if (file) {
        return send(res, 200, fs.readFileSync(file), {
          "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
          "Cache-Control": "public, max-age=3600",
        });
      }
    }
    send(res, 404, "Not found");
  } catch {
    send(res, 400, "Bad request");
  }
}

function boot(port = Number(process.env.PORT) || 4173) {
  const http = require("http");
  return http.createServer(handler).listen(port, "0.0.0.0", () => {
    console.log(`listening ${port}`);
    init()
      .catch((err) => {
        console.error("db init skipped", err && err.message ? err.message : "error");
      })
      .finally(() => {
        telegram.ensureWebhook().catch(() => {});
      });
  });
}

module.exports = { handler, boot, siteUrl };
