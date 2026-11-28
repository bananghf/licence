# Деплой на Cloudflare Workers

Сайт THE BEAUTY FLIGHT PLAN: статика + API заявок + Telegram webhook.

## 1. Що потрібно

- Акаунт [Cloudflare](https://dash.cloudflare.com)
- Node.js 20+
- Postgres (Neon / Supabase / Hyperdrive) — для заявок і підписок у боті
- Секрети Telegram (лише Beauty Flight, не від «Щастя Є»):
  `BF_TELEGRAM_BOT_TOKEN`, `BF_TELEGRAM_BOT_PASSWORD`

## 2. Команди

```bash
npm install
npm install -D wrangler
npm run build

npx wrangler secret put BF_TELEGRAM_BOT_TOKEN
npx wrangler secret put BF_TELEGRAM_BOT_PASSWORD
npx wrangler secret put DATABASE_URL

npx wrangler deploy
```

Після деплою відкрийте `https://ВАШ_ДОМЕН/api/health` — має бути `"ok":true` і `"webhook":true`.
