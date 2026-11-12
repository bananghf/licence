import { configured, isAuthed } from "../../../lib/next-http";
import { configured as telegramConfigured } from "../../../lib/telegram";

export const runtime = "nodejs";

export async function GET(request) {
  if (!isAuthed(request.headers.get("cookie") || "")) {
    return Response.json({ error: "auth" }, { status: 401 });
  }
  return Response.json({
    adminConfigured: configured(),
    telegramConfigured: telegramConfigured(),
  });
}
