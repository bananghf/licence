# Деплой на Cloudflare (без Neon / DATABASE_URL)

Сайт + заявки + Telegram `/start` + пароль. Дані в **Cloudflare D1**. Статика з папки `public/`.

## Що вводити в секрети

Тільки 2 секрети:

1. `TELEGRAM_BOT_TOKEN` — токен з @BotFather  
2. `TELEGRAM_BOT_PASSWORD` — пароль, який ти сам придумаєш (його пишуть у боті після Start)

**DATABASE_URL більше не потрібен.**

Невірний пароль → бот відповідає: `❌ Невірний пароль. Спробуйте ще раз.`

## Команди

```bash
npm install
npm install -D wrangler
npm run build

# 1) Створити D1
npx wrangler d1 create schastia
# Скопіюй database_id у wrangler.toml → [[d1_databases]].database_id

# 2) Створити таблиці
npx wrangler d1 execute schastia --remote --file=./migrations/d1.sql

# 3) Секрети (назва секрету — слова TELEGRAM_..., значення — токен/пароль)
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_BOT_PASSWORD

# 4) Деплой
npx wrangler deploy
```

Після деплою Wrangler покаже URL на кшталт `https://schastia.<account>.workers.dev`.

Встав його в `wrangler.toml`:

```toml
SITE_URL = "https://schastia.<account>.workers.dev"
```

і знову:

```bash
npx wrangler deploy
```

Перевірка: відкрий `https://ТВІЙ_URL/api/health`  
У боті: `/start` → пароль → заявки. `/stop` — вимкнути.

## Власний домен (nic.ua)

1. Додай сайт у Cloudflare (DNS)  
2. Workers → schastia → Settings → Domains & Routes → Add Custom Domain  
3. Онови `SITE_URL` на `https://твій-домен` і зроби `npx wrangler deploy`
