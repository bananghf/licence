import { isAuthed } from "../../../lib/next-http";

export const runtime = "nodejs";

export async function GET(request) {
  const ok = isAuthed(request.headers.get("cookie") || "");
  return Response.json({ ok }, { status: ok ? 200 : 401 });
}
