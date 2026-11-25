# THE BEAUTY FLIGHT PLAN

Сайт менторства beauty-бізнесу Анни Павлюк: послуги, філософія бренду, відгуки, заявка на консультацію.

```bash
npm install
npm run build
npm start
```

Сайт: http://127.0.0.1:4173

## Telegram-бот для заявок

1. Секрет `TELEGRAM_BOT_TOKEN` — токен бота
2. Секрет `TELEGRAM_BOT_PASSWORD` — пароль доступу (або `TELEGRAM_JOIN_CODE`)
3. Відкрийте бота → `/start` → надішліть пароль → заявки з форми йдуть вам
4. `/stop` — вимкнути сповіщення на цьому акаунті

Опційно: `TELEGRAM_CHAT_ID` як запасний отримувач.

## Структура

- `content/default.json` — тексти та наповнення
- `lib/render.js` — HTML з контенту
- `lib/sanitize.js` — валідація контенту й заявок
- `lib/telegram.js` — webhook і сповіщення
- `css/`, `js/`, `images/` — фронтенд
