import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import {
  clearBusinessData,
  db,
  replaceOrder,
  replacePurchase,
  saveSettings,
  upsertCatalogRow,
  upsertCompanyRow,
  upsertContactRow,
} from './db.js'
import type {
  AppSettings,
  CatalogItem,
  CrmState,
  Order,
  Purchase,
} from './types.js'

const ADMIN_EMAIL = 'admin@shastya.local'
const ADMIN_PASSWORD = 'admin123'
const MANAGER_EMAIL = 'manager@shastya.local'
const MANAGER_PASSWORD = 'manager123'

const now = new Date()
const iso = (d: Date) => d.toISOString()
const daysFromNow = (n: number, hours = 12) => {
  const d = new Date(now)
  d.setDate(d.getDate() + n)
  d.setHours(hours, 0, 0, 0)
  return iso(d)
}

const managers = ['Олена Кравчук', 'Андрій Мельник', 'Ірина Савчук']

const companyIds = {
  vinnytsia: 'co_ithub',
  agro: 'co_agro',
  bank: 'co_bank',
  wedding: 'co_wedding',
}

const contactIds = {
  marina: 'ct_marina',
  serhiy: 'ct_serhiy',
  oksana: 'ct_oksana',
  dmytro: 'ct_dmytro',
  yulia: 'ct_yulia',
}

const cat = (
  id: string,
  kind: CatalogItem['kind'],
  name: string,
  category: string,
  unit: string,
  price: number,
  cost: number,
  tags: string[] = [],
): CatalogItem => ({
  id,
  kind,
  name,
  category,
  unit,
  price,
  cost,
  tags,
  composition: [],
  active: true,
})

const products: CatalogItem[] = [
  cat('pr_canape', 'product', 'Канапе з лососем', 'Закуски', 'порц.', 85, 42, ['риба', 'холодне']),
  cat('pr_bruschetta', 'product', 'Брускети з томатами', 'Закуски', 'порц.', 55, 22, ['веган', 'холодне']),
  cat('pr_cheese', 'product', 'Сирна тарілка', 'Закуски', 'шт.', 420, 210, ['сир']),
  cat('pr_meat', 'product', 'Мʼясна тарілка', 'Закуски', 'шт.', 480, 250, ['мʼясо']),
  cat('pr_caesar', 'product', 'Цезар з куркою', 'Салати', 'порц.', 145, 68, ['курка']),
  cat('pr_greek', 'product', 'Грецький салат', 'Салати', 'порц.', 120, 45, ['вегетаріанське']),
  cat('pr_borsch', 'product', 'Борщ український', 'Супи', 'порц.', 95, 35, ['традиційне']),
  cat('pr_mushroom', 'product', 'Крем-суп з грибів', 'Супи', 'порц.', 110, 48, ['гриби']),
  cat('pr_turkey', 'product', 'Стейк з індички', 'Гаряче', 'порц.', 260, 140, ['мʼясо']),
  cat('pr_zander', 'product', 'Філе судака', 'Гаряче', 'порц.', 290, 160, ['риба']),
  cat('pr_risotto', 'product', 'Ризото з овочами', 'Гаряче', 'порц.', 180, 75, ['вегетаріанське']),
  cat('pr_gratin', 'product', 'Картопля гратен', 'Гарніри', 'порц.', 75, 28, []),
  cat('pr_veggrill', 'product', 'Овочі гриль', 'Гарніри', 'порц.', 85, 32, ['веган']),
  cat('pr_tiramisu', 'product', 'Тірамісу', 'Десерти', 'порц.', 95, 40, ['солодке']),
  cat('pr_cheesecake', 'product', 'Чізкейк', 'Десерти', 'порц.', 110, 48, ['солодке']),
  cat('pr_fruit', 'product', 'Фруктова тарілка', 'Десерти', 'шт.', 350, 160, ['фрукти']),
  cat('pr_coffee', 'product', 'Кава / чай сет', 'Напої', 'порц.', 45, 12, ['напої']),
  cat('pr_lemonade', 'product', 'Лимонад домашній', 'Напої', 'л', 90, 25, ['напої']),
  cat('pr_box_office', 'product', 'Ланч-бокс «Офіс»', 'Бокси', 'шт.', 220, 95, ['доставка']),
  cat('pr_box_biz', 'product', 'Ланч-бокс «Бізнес»', 'Бокси', 'шт.', 280, 120, ['доставка']),
]

