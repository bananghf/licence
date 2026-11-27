/**
 * Cloudflare Workers entry.
 * Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_PASSWORD
 * Bindings: DB (D1), ASSETS (static files from ./public)
 */
import store from "../lib/store.js";
import telegram from "../lib/telegram.js";
import { limited } from "../lib/api-util.js";

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

function json(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function nodeishRequest(request) {
  const headers = Object.create(null);
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  const ip = headers["cf-connecting-ip"] || headers["x-forwarded-for"] || "";
  return {
    method: request.method,
    url: request.url,
    headers,
    socket: { remoteAddress: String(ip).split(",")[0].trim() },
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleApi(request, env) {
  applyEnv(env);
  const url = new URL(request.url);
  const pathname = url.pathname;
  const req = nodeishRequest(request);

  if (request.method === "GET" && pathname === "/api/health") {
    await store.init().catch(() => {});
    const hook = await telegram.ensureWebhook().catch(() => ({ ok: false }));
    const info = await telegram.webhookInfo().catch(() => null);
    return json(200, {
      ok: true,
      webhook: Boolean(hook && hook.ok),
      webhookUrl: info && info.url ? info.url.replace(/([?&]k=)[^&]+/i, "$1***") : "",
      pending: info ? info.pending : null,
      lastError: info ? info.lastError : "",
    });
  }

  if (
    request.method === "POST" &&
    (pathname === "/api/telegram/webhook" || pathname === "/api/telegram-webhook")
  ) {
    if (!telegram.verifyWebhook(req)) return json(401, { error: "webhook" });
    if (limited("tg-hook", 120, 60 * 1000)) return json(429, { error: "rate" });
    await store.init().catch(() => {});
    await telegram.handleUpdate((await readJson(request)) || {});
    return json(200, { ok: true });
  }

  if (request.method === "POST" && pathname === "/api/leads") {
    const ip = req.socket.remoteAddress || "unknown";
    if (limited(`lead:${ip}`, 5, 60 * 60 * 1000)) return json(429, { error: "rate" });
    await store.init().catch(() => {});
    telegram.ensureWebhook().catch(() => {});
    const lead = await store.addLead(await readJson(request));
    if (!lead) return json(400, { error: "invalid" });
    await telegram.notifyLead(lead);
    return json(201, { ok: true });
  }

  return null;
}

export default {
  async fetch(request, env, ctx) {
    applyEnv(env);

    const apiResponse = await handleApi(request, env);
    if (apiResponse) return apiResponse;

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("Not found", { status: 404 });
  },
};
