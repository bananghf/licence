const fs = require("fs");
const path = require("path");
const defaults = require("../content/default.json");
const { sanitize, leadInput } = require("./sanitize");

const dataDir = path.join(__dirname, "..", "data");
const contentFile = path.join(dataDir, "content.json");
const leadsFile = path.join(dataDir, "leads.json");
const telegramFile = path.join(dataDir, "telegram-chats.json");

let d1 = null;
let pool;
let queue = Promise.resolve();
let initPromise;
let initDone = false;

/** Cloudflare D1 binding (preferred on Workers). */
function setD1(binding) {
  d1 = binding || null;
  initDone = false;
  initPromise = null;
}

function db() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    try {
      const { Pool } = require("pg");
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 3,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
      });
      pool.on("error", () => {});
    } catch {
      return null;
    }
  }
  return pool;
}

function enqueue(job) {
  const run = queue.then(job, job);
  queue = run.then(() => {}, () => {});
  return run;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

async function initD1() {
  if (!d1) return;
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS site_content (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        body TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    )
    .run();
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        event_type TEXT NOT NULL DEFAULT '',
        event_date TEXT NOT NULL DEFAULT '',
        guests TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    )
    .run();
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS telegram_chats (
        chat_id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    )
    .run();
}

async function init() {
  if (initDone) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      if (d1) {
        await initD1();
        return;
      }
      const database = db();
      if (!database) return;
      await database.query(`
        CREATE TABLE IF NOT EXISTS site_content (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          body JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await database.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          event_type TEXT NOT NULL DEFAULT '',
          event_date TEXT NOT NULL DEFAULT '',
          guests TEXT NOT NULL DEFAULT '',
          message TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await database.query(`
        CREATE TABLE IF NOT EXISTS telegram_chats (
          chat_id TEXT PRIMARY KEY,
          title TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
    } catch {
      /* File fallback remains available. */
    } finally {
      initDone = true;
    }
  })();
  return initPromise;
}

function cleanChatId(value) {
  const chatId = String(value || "").trim();
  return /^-?\d{5,20}$/.test(chatId) ? chatId : "";
}

async function listTelegramChats() {
  await init().catch(() => {});
  if (d1) {
    try {
      const result = await d1
        .prepare(`SELECT chat_id AS chatId, title, created_at AS createdAt FROM telegram_chats ORDER BY created_at ASC`)
        .all();
      return result.results || [];
    } catch {
      return [];
    }
  }
  const database = db();
  if (database) {
    try {
      const result = await database.query(
        `SELECT chat_id AS "chatId", title, created_at AS "createdAt"
         FROM telegram_chats ORDER BY created_at ASC`
      );
      return result.rows;
    } catch {
      /* Fall through. */
    }
  }
  return readJson(telegramFile, []).slice(0, 100);
}

async function addTelegramChat(input) {
  await init().catch(() => {});
  const chatId = cleanChatId(input && input.chatId);
  if (!chatId) return null;
  const title = String((input && input.title) || "Telegram").trim().slice(0, 120) || "Telegram";
  if (d1) {
    try {
      await d1
        .prepare(
          `INSERT INTO telegram_chats (chat_id, title, created_at)
           VALUES (?, ?, datetime('now'))
           ON CONFLICT(chat_id) DO UPDATE SET title = excluded.title`
        )
        .bind(chatId, title)
        .run();
      return { chatId, title, createdAt: new Date().toISOString() };
    } catch {
      return null;
    }
  }
  const database = db();
  if (database) {
    try {
      const result = await database.query(
        `INSERT INTO telegram_chats (chat_id, title, created_at)
         VALUES ($1, $2, now())
         ON CONFLICT (chat_id) DO UPDATE SET title = EXCLUDED.title
         RETURNING chat_id AS "chatId", title, created_at AS "createdAt"`,
        [chatId, title]
      );
      return result.rows[0] || null;
    } catch {
      /* Fall through to file storage. */
    }
  }
  return enqueue(async () => {
    const rows = readJson(telegramFile, []);
    const next = rows.filter((row) => String(row.chatId) !== chatId);
    const row = { chatId, title, createdAt: new Date().toISOString() };
    next.push(row);
    writeJson(telegramFile, next.slice(-100));
    return row;
  });
}

