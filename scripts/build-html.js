const fs = require("fs");
const path = require("path");
const { renderPage } = require("../lib/render");
const content = require("../content/default.json");

const html = renderPage(content, process.env.SITE_URL || "https://schastia.apps.grok.bot");
fs.writeFileSync(path.join(__dirname, "..", "index.html"), html);
console.log("index.html");