const services: CatalogItem[] = [
  cat('sv_serve', 'service', 'Сервірування столів', 'Сервіс', 'година', 450, 180, ['зал']),
  cat('sv_waiter', 'service', 'Офіціант', 'Сервіс', 'година', 250, 150, ['персонал']),
  cat('sv_barman', 'service', 'Бармен', 'Бар', 'година', 280, 170, ['бар']),
  cat('sv_dishes', 'service', 'Оренда посуду', 'Оренда', 'компл.', 35, 8, ['посуд']),
  cat('sv_textile', 'service', 'Оренда текстилю', 'Оренда', 'компл.', 55, 15, ['декор']),
  cat('sv_delivery', 'service', 'Доставка по місту', 'Логістика', 'рейс', 400, 180, ['доставка']),
  cat('sv_manager', 'service', 'Менеджер події', 'Координація', 'подія', 1500, 0, ['менеджмент']),
  cat('sv_decor', 'service', 'Оформлення залу', 'Декор', 'подія', 3500, 1200, ['декор']),
]

const ingredients: CatalogItem[] = [
  cat('ing_salmon', 'ingredient', 'Лосось свіжий', 'Риба', 'кг', 0, 780, ['риба']),
  cat('ing_chicken', 'ingredient', 'Куряче філе', 'Мʼясо', 'кг', 0, 165, ['мʼясо']),
  cat('ing_turkey', 'ingredient', 'Індичка', 'Мʼясо', 'кг', 0, 210, ['мʼясо']),
  cat('ing_zander', 'ingredient', 'Судак', 'Риба', 'кг', 0, 320, ['риба']),
  cat('ing_mozzarella', 'ingredient', 'Сир моцарела', 'Молочка', 'кг', 0, 280, ['сир']),
  cat('ing_parmesan', 'ingredient', 'Сир пармезан', 'Молочка', 'кг', 0, 520, ['сир']),
  cat('ing_cherry', 'ingredient', 'Помідори чері', 'Овочі', 'кг', 0, 95, ['овочі']),
  cat('ing_iceberg', 'ingredient', 'Салат айсберг', 'Овочі', 'кг', 0, 70, ['овочі']),
  cat('ing_potato', 'ingredient', 'Картопля', 'Овочі', 'кг', 0, 22, ['овочі']),
  cat('ing_mushroom', 'ingredient', 'Гриби печериці', 'Овочі', 'кг', 0, 85, ['гриби']),
  cat('ing_rice', 'ingredient', 'Рис арборіо', 'Бакалія', 'кг', 0, 140, ['крупи']),
  cat('ing_oil', 'ingredient', 'Олія оливкова', 'Бакалія', 'л', 0, 320, ['олія']),
  cat('ing_coffee', 'ingredient', 'Кава зернова', 'Напої', 'кг', 0, 480, ['кава']),
  cat('ing_sugar', 'ingredient', 'Цукор', 'Бакалія', 'кг', 0, 32, []),
  cat('ing_cream', 'ingredient', 'Вершки 33%', 'Молочка', 'л', 0, 145, ['молочка']),
  cat('ing_lemon', 'ingredient', 'Лимони', 'Фрукти', 'кг', 0, 65, ['фрукти']),
  cat('ing_berries', 'ingredient', 'Ягоди мікс', 'Фрукти', 'кг', 0, 280, ['фрукти']),
  cat('ing_baguette', 'ingredient', 'Хліб багет', 'Випічка', 'шт.', 0, 28, ['хліб']),
]

const catalog = [...products, ...services, ...ingredients]
const findCat = (name: string) => {
  const item = catalog.find((c) => c.name === name)
  if (!item) throw new Error(`Catalog item missing: ${name}`)
  return item
}