async function removeTelegramChat(chatIdInput) {
  await init().catch(() => {});
  const chatId = cleanChatId(chatIdInput);
  if (!chatId) return false;
  if (d1) {
    try {
      const result = await d1.prepare(`DELETE FROM telegram_chats WHERE chat_id = ?`).bind(chatId).run();
      return Boolean(result.meta && result.meta.changes > 0);
    } catch {
      return false;
    }
  }
  const database = db();
  if (database) {
    try {
      const result = await database.query("DELETE FROM telegram_chats WHERE chat_id = $1", [chatId]);
      return result.rowCount > 0;
    } catch {
      /* Fall through. */
    }
  }
  return enqueue(async () => {
    const rows = readJson(telegramFile, []);
    const next = rows.filter((row) => String(row.chatId) !== chatId);
    writeJson(telegramFile, next);
    return next.length !== rows.length;
  });
}

async function getContent() {
  await init().catch(() => {});
  if (d1) {
    try {
      const row = await d1.prepare(`SELECT body FROM site_content WHERE id = 1`).first();
      if (row && row.body) {
        const body = typeof row.body === "string" ? JSON.parse(row.body) : row.body;
        return sanitize(body, defaults);
      }
    } catch {
      /* Fall through. */
    }
  }
  const database = db();
  if (database) {
    try {
      const result = await database.query("SELECT body FROM site_content WHERE id = 1");
      if (result.rows[0]) return sanitize(result.rows[0].body, defaults);
    } catch {
      /* Fall through. */
    }
  }
  return sanitize(readJson(contentFile, defaults), defaults);
}

async function saveContent(input) {
  await init().catch(() => {});
  const clean = sanitize(input, defaults);
  if (d1) {
    try {
      await d1
        .prepare(
          `INSERT INTO site_content (id, body, updated_at)
           VALUES (1, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET body = excluded.body, updated_at = datetime('now')`
        )
        .bind(JSON.stringify(clean))
        .run();
      return clean;
    } catch {
      /* Fall through. */
    }
  }
  const database = db();
  if (database) {
    try {
      await database.query(
        `INSERT INTO site_content (id, body, updated_at)
         VALUES (1, $1::jsonb, now())
         ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body, updated_at = now()`,
        [JSON.stringify(clean)]
      );
      return clean;
    } catch {
      /* Fall through to file storage. */
    }
  }
  return enqueue(async () => {
    writeJson(contentFile, clean);
    return clean;
  });
}

async function addLead(input) {
  await init().catch(() => {});
  const lead = leadInput(input);
  if (!lead) return null;
  if (d1) {
    try {
      const result = await d1
        .prepare(
          `INSERT INTO leads (name, phone, event_type, event_date, guests, message, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
           RETURNING id, name, phone, event_type, event_date, guests, message, created_at`
        )
        .bind(lead.name, lead.phone, lead.eventType, lead.eventDate, lead.guests, lead.message)
        .first();
      if (result) {
        return {
          id: result.id,
          name: result.name,
          phone: result.phone,
          event_type: result.event_type,
          event_date: result.event_date,
          guests: result.guests,
          message: result.message,
          created_at: result.created_at,
        };
      }
    } catch {
      /* Fall through. */
    }
  }
  const database = db();
  if (database) {
    try {
      const result = await database.query(
        `INSERT INTO leads (name, phone, event_type, event_date, guests, message)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, phone, event_type, event_date, guests, message, created_at`,
        [lead.name, lead.phone, lead.eventType, lead.eventDate, lead.guests, lead.message]
      );
      return result.rows[0];
    } catch {
      /* Fall through to file storage. */
    }
  }
  return enqueue(async () => {
    const leads = readJson(leadsFile, []);
    const row = { id: Date.now(), ...lead, createdAt: new Date().toISOString() };
    leads.unshift(row);
    writeJson(leadsFile, leads.slice(0, 200));
    return row;
  });
}

async function listLeads() {
  await init().catch(() => {});
  if (d1) {
    try {
      const result = await d1
        .prepare(
          `SELECT id, name, phone, event_type AS eventType, event_date AS eventDate,
                  guests, message, created_at AS createdAt
           FROM leads ORDER BY created_at DESC LIMIT 100`
        )
        .all();
      return result.results || [];
    } catch {
      return [];
    }
  }
  const database = db();
  if (database) {
    try {
      const result = await database.query(
        `SELECT id, name, phone, event_type AS "eventType", event_date AS "eventDate",
                guests, message, created_at AS "createdAt"
         FROM leads ORDER BY created_at DESC LIMIT 100`
      );
      return result.rows;
    } catch {
      /* Fall through. */
    }
  }
  return readJson(leadsFile, []).slice(0, 100);
}

module.exports = {
  setD1,
  init,
  getContent,
  saveContent,
  addLead,
  listLeads,
  listTelegramChats,
  addTelegramChat,
  removeTelegramChat,
  defaults,
};
