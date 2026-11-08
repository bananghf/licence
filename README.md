# Щастя CRM

Операційна CRM для кейтерингу з **постійною SQLite-базою**, **логіном** і REST API.  
Орієнтир по функціоналу — [Caiter](https://caiter.ru/) (не копія бренду/UI). Продукт: **Щастя CRM**.

Це **робочий production-фундамент** для денної роботи менеджера (замовлення, смети, ТТК→закупки, клієнти, платежі), а не browser-only демо. Повного паритету з SaaS Caiter (Bitrix24, WhatsApp, multi-tenant billing, мобільні додатки) **немає** — це наступна фаза.

## Запуск на Mac (один шлях)

Потрібен **Node.js LTS** (18+). Docker не потрібен.

```bash
git clone https://github.com/bananghf/licence.git
cd licence
git checkout cursor/caiter-crm-panel-646b
npm install
npm run dev
```

Відкрийте **http://localhost:5173** — спочатку має з’явитись екран **Вхід** (`/login`).

- UI (Vite): `http://localhost:5173`
- API (Express): `http://localhost:8787`
- База: файл `data/shastya.sqlite` (створюється автоматично)

`npm run dev` піднімає **API + фронт разом** (concurrently).

### Якщо вже клонували раніше (Mac)

Старий MVP зберігав дані лише в `localStorage` і **не мав логіну** (футер «Дані зберігаються локально»). Потрібна гілка з auth:

```bash
cd licence
# зупиніть старий Vite/Node (Ctrl+C у терміналі або):
# pkill -f "vite" ; pkill -f "tsx watch server"
git fetch origin
git checkout cursor/caiter-crm-panel-646b
git pull origin cursor/caiter-crm-panel-646b
npm install
npm run dev
```

Відкрийте `http://localhost:5173` (hard refresh: Cmd+Shift+R). Має бути форма входу, не одразу дашборд.

### Облікові записи (seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Адмін | `admin@shastya.local` | `admin123` |
| Менеджер | `manager@shastya.local` | `manager123` |

Після першого запуску вже є демо-компанія, каталог з ТТК, замовлення, закупки й складські залишки.

## Збірка

```bash
npm run build
```

Збирає фронт (`dist/`) і перевіряє TypeScript API (`server/dist/`).

Прод-запуск API після збірки фронта:

```bash
npm run build:web
npm start
```

(для продакшену віддайте `dist/` через nginx/caddy і проксіруйте `/api` на порт 8787)

## Що вже production-ready

- JWT-логін, захист API, ролі admin/manager
- CRUD: замовлення (+ рядки сметы, платежі), каталог (з ТТК/BOM), контакти, компанії, закупки, склад, налаштування
- Серверні розрахунки: підсумок / знижка / націнка / собівартість / маржа / статус оплати
- Генерація закупок з ТТК продуктів; статус «Отримано» збільшує залишки на складі
- Склад: залишки, оприбуткування, списання, історія рухів (`stock_levels` / `stock_movements`)
- Optimistic UI на фронті + персистенція в SQLite
- Seed демо-даних, CSV-експорт замовлень/каталогу, audit log (admin)
- Публічне КП: `/p/:id` для опублікованих замовлень

## Наступна фаза (поза цим PR)

- Bitrix24 / WhatsApp інтеграції
- Multi-tenant SaaS / білінг
- Нативні мобільні додатки
- PDF/PPT, мульти-варіанти смет «Стандарт/Преміум», автосписання з ТТК на кухні
- Хмарний хостинг з бекапами (зараз — локальний файл SQLite)

## Корисні команди

```bash
npm run seed          # пересіяти демо (очищує бізнес-дані)
npm run dev:api       # лише API
npm run dev:web       # лише Vite
```

Змінні оточення (опційно):

- `PORT` — порт API (за замовчуванням 8787)
- `DATABASE_PATH` — шлях до SQLite
- `JWT_SECRET` — секрет токенів (змініть у проді)
