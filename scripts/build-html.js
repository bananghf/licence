const fs = require("fs");
const path = require("path");
const { renderPage } = require("../lib/render");
const content = require("../content/default.json");

const siteUrl = (process.env.SITE_URL || "https://schastia.apps.grok.bot").replace(/\/$/, "");
const root = path.join(__dirname, "..");
const html = renderPage(content, siteUrl);
const robots = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`;
const urls = ["", "#pro-mene", "#poslugy", "#tools", "#filosofiya", "#vidguky", "#kontakty"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((item) => `  <url><loc>${siteUrl}/${item}</loc></url>`)
  .join("\n")}\n</urlset>\n`;

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

for (const dir of [root, path.join(root, "public")]) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  fs.writeFileSync(path.join(dir, "robots.txt"), robots);
  fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemap);
}

copyDir(path.join(root, "css"), path.join(root, "public", "css"));
copyDir(path.join(root, "js"), path.join(root, "public", "js"));
copyDir(path.join(root, "fonts"), path.join(root, "public", "fonts"));
copyDir(path.join(root, "images"), path.join(root, "public", "images"));
fs.copyFileSync(path.join(root, "favicon.svg"), path.join(root, "public", "favicon.svg"));

console.log("index.html robots.txt sitemap.xml public assets");
