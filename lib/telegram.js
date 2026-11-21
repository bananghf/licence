const crypto = require("crypto");
const store = require("./store");
const { limited } = require("./api-util");

const siteUrl = () => String(process.env.SITE_URL || "https://schastia.apps.grok.bot").replace(/\/$/, "");

function botToken() {
  return String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
}

/** Password for /start — strangers without it cannot subscribe. */
function botPassword() {
  return String(process.env.TELEGRAM_BOT_PASSWORD || process.env.TELEGRAM_JOIN_CODE || "").trim();
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

function passwordsMatch(input, expected) {
  if (!expected) return false;
  const a = Buffer.from(String(input || "").trim().normalize("NFKC"));
  const b = Buffer.from(String(expected).trim().normalize("NFKC"));
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function extractPasswordAttempt(text) {
  const raw = String(text || "").trim();
  if (!raw) return { kind: "empty", value: "" };
  const start = raw.match(/^\/start(?:@\w+)?(?:\s+([\s\S]+))?$/i);
  if (start) {
    const value = String(start[1] || "").trim();
    return { kind: value ? "password" : "start", value };
  }
  if (/^\/stop(?:@\w+)?$/i.test(raw)) return { kind: "stop", value: "" };
  if (/^\/help(?:@\w+)?$/i.test(raw)) return { kind: "help", value: "" };
  if (/^\/\w+/i.test(raw)) return { kind: "other", value: "" };
  return { kind: "password", value: raw };
}

async function isSubscribed(chatId) {
  const rows = await store.listTelegramChats();
  return rows.some((row) => String(row.chatId) === String(chatId));
}

async function handleUpdate(update) {
  const message = update && update.message;
  if (!message || !message.chat || message.chat.type !== "private") return { ok: true };

  const chatId = String(message.chat.id);
  const password = botPassword();
  const parsed = extractPasswordAttempt(message.text);
  const subscribed = await isSubscribed(chatId);

  if (parsed.kind === "stop") {
    await store.removeTelegramChat(chatId);
    await sendMessage(
      chatId,
      "Готово. Заявки з сайту більше не приходять сюди.\nЩоб знову підключитись: /start і введіть пароль."
    );
    return { ok: true };
  }

  if (parsed.kind === "help") {
    await sendMessage(
      chatId,
      password
        ? "1) Натисніть /start\n2) Надішліть пароль доступу\n3) Заявки з сайту почнуть приходити сюди\n\nВимкнути: /stop"
        : "Бот ще без пароля. Додайте секрет TELEGRAM_BOT_PASSWORD у Cursor."
    );
    return { ok: true };
  }

  if (parsed.kind === "start") {
    if (subscribed) {
      await sendMessage(chatId, "Ви вже підключені — заявки з сайту приходять сюди.\nВимкнути: /stop");
      return { ok: true };
    }
    await sendMessage(
      chatId,
      password
        ? "Вітаю. Щоб отримувати заявки з сайту «Щастя Є», надішліть пароль доступу одним повідомленням."
        : "Пароль бота ще не задано. Додайте секрет TELEGRAM_BOT_PASSWORD у Cursor."
    );
    return { ok: true };
  }

  if (parsed.kind === "password") {
    if (!password) {
      await sendMessage(chatId, "Пароль бота ще не задано. Додайте секрет TELEGRAM_BOT_PASSWORD у Cursor.");
      return { ok: true };
    }
    if (limited(`tg-pass:${chatId}`, 5, 15 * 60 * 1000)) {
      await sendMessage(chatId, "Забагато спроб. Зачекайте 15 хвилин і спробуйте знову.");
      return { ok: true };
    }
    if (!passwordsMatch(parsed.value, password)) {
      await sendMessage(chatId, "Невірний пароль. Спробуйте ще раз.");
      return { ok: true };
    }
    await store.addTelegramChat({
      chatId,
      title: displayName(message.from),
    });
    await sendMessage(
      chatId,
      "Пароль прийнято. Нові заявки з сайту «Щастя Є» будуть приходити сюди.\nВимкнути: /stop"
    );
    return { ok: true };
  }

  if (!subscribed) {
    await sendMessage(chatId, "Натисніть /start і надішліть пароль доступу, щоб отримувати заявки.");
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
    passwordConfigured: Boolean(botPassword()),
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
