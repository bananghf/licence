import { init, addLead, listLeads } from "../../../lib/store";
import { isAuthed, clientIp, limited } from "../../../lib/next-http";
import { notifyLead } from "../../../lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  await init().catch(() => {});
  if (!isAuthed(request.headers.get("cookie") || "")) {
    return Response.json({ error: "auth" }, { status: 401 });
  }
  return Response.json(await listLeads());
}

export async function POST(request) {
  await init().catch(() => {});
  if (limited(`lead:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return Response.json({ error: "rate" }, { status: 429 });
  }
  try {
    const body = await request.json();
    const lead = await addLead(body);
    if (!lead) return Response.json({ error: "invalid" }, { status: 400 });
    await notifyLead(lead);
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "bad" }, { status: 400 });
  }
}
