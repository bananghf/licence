# Деплой на Cloudflare Workers

Сайт «Щастя Є»: статика + API заявок + Telegram webhook.

## 1. Що потрібно

- Акаунт [Cloudflare](https://dash.cloudflare.com)
- Node.js 20+
- Postgres (Neon / Supabase / Hyperdrive) — для заявок і підписок у боті
- Секрети Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_PASSWORD`

## 2. Файли

Архів проєкту: усе з репозиторію (див. zip). Важливе:

| Шлях | Навіщо |
|------|--------|
| `workers/cloudflare.mjs` | Точка входу Workers |
| `wrangler.toml` | Конфіг Cloudflare |
| `server-app.js` | Логіка сайту + API |
| `public/` | CSS, JS, фото |
| `content/default.json` | Тексти сайту |
| `migrations/*.sql` | Таблиці Postgres |

## 3. Команди

```bash
npm install
npm install -D wrangler
npm run build

# підставте свій домен у wrangler.toml → [vars] SITE_URL
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_BOT_PASSWORD
npx wrangler secret put DATABASE_URL

npx wrangler deploy
```

Після деплою відкрийте `https://ВАШ_ДОМЕН/api/health` — має бути `"ok":true` і `"webhook":true`.

У Telegram-боті: `/start` → пароль → заявки.

## 4. База даних

Виконайте SQL з `migrations/001_init.sql` і `migrations/002_telegram_chats.sql` у своєму Postgres.

На Workers звичайний `pg` краще через **Cloudflare Hyperdrive** (прив’язка в `wrangler.toml`) або Neon connection string у `DATABASE_URL`.

## 5. Домен

Workers → Custom domains → додайте свій домен. Оновіть `SITE_URL` і знову `wrangler deploy`, щоб Telegram webhook вказував на правильний URL.
