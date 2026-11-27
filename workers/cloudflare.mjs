/**
 * Cloudflare Workers entry.
 * Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_PASSWORD, SITE_URL
 * Storage: D1 binding DB (no Neon / DATABASE_URL needed)
 */
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { httpServerHandler } from "cloudflare:node";

const require = createRequire(import.meta.url);
const store = require("../lib/store.js");
const { handler } = require("../server-app.js");

function applyEnv(env) {
  if (!env || typeof env !== "object") return;
  for (const key of [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_BOT_PASSWORD",
    "TELEGRAM_JOIN_CODE",
    "TELEGRAM_CHAT_ID",
    "TELEGRAM_WEBHOOK_SECRET",
    "SITE_URL",
  ]) {
    if (env[key]) process.env[key] = String(env[key]);
  }
  if (env.DB) store.setD1(env.DB);
}

const server = createServer(handler);
server.listen(8080);

const nodeHandler = httpServerHandler({ port: 8080 });

export default {
  async fetch(request, env, ctx) {
    applyEnv(env);
    return nodeHandler.fetch(request, env, ctx);
  },
};
