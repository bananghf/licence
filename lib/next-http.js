const { clientIp, limited } = require("./api-util");
const { configured, checkPassword, isAuthed, sessionCookie, clearCookie } = require("./auth");

function headerMap(request) {
  return Object.fromEntries(request.headers.entries());
}

function hasCsrf(request) {
  return request.headers.get("x-schastia") === "1";
}

function isSecure(request) {
  return request.headers.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
}

function requestIp(request) {
  return clientIp({
    headers: headerMap(request),
    socket: { remoteAddress: request.headers.get("x-real-ip") || "" },
  });
}

module.exports = {
  clientIp: requestIp,
  limited,
  hasCsrf,
  isSecure,
  isAuthed,
  configured,
  checkPassword,
  sessionCookie,
  clearCookie,
  headerMap,
};
