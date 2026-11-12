import { init, getContent, saveContent } from "../../../lib/store";
import { isAuthed, hasCsrf } from "../../../lib/next-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  await init().catch(() => {});
  if (!isAuthed(request.headers.get("cookie") || "")) {
    return Response.json({ error: "auth" }, { status: 401 });
  }
  return Response.json(await getContent());
}

export async function PUT(request) {
  await init().catch(() => {});
  if (!hasCsrf(request) || !isAuthed(request.headers.get("cookie") || "")) {
    return Response.json({ error: "auth" }, { status: 401 });
  }
  try {
    const body = await request.json();
    return Response.json(await saveContent(body));
  } catch {
    return Response.json({ error: "bad" }, { status: 400 });
  }
}