function setComposition(dish: string, lines: [string, number][]) {
  const product = findCat(dish)
  product.composition = lines.map(([ing, qty]) => ({
    ingredientId: findCat(ing).id,
    qty,
  }))
}

setComposition('Канапе з лососем', [
  ['Лосось свіжий', 0.035],
  ['Хліб багет', 0.15],
  ['Олія оливкова', 0.005],
])
setComposition('Брускети з томатами', [
  ['Помідори чері', 0.04],
  ['Хліб багет', 0.2],
  ['Олія оливкова', 0.008],
])
setComposition('Сирна тарілка', [
  ['Сир моцарела', 0.15],
  ['Сир пармезан', 0.08],
])
setComposition('Мʼясна тарілка', [
  ['Куряче філе', 0.2],
  ['Індичка', 0.15],
])
setComposition('Цезар з куркою', [
  ['Куряче філе', 0.08],
  ['Салат айсберг', 0.06],
  ['Сир пармезан', 0.015],
])
setComposition('Грецький салат', [
  ['Помідори чері', 0.08],
  ['Сир моцарела', 0.04],
  ['Олія оливкова', 0.01],
])
setComposition('Борщ український', [
  ['Картопля', 0.08],
  ['Куряче філе', 0.03],
])
setComposition('Крем-суп з грибів', [
  ['Гриби печериці', 0.1],
  ['Вершки 33%', 0.04],
  ['Картопля', 0.04],
])
setComposition('Стейк з індички', [
  ['Індичка', 0.22],
  ['Олія оливкова', 0.01],
])
setComposition('Філе судака', [
  ['Судак', 0.2],
  ['Лимони', 0.02],
  ['Олія оливкова', 0.008],
])
setComposition('Ризото з овочами', [
  ['Рис арборіо', 0.08],
  ['Гриби печериці', 0.04],
  ['Сир пармезан', 0.02],
])
setComposition('Картопля гратен', [
  ['Картопля', 0.2],
  ['Вершки 33%', 0.05],
  ['Сир моцарела', 0.03],
])
setComposition('Овочі гриль', [
  ['Помідори чері', 0.06],
  ['Олія оливкова', 0.01],
])
setComposition('Тірамісу', [
  ['Вершки 33%', 0.05],
  ['Цукор', 0.02],
  ['Кава зернова', 0.005],
])
setComposition('Чізкейк', [
  ['Сир моцарела', 0.08],
  ['Вершки 33%', 0.04],
  ['Цукор', 0.025],
  ['Ягоди мікс', 0.03],
])
setComposition('Фруктова тарілка', [
  ['Ягоди мікс', 0.25],
  ['Лимони', 0.05],
])
setComposition('Кава / чай сет', [
  ['Кава зернова', 0.012],
  ['Цукор', 0.01],
])
setComposition('Лимонад домашній', [
  ['Лимони', 0.12],
  ['Цукор', 0.08],
])
setComposition('Ланч-бокс «Офіс»', [
  ['Куряче філе', 0.12],
  ['Салат айсберг', 0.05],
  ['Картопля', 0.15],
])
setComposition('Ланч-бокс «Бізнес»', [
  ['Індичка', 0.15],
  ['Рис арборіо', 0.08],
  ['Салат айсберг', 0.05],
])

function line(item: CatalogItem, qty: number, section: string): Order['lines'][number] {
  return {
    id: nanoid(8),
    catalogItemId: item.id,
    name: item.name,
    kind: item.kind,
    unit: item.unit,
    qty,
    price: item.price,
    cost: item.cost,
    section,
  }
}

