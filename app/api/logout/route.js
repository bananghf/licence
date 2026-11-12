import { clearCookie, hasCsrf, isSecure } from "../../../lib/next-http";

export const runtime = "nodejs";

export async function POST(request) {
  if (!hasCsrf(request)) return Response.json({ error: "csrf" }, { status: 403 });
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearCookie(isSecure(request)) } }
  );
}
