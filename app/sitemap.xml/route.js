import { getContent, init } from "../../lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await init().catch(() => {});
  const siteUrl = (process.env.SITE_URL || "https://schastia.apps.grok.bot").replace(/\/$/, "");
  const content = await getContent();
  const urls = ["", ...content.services.map((service) => `#${service.id}`), "#kontakty"];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((item) => `  <url><loc>${siteUrl}/${item}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
