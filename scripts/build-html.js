const fs = require("fs");
const path = require("path");
const { renderPage } = require("../lib/render");
const content = require("../content/default.json");

const siteUrl = (process.env.SITE_URL || "https://schastia.apps.grok.bot").replace(/\/$/, "");
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const html = renderPage(content, siteUrl);
const robots = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`;
const urls = ["", ...content.services.map((service) => `#${service.id}`), "#kontakty"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((item) => `  <url><loc>${siteUrl}/${item}</loc></url>`)
  .join("\n")}\n</urlset>\n`;

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

fs.mkdirSync(publicDir, { recursive: true });
for (const dir of [root, publicDir]) {
  fs.writeFileSync(path.join(dir, "index.html"), html);
  fs.writeFileSync(path.join(dir, "robots.txt"), robots);
  fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemap);
}

for (const name of ["css", "js", "images", "fonts"]) {
  copyDir(path.join(root, name), path.join(publicDir, name));
}
const favicon = path.join(root, "favicon.svg");
if (fs.existsSync(favicon)) fs.copyFileSync(favicon, path.join(publicDir, "favicon.svg"));

console.log("index.html robots.txt sitemap.xml + public assets");
