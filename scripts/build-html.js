const fs = require("fs");
const path = require("path");
const { renderPage } = require("../lib/render");
const content = require("../content/default.json");

const siteUrl = (process.env.SITE_URL || "https://schastia.apps.grok.bot").replace(/\/$/, "");
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "index.html"), renderPage(content, siteUrl));
fs.writeFileSync(
  path.join(publicDir, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin.html\nSitemap: ${siteUrl}/sitemap.xml\n`
);
const urls = ["", ...content.services.map((service) => `#${service.id}`), "#kontakty"];
fs.writeFileSync(
  path.join(publicDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((item) => `  <url><loc>${siteUrl}/${item}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
console.log("public/index.html robots.txt sitemap.xml");
