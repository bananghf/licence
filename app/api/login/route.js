import {
  configured,
  checkPassword,
  sessionCookie,
  hasCsrf,
  isSecure,
  clientIp,
  limited,
} from "../../../lib/next-http";

export const runtime = "nodejs";

export async function POST(request) {
  if (!hasCsrf(request)) return Response.json({ error: "csrf" }, { status: 403 });
  if (!configured()) return Response.json({ error: "unconfigured" }, { status: 503 });
  if (limited(`login:${clientIp(request)}`, 8, 15 * 60 * 1000)) {
    return Response.json({ error: "rate" }, { status: 429 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad" }, { status: 400 });
  }
  if (!checkPassword(body.password)) return Response.json({ error: "auth" }, { status: 401 });
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": sessionCookie(isSecure(request)) } }
  );
}
