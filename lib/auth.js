const crypto = require("crypto");

const COOKIE = "schastia_admin";
const WEEK = 7 * 24 * 60 * 60 * 1000;

function password() {
  const value = process.env.ADMIN_PASSWORD;
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length >= 8 ? trimmed : "";
}

function configured() {
  return password().length > 0;
}

function sign(exp) {
  const body = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", password()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function tokenValid(token) {
  if (!configured() || typeof token !== "string" || !token.includes(".")) return false;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", password()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function readCookie(header) {
  if (!header) return "";
  const parts = header.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${COOKIE}=`));
  return found ? decodeURIComponent(found.slice(COOKIE.length + 1)) : "";
}

function sessionCookie(secure) {
  const token = sign(Date.now() + WEEK);
  const flags = [`${COOKIE}=${encodeURIComponent(token)}`, "HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${WEEK / 1000}`];
  if (secure) flags.push("Secure");
  return flags.join("; ");
}

function clearCookie(secure) {
  const flags = [`${COOKIE}=`, "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0"];
  if (secure) flags.push("Secure");
  return flags.join("; ");
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
  return tokenValid(readCookie(cookieHeader));
}

module.exports = { configured, checkPassword, isAuthed, sessionCookie, clearCookie };
