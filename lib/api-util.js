const attempts = new Map();

function clientIp(req) {
  // Prefer the last X-Forwarded-For hop (appended by the proxy). Ignore X-Real-IP:
  // visitors can set it and would bypass rate limits if we trusted it first.
  const forwarded = String(req.headers["x-forwarded-for"] || "");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return String((req.socket && req.socket.remoteAddress) || "");
}

function limited(key, max, windowMs) {
  const now = Date.now();
  const row = attempts.get(key) || [];
  const fresh = row.filter((time) => now - time < windowMs);
  if (!fresh.length) {
    attempts.delete(key);
  }
  if (fresh.length >= max) {
    attempts.set(key, fresh);
    return true;
  }
  fresh.push(now);
  attempts.set(key, fresh);
  return false;
}

function sendJson(res, status, value, headers = {}) {
  const body = JSON.stringify(value);
  if (typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    Object.entries(headers).forEach(([key, val]) => res.setHeader(key, val));
  }
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(status).json(value);
  }
  if (typeof res.statusCode === "number" || "statusCode" in res) {
    res.statusCode = status;
    if (!res.getHeader || !res.getHeader("Content-Type")) {
      try {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        Object.entries(headers).forEach(([key, val]) => res.setHeader(key, val));
      } catch { /* already sent */ }
    }
    return res.end(body);
  }
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function csrf(req) {
  return req.headers["x-schastia"] === "1";
}

function secure(req) {
  return req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
}

async function readBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string" && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
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

module.exports = {
  clientIp,
  limited,
  sendJson,
  csrf,
  secure,
  readBody,
};
