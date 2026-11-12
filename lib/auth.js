const crypto = require("crypto");

const COOKIE = "schastia_admin";
const TTL = 12 * 60 * 60 * 1000;
const revoked = new Set();
const MAX_REVOKED = 500;

function password() {
  const value = process.env.ADMIN_PASSWORD;
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length >= 8 ? trimmed : "";
}

function configured() {
  return password().length > 0;
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", password()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function parseToken(token) {
  if (!configured() || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", password()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
    if (typeof payload.sid !== "string" || payload.sid.length < 16) return null;
    if (revoked.has(payload.sid)) return null;
    return payload;
  } catch {
    return null;
  }
}

function readCookie(header) {
  if (!header) return "";
  const parts = header.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${COOKIE}=`));
  return found ? decodeURIComponent(found.slice(COOKIE.length + 1)) : "";
}

function sessionCookie(secureFlag) {
  const sid = crypto.randomBytes(24).toString("base64url");
  const token = sign({ exp: Date.now() + TTL, sid });
  const flags = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${TTL / 1000}`,
  ];
  if (secureFlag) flags.push("Secure");
  return flags.join("; ");
}

function clearCookie(secureFlag) {
  const flags = [`${COOKIE}=`, "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0"];
  if (secureFlag) flags.push("Secure");
  return flags.join("; ");
}

function revokeFromCookie(cookieHeader) {
  const payload = parseToken(readCookie(cookieHeader));
  if (!payload) return;
  revoked.add(payload.sid);
  if (revoked.size > MAX_REVOKED) {
    const first = revoked.values().next().value;
    revoked.delete(first);
  }
}

function checkPassword(input) {
  if (!configured() || typeof input !== "string") return false;
  const given = Buffer.from(input);
  const real = Buffer.from(password());
  if (given.length !== real.length) {
    crypto.timingSafeEqual(real, real);
    return false;
  }
  return crypto.timingSafeEqual(given, real);
}

function isAuthed(cookieHeader) {
  return Boolean(parseToken(readCookie(cookieHeader)));
}

module.exports = {
  configured,
  checkPassword,
  isAuthed,
  sessionCookie,
  clearCookie,
  revokeFromCookie,
};