const defaultSettings: AppSettings = {
  companyName: 'Щастя — кейтеринг',
  logoText: 'Щастя CRM',
  currency: '₴',
  timezone: 'Europe/Kyiv',
  managers,
  paymentAccounts: ['Безготівка', 'Готівка', 'Термінал', 'LiqPay'],
  trackPayments: true,
  serviceTypes: [
    { id: 'banquet', label: 'Банкет' },
    { id: 'buffet', label: 'Фуршет' },
    { id: 'coffee', label: 'Кава-брейк' },
    { id: 'delivery', label: 'Доставка' },
    { id: 'box', label: 'Ланч-бокси' },
    { id: 'bar', label: 'Бар' },
  ],
  orderStatuses: [
    { id: 'draft', label: 'Чернетка', color: '#8a8578' },
    { id: 'new', label: 'Нове', color: '#2f6fed' },
    { id: 'sent', label: 'Надіслано', color: '#c47a12' },
    { id: 'confirmed', label: 'Підтверджено', color: '#0f7a4d' },
    { id: 'done', label: 'Виконано', color: '#1f4d3a' },
    { id: 'lost', label: 'Втрачено', color: '#b42318' },
  ],
}

export function buildDemoState(): CrmState {
  const orders: Order[] = [
    {
      id: 'ord_1042',
      number: 'З-1042',
      title: 'Корпоратив «Агрохолдинг» — ювілей 15 років',
      status: 'confirmed',
      serviceType: 'banquet',
      eventStart: daysFromNow(5, 18),
      eventEnd: daysFromNow(5, 23),
      guests: 80,
      portions: 80,
      address: 'м. Вінниця, вул. Соборна 24, Банкет-хол «Грація»',
      companyId: companyIds.agro,
      contactId: contactIds.serhiy,
      manager: managers[0],
      discountPercent: 5,
      markupPercent: 0,
      lines: [
        line(findCat('Канапе з лососем'), 80, 'Закуски'),
        line(findCat('Сирна тарілка'), 10, 'Закуски'),
        line(findCat('Мʼясна тарілка'), 10, 'Закуски'),
        line(findCat('Цезар з куркою'), 80, 'Салати'),
        line(findCat('Борщ український'), 80, 'Супи'),
        line(findCat('Стейк з індички'), 50, 'Гаряче'),
        line(findCat('Філе судака'), 30, 'Гаряче'),
        line(findCat('Картопля гратен'), 80, 'Гарніри'),
        line(findCat('Овочі гриль'), 80, 'Гарніри'),
        line(findCat('Тірамісу'), 80, 'Десерти'),
        line(findCat('Кава / чай сет'), 80, 'Напої'),
        line(findCat('Офіціант'), 48, 'Сервіс'),
        line(findCat('Сервірування столів'), 6, 'Сервіс'),
        line(findCat('Менеджер події'), 1, 'Координація'),
      ],
      payments: [
        {
          id: 'pay_1042a',
          amount: 25000,
          method: 'Безготівка',
          paidAt: daysFromNow(-10),
          note: 'Аванс 50%',
        },
      ],
      notes: 'Потрібні мікрофони та проектор — надає зал.',
      kitchenNotes: '2 гості — без глютену. 1 — вегетаріанець.',
      productionDate: daysFromNow(5, 10),
      published: true,
      createdAt: daysFromNow(-14),
      updatedAt: daysFromNow(-1),
    },
    {
      id: 'ord_1043',
      number: 'З-1043',
      title: 'Весілля Марина & Дмитро',
      status: 'sent',
      serviceType: 'banquet',
      eventStart: daysFromNow(18, 16),
      eventEnd: daysFromNow(19, 2),
      guests: 120,
      portions: 120,
      address: 'с. Вороновиця, садиба «Франція»',
      companyId: companyIds.wedding,
      contactId: contactIds.marina,
      manager: managers[1],
      discountPercent: 0,
      markupPercent: 8,
      lines: [
        line(findCat('Брускети з томатами'), 120, 'Закуски'),
        line(findCat('Канапе з лососем'), 120, 'Закуски'),
        line(findCat('Грецький салат'), 120, 'Салати'),
        line(findCat('Крем-суп з грибів'), 120, 'Супи'),
        line(findCat('Стейк з індички'), 70, 'Гаряче'),
        line(findCat('Ризото з овочами'), 50, 'Гаряче'),
        line(findCat('Чізкейк'), 120, 'Десерти'),
        line(findCat('Фруктова тарілка'), 15, 'Десерти'),
        line(findCat('Лимонад домашній'), 40, 'Напої'),
        line(findCat('Офіціант'), 80, 'Сервіс'),
        line(findCat('Бармен'), 16, 'Бар'),
        line(findCat('Оформлення залу'), 1, 'Декор'),
        line(findCat('Доставка по місту'), 2, 'Логістика'),
      ],
      payments: [],
      notes: 'КП надіслано нареченій. Чекаємо підтвердження меню.',
      published: true,
      createdAt: daysFromNow(-7),
      updatedAt: daysFromNow(-2),
    },
    {
      id: 'ord_1044',
      number: 'З-1044',
      title: 'Кава-брейк конференція банку',
      status: 'new',
      serviceType: 'coffee',
      eventStart: daysFromNow(2, 10),
      eventEnd: daysFromNow(2, 16),
      guests: 45,
      portions: 90,
      address: 'м. Вінниця, вул. Келецька 51, конференц-зал',
      companyId: companyIds.bank,
      contactId: contactIds.oksana,
      manager: managers[2],
      discountPercent: 0,
      markupPercent: 0,
      lines: [
        line(findCat('Брускети з томатами'), 45, 'Закуски'),
        line(findCat('Сирна тарілка'), 5, 'Закуски'),
        line(findCat('Кава / чай сет'), 90, 'Напої'),
        line(findCat('Лимонад домашній'), 15, 'Напої'),
        line(findCat('Тірамісу'), 45, 'Десерти'),
        line(findCat('Доставка по місту'), 1, 'Логістика'),
        line(findCat('Оренда посуду'), 45, 'Оренда'),
      ],
      payments: [
        {
          id: 'pay_1044a',
          amount: 8000,
          method: 'Картка',
          paidAt: daysFromNow(-1),
        },
      ],
      published: false,
      createdAt: daysFromNow(-3),
      updatedAt: daysFromNow(-1),
    },
    {
      id: 'ord_1045',
      number: 'З-1045',
      title: 'Ланч-бокси IT-офіс',
      status: 'done',
      serviceType: 'box',
      eventStart: daysFromNow(-3, 12),
      eventEnd: daysFromNow(-3, 14),
      guests: 30,
      portions: 30,
      address: 'м. Вінниця, вул. Пирогова 12',
      companyId: companyIds.vinnytsia,
      contactId: contactIds.yulia,
      manager: managers[0],
      discountPercent: 3,
      markupPercent: 0,
      lines: [
        line(findCat('Ланч-бокс «Бізнес»'), 20, 'Бокси'),
        line(findCat('Ланч-бокс «Офіс»'), 10, 'Бокси'),
        line(findCat('Доставка по місту'), 1, 'Логістика'),
      ],
      payments: [
        {
          id: 'pay_1045a',
          amount: 7000,
          method: 'Безготівка',
          paidAt: daysFromNow(-2),
        },
      ],
      published: false,
      createdAt: daysFromNow(-8),
      updatedAt: daysFromNow(-2),
    },
    {
      id: 'ord_1046',
      number: 'З-1046',
      title: 'Фуршет відкриття шоуруму',
      status: 'draft',
      serviceType: 'buffet',
      eventStart: daysFromNow(12, 17),
      eventEnd: daysFromNow(12, 21),
      guests: 60,
      portions: 60,
      address: 'м. Вінниця, вул. Коцюбинського 8',
      contactId: contactIds.dmytro,
      manager: managers[1],
      discountPercent: 0,
      markupPercent: 5,
      lines: [
        line(findCat('Канапе з лососем'), 60, 'Закуски'),
        line(findCat('Брускети з томатами'), 60, 'Закуски'),
        line(findCat('Мʼясна тарілка'), 6, 'Закуски'),
        line(findCat('Фруктова тарілка'), 6, 'Десерти'),
        line(findCat('Лимонад домашній'), 20, 'Напої'),
        line(findCat('Офіціант'), 20, 'Сервіс'),
      ],
      payments: [],
      notes: 'Чернетка — узгодити алкогольний бар окремо.',
      published: false,
      createdAt: daysFromNow(-1),
      updatedAt: daysFromNow(-1),
    },
    {
      id: 'ord_1038',
      number: 'З-1038',
      title: 'День народження директора',
      status: 'lost',
      serviceType: 'banquet',
      eventStart: daysFromNow(-20, 19),
      guests: 25,
      portions: 25,
      address: 'м. Вінниця',
      manager: managers[2],
      discountPercent: 0,
      markupPercent: 0,
      lines: [
        line(findCat('Цезар з куркою'), 25, 'Салати'),
        line(findCat('Стейк з індички'), 25, 'Гаряче'),
      ],
      payments: [],
      notes: 'Обрали іншу компанію через ціну залу.',
      published: false,
      createdAt: daysFromNow(-35),
      updatedAt: daysFromNow(-25),
    },
  ]

  const purchases: Purchase[] = [
    {
      id: 'pur_agro',
      title: 'Закупка під корпоратив Агрохолдинг',
      status: 'ordered',
      supplier: 'Метро Cash & Carry',
      orderIds: [orders[0].id],
      items: [
        {
          id: nanoid(8),
          ingredientId: findCat('Лосось свіжий').id,
          name: 'Лосось свіжий',
          unit: 'кг',
          qty: 4.5,
          price: 780,
        },
        {
          id: nanoid(8),
          ingredientId: findCat('Індичка').id,
          name: 'Індичка',
          unit: 'кг',
          qty: 12,
          price: 210,
        },
        {
          id: nanoid(8),
          ingredientId: findCat('Судак').id,
          name: 'Судак',
          unit: 'кг',
          qty: 8,
          price: 320,
        },
        {
          id: nanoid(8),
          ingredientId: findCat('Картопля').id,
          name: 'Картопля',
          unit: 'кг',
          qty: 25,
          price: 22,
        },
        {
          id: nanoid(8),
          ingredientId: findCat('Кава зернова').id,
          name: 'Кава зернова',
          unit: 'кг',
          qty: 2,
          price: 480,
        },
      ],
      dueDate: daysFromNow(3),
      createdAt: daysFromNow(-4),
    },
    {
      id: 'pur_bank',
      title: 'Кава-брейк банк — дрібниця',
      status: 'planned',
      supplier: 'Локальний ринок',
      orderIds: [orders[2].id],
      items: [
        {
          id: nanoid(8),
          ingredientId: findCat('Помідори чері').id,
          name: 'Помідори чері',
          unit: 'кг',
          qty: 3,
          price: 95,
        },
        {
          id: nanoid(8),
          ingredientId: findCat('Сир моцарела').id,
          name: 'Сир моцарела',
          unit: 'кг',
          qty: 2,
          price: 280,
        },
        {
          id: nanoid(8),
          ingredientId: findCat('Хліб багет').id,
          name: 'Хліб багет',
          unit: 'шт.',
          qty: 20,
          price: 28,
        },
        {
          id: nanoid(8),
          ingredientId: findCat('Лимони').id,
          name: 'Лимони',
          unit: 'кг',
          qty: 4,
          price: 65,
        },
      ],
      dueDate: daysFromNow(1),
      createdAt: daysFromNow(-1),
    },
    {
      id: 'pur_boxes',
      title: 'Ланч-бокси — продукти',
      status: 'received',
      supplier: 'Сільпо опт',
      orderIds: [orders[3].id],
      items: [
        {
          id: nanoid(8),
          name: 'Куряче філе',
          unit: 'кг',
          qty: 6,
          price: 165,
          ingredientId: findCat('Куряче філе').id,
        },
        {
          id: nanoid(8),
          name: 'Салат айсберг',
          unit: 'кг',
          qty: 3,
          price: 70,
          ingredientId: findCat('Салат айсберг').id,
        },
      ],
      dueDate: daysFromNow(-4),
      createdAt: daysFromNow(-6),
    },
  ]

  return {
    companies: [
      {
        id: companyIds.vinnytsia,
        name: 'IT Hub Вінниця',
        phone: '+380 67 111 22 33',
        email: 'office@ithub.vn.ua',
        address: 'вул. Пирогова 12',
        createdAt: daysFromNow(-60),
      },
      {
        id: companyIds.agro,
        name: 'Агрохолдинг «Поділля»',
        inn: '31245678',
        phone: '+380 43 255 10 20',
        email: 'events@podillya.ua',
        address: 'вул. Київська 15',
        notes: 'Постійний клієнт, корпоративи щокварталу',
        createdAt: daysFromNow(-120),
      },
      {
        id: companyIds.bank,
        name: 'Банк «Регіон»',
        phone: '+380 800 500 700',
        email: 'hr@regionbank.ua',
        address: 'вул. Келецька 51',
        createdAt: daysFromNow(-40),
      },
      {
        id: companyIds.wedding,
        name: 'Весільний проєкт М&Д',
        phone: '+380 50 999 88 77',
        email: 'marina.wedding@gmail.com',
        createdAt: daysFromNow(-10),
      },
    ],
    contacts: [
      {
        id: contactIds.marina,
        name: 'Марина Коваль',
        phone: '+380 50 999 88 77',
        email: 'marina.wedding@gmail.com',
        position: 'Наречена',
        companyId: companyIds.wedding,
        createdAt: daysFromNow(-10),
      },
      {
        id: contactIds.serhiy,
        name: 'Сергій Петренко',
        phone: '+380 67 444 55 66',
        email: 's.petrenko@podillya.ua',
        position: 'HR-директор',
        companyId: companyIds.agro,
        createdAt: daysFromNow(-100),
      },
      {
        id: contactIds.oksana,
        name: 'Оксана Бондар',
        phone: '+380 63 222 33 44',
        email: 'o.bondar@regionbank.ua',
        position: 'Event-менеджер',
        companyId: companyIds.bank,
        createdAt: daysFromNow(-30),
      },
      {
        id: contactIds.dmytro,
        name: 'Дмитро Лисенко',
        phone: '+380 93 777 11 22',
        email: 'd.lysenko@gmail.com',
        position: 'Власник шоуруму',
        createdAt: daysFromNow(-2),
      },
      {
        id: contactIds.yulia,
        name: 'Юлія Ткачук',
        phone: '+380 68 555 66 77',
        email: 'yulia@ithub.vn.ua',
        position: 'Office manager',
        companyId: companyIds.vinnytsia,
        createdAt: daysFromNow(-50),
      },
    ],
    catalog,
    orders,
    purchases,
    settings: defaultSettings,
  }
}

