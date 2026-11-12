const http = require("http");
const fs = require("fs");
const path = require("path");
const { init, getContent, saveContent, addLead, listLeads } = require("./lib/store");
const { renderPage } = require("./lib/render");
const { configured, checkPassword, isAuthed, sessionCookie, clearCookie } = require("./lib/auth");
const telegram = require("./lib/telegram");

const root = __dirname;
const port = Number(process.env.PORT) || 4173;
const siteUrl = process.env.SITE_URL || "https://schastia.apps.grok.bot";
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
const attempts = new Map();

function clientIp(req) {
  const real = String(req.headers["x-real-ip"] || "").trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(real) || real.includes(":")) return real;
  const forwarded = String(req.headers["x-forwarded-for"] || "");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    // Proxies append the real client; the first value is client-spoofable.
    const candidate = parts[parts.length - 1] || "";
    if (candidate) return candidate;
  }
  return String(req.socket.remoteAddress || "");
}

function limited(key, max, windowMs) {
  const now = Date.now();
  const row = attempts.get(key) || [];
  const fresh = row.filter((time) => now - time < windowMs);
  if (fresh.length >= max) {
    attempts.set(key, fresh);
    return true;
  }
  fresh.push(now);
  attempts.set(key, fresh);
  return false;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Cache-Control": "no-store", ...headers });
  res.end(body);
}

function json(res, status, value, headers) {
  send(res, status, JSON.stringify(value), { "Content-Type": "application/json; charset=utf-8", ...headers });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 250_000) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error("bad json")); }
    });
    req.on("error", reject);
  });
}

function secure(req) {
  return req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
}

function csrf(req) {
  return req.headers["x-schastia"] === "1";
}

function publicFile(urlPath) {
  if (urlPath.includes("\0") || urlPath.includes("..")) return null;
  const allowed =
    publicPrefixes.some((prefix) => urlPath.startsWith(prefix)) ||
    urlPath === "/favicon.svg" ||
    urlPath === "/admin.html" ||
    urlPath === "/robots.txt" ||
    urlPath === "/sitemap.xml";
  if (!allowed) return null;
  const file = path.resolve(root, `.${urlPath}`);
  if (!file.startsWith(root + path.sep)) return null;
  return file;
}

async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      const html = renderPage(await getContent(), siteUrl);
      return send(res, 200, html, { "Content-Type": "text/html; charset=utf-8" });
    }
    if (req.method === "GET" && (pathname === "/admin" || pathname === "/admin.html")) {
      const file = path.join(root, "admin.html");
      return send(res, 200, fs.readFileSync(file), { "Content-Type": "text/html; charset=utf-8" });
    }
    if (req.method === "GET" && pathname === "/robots.txt") {
      return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin.html\nSitemap: ${siteUrl}/sitemap.xml\n`, { "Content-Type": "text/plain; charset=utf-8" });
    }
    if (req.method === "GET" && pathname === "/sitemap.xml") {
      const content = await getContent();
      const urls = ["", ...content.services.map((service) => `#${service.id}`), "#kontakty"];
      const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((item) => `  <url><loc>${siteUrl}/${item}</loc></url>`)
        .join("\n")}\n</urlset>\n`;
      return send(res, 200, body, { "Content-Type": "application/xml; charset=utf-8" });
    }
    if (req.method === "GET" && pathname === "/api/session") {
      return json(res, isAuthed(req.headers.cookie) ? 200 : 401, { ok: isAuthed(req.headers.cookie) });
    }
    if (req.method === "GET" && pathname === "/api/content") {
      if (!isAuthed(req.headers.cookie)) return json(res, 401, { error: "auth" });
      return json(res, 200, await getContent());
    }
    if (req.method === "GET" && pathname === "/api/leads") {
      if (!isAuthed(req.headers.cookie)) return json(res, 401, { error: "auth" });
      return json(res, 200, await listLeads());
    }
    if (req.method === "POST" && pathname === "/api/login") {
      if (!csrf(req)) return json(res, 403, { error: "csrf" });
      if (!configured()) return json(res, 503, { error: "unconfigured" });
      if (limited(`login:${clientIp(req)}`, 8, 15 * 60 * 1000)) return json(res, 429, { error: "rate" });
      const body = await readBody(req);
      if (!checkPassword(body.password)) return json(res, 401, { error: "auth" });
      return json(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(secure(req)) });
    }
    if (req.method === "POST" && pathname === "/api/logout") {
      if (!csrf(req)) return json(res, 403, { error: "csrf" });
      return json(res, 200, { ok: true }, { "Set-Cookie": clearCookie(secure(req)) });
    }
    if (req.method === "PUT" && pathname === "/api/content") {
      if (!csrf(req) || !isAuthed(req.headers.cookie)) return json(res, 401, { error: "auth" });
      const body = await readBody(req);
      return json(res, 200, await saveContent(body));
    }
    if (req.method === "POST" && pathname === "/api/leads") {
      if (limited(`lead:${clientIp(req)}`, 5, 60 * 60 * 1000)) return json(res, 429, { error: "rate" });
      const body = await readBody(req);
      const lead = await addLead(body);
      if (!lead) return json(res, 400, { error: "invalid" });
      await telegram.notifyLead(lead);
      return json(res, 201, { ok: true });
    }
    if (req.method === "GET" && pathname === "/api/status") {
      if (!isAuthed(req.headers.cookie)) return json(res, 401, { error: "auth" });
      return json(res, 200, {
        adminConfigured: configured(),
        telegramConfigured: telegram.configured(),
      });
    }
    if (req.method === "GET" && pathname === "/api/health") {
      return json(res, 200, { ok: true });
    }
    if (req.method === "GET") {
      const file = publicFile(pathname);
      if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
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

http.createServer(handler).listen(port, "0.0.0.0", () => {
  console.log(`listening ${port}`);
  init().catch((err) => {
    console.error("db init skipped", err && err.message ? err.message : "error");
  });
});
