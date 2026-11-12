function configured() {
  const token = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chat = String(process.env.TELEGRAM_CHAT_ID || "").trim();
  return /^\d+:[A-Za-z0-9_-]{20,}$/.test(token) && /^-?\d{5,20}$/.test(chat);
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

async function notifyLead(lead) {
  if (!configured()) return { ok: false, skipped: true };
  const token = String(process.env.TELEGRAM_BOT_TOKEN).trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID).trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatLead(lead),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { configured, notifyLead, formatLead };
