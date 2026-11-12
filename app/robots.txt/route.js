export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = (process.env.SITE_URL || "https://schastia.apps.grok.bot").replace(/\/$/, "");
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin.html\nSitemap: ${siteUrl}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
