const crypto = require("crypto");
const store = require("./store");

const siteUrl = () => String(process.env.SITE_URL || "https://schastia.apps.grok.bot").replace(/\/$/, "");

function botToken() {
  return String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
}

function joinCode() {
  return String(process.env.TELEGRAM_JOIN_CODE || "").trim();
}

function envChatId() {
  const chat = String(process.env.TELEGRAM_CHAT_ID || "").trim();
  return /^-?\d{5,20}$/.test(chat) ? chat : "";
}

function tokenOk() {
  return /^\d+:[A-Za-z0-9_-]{20,}$/.test(botToken());
}

function webhookSecret() {
  const explicit = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  if (explicit) return explicit.slice(0, 256);
  if (!tokenOk()) return "";
  return crypto.createHmac("sha256", botToken()).update("schastia-webhook").digest("hex").slice(0, 48);
}

function configured() {
  return tokenOk();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatLead(lead) {
  const lines = [
    "<b>Нова заявка з сайту «Щастя Є»</b>",
    `Ім’я: ${escapeHtml(lead.name)}`,
    `Телефон: ${escapeHtml(lead.phone)}`,
  ];
  if (lead.eventType || lead.event_type) lines.push(`Формат: ${escapeHtml(lead.eventType || lead.event_type)}`);
  if (lead.eventDate || lead.event_date) lines.push(`Дата: ${escapeHtml(lead.eventDate || lead.event_date)}`);
  if (lead.guests) lines.push(`Гостей: ${escapeHtml(lead.guests)}`);
  if (lead.message) lines.push(`Коментар: ${escapeHtml(lead.message)}`);
  return lines.join("\n");
}

async function api(method, body) {
  if (!tokenOk()) return { ok: false, skipped: true };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok && data.ok !== false, data };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

async function sendMessage(chatId, text, extra = {}) {
  return api("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

async function recipientIds() {
  const fromStore = await store.listTelegramChats();
  const ids = fromStore.map((row) => String(row.chatId));
  const seed = envChatId();
  if (seed && !ids.includes(seed)) ids.push(seed);
  return ids;
}

async function notifyLead(lead) {
  if (!configured()) return { ok: false, skipped: true };
  const ids = await recipientIds();
  if (!ids.length) return { ok: false, skipped: true };
  const text = formatLead(lead);
  const results = await Promise.all(ids.map((chatId) => sendMessage(chatId, text)));
  return { ok: results.some((item) => item.ok) };
}

function displayName(from = {}) {
  const parts = [from.first_name, from.last_name].filter(Boolean).join(" ").trim();
  if (from.username) return parts ? `${parts} (@${from.username})` : `@${from.username}`;
  return parts || "Telegram";
}

function codesMatch(input, expected) {
  if (!expected) return false;
  return String(input || "").trim().toLowerCase() === expected.toLowerCase();
}

function extractJoinAttempt(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const start = raw.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  if (start) return String(start[1] || "").trim();
  if (/^\/\w+/i.test(raw)) return "";
  return raw;
}

async function handleUpdate(update) {
  const message = update && update.message;
  if (!message || !message.chat || message.chat.type !== "private") return { ok: true };
  const chatId = String(message.chat.id);
  const text = String(message.text || "").trim();
  const code = joinCode();

  if (/^\/stop(?:@\w+)?$/i.test(text)) {
    await store.removeTelegramChat(chatId);
    await sendMessage(chatId, "Готово. Заявки з сайту більше не будуть приходити сюди.\nЩоб знову підключитись — надішліть код доступу.");
    return { ok: true };
  }

  if (/^\/help(?:@\w+)?$/i.test(text)) {
    await sendMessage(
      chatId,
      code
        ? "Щоб отримувати заявки з сайту «Щастя Є», надішліть код доступу.\nЩоб вимкнути — /stop"
        : "Бот ще не налаштований: потрібен секрет TELEGRAM_JOIN_CODE."
    );
    return { ok: true };
  }

  const attempt = extractJoinAttempt(text);
  if (codesMatch(attempt, code)) {
    await store.addTelegramChat({
      chatId,
      title: displayName(message.from),
    });
    await sendMessage(
      chatId,
      "Підключено. Нові заявки з сайту «Щастя Є» будуть приходити сюди.\nЩоб вимкнути — /stop"
    );
    return { ok: true };
  }

  if (/^\/start(?:@\w+)?/i.test(text) || attempt) {
    await sendMessage(
      chatId,
      code
        ? "Щоб підключити сповіщення, надішліть код доступу одним повідомленням.\nАбо: /start КОД"
        : "Код доступу ще не задано. Додайте секрет TELEGRAM_JOIN_CODE у Cursor і спробуйте знову."
    );
    return { ok: true };
  }

  return { ok: true };
}

function verifyWebhook(req) {
  const expected = webhookSecret();
  if (!expected) return false;
  const got = String(req.headers["x-telegram-bot-api-secret-token"] || "");
  if (!got || got.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function ensureWebhook() {
  if (!configured()) return { ok: false, skipped: true };
  const secret = webhookSecret();
  if (!secret) return { ok: false, skipped: true };
  return api("setWebhook", {
    url: `${siteUrl()}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: false,
  });
}

async function getBotProfile() {
  if (!configured()) return null;
  const result = await api("getMe", {});
  if (!result.ok || !result.data || !result.data.result) return null;
  const bot = result.data.result;
  return {
    id: bot.id,
    username: bot.username || "",
    name: bot.first_name || "",
    link: bot.username ? `https://t.me/${bot.username}` : "",
  };
}

async function status() {
  const chats = await store.listTelegramChats();
  const seed = envChatId();
  const recipients = chats.map((row) => ({
    chatId: row.chatId,
    title: row.title,
    createdAt: row.createdAt,
  }));
  if (seed && !recipients.some((row) => row.chatId === seed)) {
    recipients.push({ chatId: seed, title: "З секрету TELEGRAM_CHAT_ID", createdAt: null });
  }
  return {
    telegramConfigured: configured(),
    joinCodeConfigured: Boolean(joinCode()),
    recipientCount: recipients.length,
    recipients,
    bot: await getBotProfile(),
  };
}

module.exports = {
  configured,
  notifyLead,
  formatLead,
  handleUpdate,
  verifyWebhook,
  ensureWebhook,
  status,
  getBotProfile,
};
