import { getContent, init } from "../../../lib/store";
import { renderPage } from "../../../lib/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await init().catch(() => {});
  const siteUrl = process.env.SITE_URL || "https://schastia.apps.grok.bot";
  const html = renderPage(await getContent(), siteUrl);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
