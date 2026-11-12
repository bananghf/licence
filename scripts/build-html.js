const fs = require("fs");
const path = require("path");
const { renderPage } = require("../lib/render");
const content = require("../content/default.json");

const siteUrl = (process.env.SITE_URL || "https://schastia.apps.grok.bot").replace(/\/$/, "");
const root = path.join(__dirname, "..");
const html = renderPage(content, siteUrl);
const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin.html\nSitemap: ${siteUrl}/sitemap.xml\n`;
const urls = ["", ...content.services.map((service) => `#${service.id}`), "#kontakty"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((item) => `  <url><loc>${siteUrl}/${item}</loc></url>`)
  .join("\n")}\n</urlset>\n`;

for (const dir of [root, path.join(root, "public")]) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  fs.writeFileSync(path.join(dir, "robots.txt"), robots);
  fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemap);
}
console.log("index.html robots.txt sitemap.xml");
