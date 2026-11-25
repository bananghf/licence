# THE BEAUTY FLIGHT PLAN

Сайт менторства beauty-бізнесу Анни Павлюк: послуги, філософія бренду, відгуки, заявка на консультацію.

```bash
npm install
npm run build
npm start
```

Сайт: http://127.0.0.1:4173

## Telegram-бот для заявок

Окремий бот лише для Beauty Flight. Не використовуйте токен/пароль від «Щастя Є».

1. Секрет `BF_TELEGRAM_BOT_TOKEN` — токен нового бота
2. Секрет `BF_TELEGRAM_BOT_PASSWORD` — пароль доступу
3. Відкрийте бота → `/start` → надішліть пароль → заявки з форми йдуть вам
4. `/stop` — вимкнути сповіщення на цьому акаунті

Опційно: `BF_TELEGRAM_CHAT_ID` як запасний отримувач.

## Структура

- `content/default.json` — тексти та наповнення
- `lib/render.js` — HTML з контенту
- `lib/sanitize.js` — валідація контенту й заявок
- `lib/telegram.js` — webhook і сповіщення
- `css/`, `js/`, `images/` — фронтенд