export function ensureUsers() {
  const count = (
    db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  ).c
  if (count > 0) return

  const insert = db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  insert.run(
    'user_admin',
    ADMIN_EMAIL,
    'Адміністратор',
    bcrypt.hashSync(ADMIN_PASSWORD, 10),
    'admin',
    new Date().toISOString(),
  )
  insert.run(
    'user_manager',
    MANAGER_EMAIL,
    'Менеджер Олена',
    bcrypt.hashSync(MANAGER_PASSWORD, 10),
    'manager',
    new Date().toISOString(),
  )
}

export function seedDemoData(force = false) {
  const companyCount = (
    db.prepare('SELECT COUNT(*) as c FROM companies').get() as { c: number }
  ).c
  if (companyCount > 0 && !force) return false

  if (force) clearBusinessData()

  const state = buildDemoState()
  const tx = db.transaction(() => {
    for (const company of state.companies) upsertCompanyRow(company)
    for (const contact of state.contacts) upsertContactRow(contact)
    for (const item of state.catalog) upsertCatalogRow(item)
    for (const order of state.orders) replaceOrder(order)
    for (const purchase of state.purchases) replacePurchase(purchase)
    saveSettings(state.settings)
  })
  tx()
  return true
}

export const DEMO_CREDENTIALS = {
  admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  manager: { email: MANAGER_EMAIL, password: MANAGER_PASSWORD },
}
