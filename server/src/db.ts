import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  AppSettings,
  CatalogItem,
  Company,
  Contact,
  CrmState,
  EstimateLine,
  Order,
  Payment,
  Purchase,
  PurchaseItem,
  UserPublic,
  UserRole,
} from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const dataDir = path.join(rootDir, 'data')
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'shastya.sqlite')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','manager')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      inn TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      position TEXT,
      company_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS catalog_items (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      description TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      composition_json TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL,
      internal_number TEXT,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      service_type TEXT NOT NULL,
      event_start TEXT NOT NULL,
      event_end TEXT,
      guests INTEGER NOT NULL DEFAULT 0,
      portions INTEGER NOT NULL DEFAULT 0,
      address TEXT NOT NULL DEFAULT '',
      company_id TEXT,
      contact_id TEXT,
      manager TEXT NOT NULL DEFAULT '',
      discount_percent REAL NOT NULL DEFAULT 0,
      markup_percent REAL NOT NULL DEFAULT 0,
      notes TEXT,
      kitchen_notes TEXT,
      production_date TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS estimate_lines (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      catalog_item_id TEXT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      unit TEXT NOT NULL,
      qty REAL NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      section TEXT NOT NULL DEFAULT '',
      sort_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      paid_at TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      supplier TEXT,
      order_ids_json TEXT NOT NULL DEFAULT '[]',
      due_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      ingredient_id TEXT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      qty REAL NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      sort_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      detail TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_start);
    CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_lines_order ON estimate_lines(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
  `)
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    inn: row.inn ? String(row.inn) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    email: row.email ? String(row.email) : undefined,
    address: row.address ? String(row.address) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
  }
}

export function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: row.phone ? String(row.phone) : undefined,
    email: row.email ? String(row.email) : undefined,
    position: row.position ? String(row.position) : undefined,
    companyId: row.company_id ? String(row.company_id) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
  }
}

export function mapCatalog(row: Record<string, unknown>): CatalogItem {
  return {
    id: String(row.id),
    kind: row.kind as CatalogItem['kind'],
    name: String(row.name),
    category: String(row.category),
    unit: String(row.unit),
    price: Number(row.price),
    cost: Number(row.cost),
    description: row.description ? String(row.description) : undefined,
    tags: parseJson<string[]>(String(row.tags_json || '[]'), []),
    composition: parseJson(String(row.composition_json || '[]'), []),
    active: Boolean(row.active),
  }
}

function mapLine(row: Record<string, unknown>): EstimateLine {
  return {
    id: String(row.id),
    catalogItemId: row.catalog_item_id ? String(row.catalog_item_id) : undefined,
    name: String(row.name),
    kind: row.kind as EstimateLine['kind'],
    unit: String(row.unit),
    qty: Number(row.qty),
    price: Number(row.price),
    cost: Number(row.cost),
    section: String(row.section),
  }
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    amount: Number(row.amount),
    method: String(row.method),
    paidAt: String(row.paid_at),
    note: row.note ? String(row.note) : undefined,
  }
}

export function mapOrder(
  row: Record<string, unknown>,
  lines: EstimateLine[],
  payments: Payment[],
): Order {
  return {
    id: String(row.id),
    number: String(row.number),
    internalNumber: row.internal_number ? String(row.internal_number) : undefined,
    title: String(row.title),
    status: row.status as Order['status'],
    serviceType: row.service_type as Order['serviceType'],
    eventStart: String(row.event_start),
    eventEnd: row.event_end ? String(row.event_end) : undefined,
    guests: Number(row.guests),
    portions: Number(row.portions),
    address: String(row.address || ''),
    companyId: row.company_id ? String(row.company_id) : undefined,
    contactId: row.contact_id ? String(row.contact_id) : undefined,
    manager: String(row.manager || ''),
    discountPercent: Number(row.discount_percent || 0),
    markupPercent: Number(row.markup_percent || 0),
    lines,
    payments,
    notes: row.notes ? String(row.notes) : undefined,
    kitchenNotes: row.kitchen_notes ? String(row.kitchen_notes) : undefined,
    productionDate: row.production_date ? String(row.production_date) : undefined,
    published: Boolean(row.published),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapPurchaseItem(row: Record<string, unknown>): PurchaseItem {
  return {
    id: String(row.id),
    ingredientId: row.ingredient_id ? String(row.ingredient_id) : undefined,
    name: String(row.name),
    unit: String(row.unit),
    qty: Number(row.qty),
    price: Number(row.price),
  }
}

export function mapPurchase(
  row: Record<string, unknown>,
  items: PurchaseItem[],
): Purchase {
  return {
    id: String(row.id),
    title: String(row.title),
    status: row.status as Purchase['status'],
    supplier: row.supplier ? String(row.supplier) : undefined,
    orderIds: parseJson<string[]>(String(row.order_ids_json || '[]'), []),
    items,
    dueDate: String(row.due_date),
    createdAt: String(row.created_at),
  }
}

export function mapUser(row: Record<string, unknown>): UserPublic {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: row.role as UserRole,
  }
}

export function getSettings(): AppSettings {
  const row = db.prepare('SELECT json FROM settings WHERE id = 1').get() as
    | { json: string }
    | undefined
  if (!row) {
    throw new Error('Settings not initialized')
  }
  return parseJson<AppSettings>(row.json, {} as AppSettings)
}

export function saveSettings(settings: AppSettings) {
  db.prepare(
    `INSERT INTO settings (id, json) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET json = excluded.json`,
  ).run(JSON.stringify(settings))
}

export function listCompanies(): Company[] {
  return db
    .prepare('SELECT * FROM companies ORDER BY name COLLATE NOCASE')
    .all()
    .map((r) => mapCompany(r as Record<string, unknown>))
}

export function listContacts(): Contact[] {
  return db
    .prepare('SELECT * FROM contacts ORDER BY name COLLATE NOCASE')
    .all()
    .map((r) => mapContact(r as Record<string, unknown>))
}

export function listCatalog(): CatalogItem[] {
  return db
    .prepare('SELECT * FROM catalog_items ORDER BY kind, name COLLATE NOCASE')
    .all()
    .map((r) => mapCatalog(r as Record<string, unknown>))
}

export function getOrderById(id: string): Order | null {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  if (!row) return null
  const lines = db
    .prepare(
      'SELECT * FROM estimate_lines WHERE order_id = ? ORDER BY sort_index, name',
    )
    .all(id)
    .map((r) => mapLine(r as Record<string, unknown>))
  const payments = db
    .prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY paid_at')
    .all(id)
    .map((r) => mapPayment(r as Record<string, unknown>))
  return mapOrder(row, lines, payments)
}

export function listOrders(): Order[] {
  const rows = db
    .prepare('SELECT * FROM orders ORDER BY event_start DESC')
    .all() as Record<string, unknown>[]
  return rows.map((row) => {
    const id = String(row.id)
    const lines = db
      .prepare(
        'SELECT * FROM estimate_lines WHERE order_id = ? ORDER BY sort_index, name',
      )
      .all(id)
      .map((r) => mapLine(r as Record<string, unknown>))
    const payments = db
      .prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY paid_at')
      .all(id)
      .map((r) => mapPayment(r as Record<string, unknown>))
    return mapOrder(row, lines, payments)
  })
}

export function getPurchaseById(id: string): Purchase | null {
  const row = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  if (!row) return null
  const items = db
    .prepare(
      'SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY sort_index, name',
    )
    .all(id)
    .map((r) => mapPurchaseItem(r as Record<string, unknown>))
  return mapPurchase(row, items)
}

export function listPurchases(): Purchase[] {
  const rows = db
    .prepare('SELECT * FROM purchases ORDER BY created_at DESC')
    .all() as Record<string, unknown>[]
  return rows.map((row) => {
    const id = String(row.id)
    const items = db
      .prepare(
        'SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY sort_index, name',
      )
      .all(id)
      .map((r) => mapPurchaseItem(r as Record<string, unknown>))
    return mapPurchase(row, items)
  })
}

export function loadCrmState(): CrmState {
  return {
    companies: listCompanies(),
    contacts: listContacts(),
    catalog: listCatalog(),
    orders: listOrders(),
    purchases: listPurchases(),
    settings: getSettings(),
  }
}

export function upsertCompanyRow(company: Company) {
  db.prepare(
    `INSERT INTO companies (id, name, inn, phone, email, address, notes, created_at)
     VALUES (@id, @name, @inn, @phone, @email, @address, @notes, @createdAt)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, inn=excluded.inn, phone=excluded.phone,
       email=excluded.email, address=excluded.address, notes=excluded.notes`,
  ).run({
    id: company.id,
    name: company.name,
    inn: company.inn ?? null,
    phone: company.phone ?? null,
    email: company.email ?? null,
    address: company.address ?? null,
    notes: company.notes ?? null,
    createdAt: company.createdAt,
  })
}

export function upsertContactRow(contact: Contact) {
  db.prepare(
    `INSERT INTO contacts (id, name, phone, email, position, company_id, notes, created_at)
     VALUES (@id, @name, @phone, @email, @position, @companyId, @notes, @createdAt)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, phone=excluded.phone, email=excluded.email,
       position=excluded.position, company_id=excluded.company_id,
       notes=excluded.notes`,
  ).run({
    id: contact.id,
    name: contact.name,
    phone: contact.phone ?? null,
    email: contact.email ?? null,
    position: contact.position ?? null,
    companyId: contact.companyId ?? null,
    notes: contact.notes ?? null,
    createdAt: contact.createdAt,
  })
}

export function upsertCatalogRow(item: CatalogItem) {
  db.prepare(
    `INSERT INTO catalog_items
      (id, kind, name, category, unit, price, cost, description, tags_json, composition_json, active)
     VALUES
      (@id, @kind, @name, @category, @unit, @price, @cost, @description, @tags, @composition, @active)
     ON CONFLICT(id) DO UPDATE SET
       kind=excluded.kind, name=excluded.name, category=excluded.category,
       unit=excluded.unit, price=excluded.price, cost=excluded.cost,
       description=excluded.description, tags_json=excluded.tags_json,
       composition_json=excluded.composition_json, active=excluded.active`,
  ).run({
    id: item.id,
    kind: item.kind,
    name: item.name,
    category: item.category,
    unit: item.unit,
    price: item.price,
    cost: item.cost,
    description: item.description ?? null,
    tags: JSON.stringify(item.tags || []),
    composition: JSON.stringify(item.composition || []),
    active: item.active ? 1 : 0,
  })
}

export function replaceOrder(order: Order) {
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (
        id, number, internal_number, title, status, service_type,
        event_start, event_end, guests, portions, address,
        company_id, contact_id, manager, discount_percent, markup_percent,
        notes, kitchen_notes, production_date, published, created_at, updated_at
      ) VALUES (
        @id, @number, @internalNumber, @title, @status, @serviceType,
        @eventStart, @eventEnd, @guests, @portions, @address,
        @companyId, @contactId, @manager, @discountPercent, @markupPercent,
        @notes, @kitchenNotes, @productionDate, @published, @createdAt, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        number=excluded.number, internal_number=excluded.internal_number,
        title=excluded.title, status=excluded.status, service_type=excluded.service_type,
        event_start=excluded.event_start, event_end=excluded.event_end,
        guests=excluded.guests, portions=excluded.portions, address=excluded.address,
        company_id=excluded.company_id, contact_id=excluded.contact_id,
        manager=excluded.manager, discount_percent=excluded.discount_percent,
        markup_percent=excluded.markup_percent, notes=excluded.notes,
        kitchen_notes=excluded.kitchen_notes, production_date=excluded.production_date,
        published=excluded.published, updated_at=excluded.updated_at`,
    ).run({
      id: order.id,
      number: order.number,
      internalNumber: order.internalNumber ?? null,
      title: order.title,
      status: order.status,
      serviceType: order.serviceType,
      eventStart: order.eventStart,
      eventEnd: order.eventEnd ?? null,
      guests: order.guests,
      portions: order.portions,
      address: order.address,
      companyId: order.companyId ?? null,
      contactId: order.contactId ?? null,
      manager: order.manager,
      discountPercent: order.discountPercent,
      markupPercent: order.markupPercent,
      notes: order.notes ?? null,
      kitchenNotes: order.kitchenNotes ?? null,
      productionDate: order.productionDate ?? null,
      published: order.published ? 1 : 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })

    db.prepare('DELETE FROM estimate_lines WHERE order_id = ?').run(order.id)
    db.prepare('DELETE FROM payments WHERE order_id = ?').run(order.id)

    const insertLine = db.prepare(
      `INSERT INTO estimate_lines
        (id, order_id, catalog_item_id, name, kind, unit, qty, price, cost, section, sort_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    order.lines.forEach((line, index) => {
      insertLine.run(
        line.id,
        order.id,
        line.catalogItemId ?? null,
        line.name,
        line.kind,
        line.unit,
        line.qty,
        line.price,
        line.cost,
        line.section,
        index,
      )
    })

    const insertPayment = db.prepare(
      `INSERT INTO payments (id, order_id, amount, method, paid_at, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    for (const payment of order.payments) {
      insertPayment.run(
        payment.id,
        order.id,
        payment.amount,
        payment.method,
        payment.paidAt,
        payment.note ?? null,
      )
    }
  })
  tx()
}

export function replacePurchase(purchase: Purchase) {
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO purchases (id, title, status, supplier, order_ids_json, due_date, created_at)
       VALUES (@id, @title, @status, @supplier, @orderIds, @dueDate, @createdAt)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, status=excluded.status, supplier=excluded.supplier,
         order_ids_json=excluded.order_ids_json, due_date=excluded.due_date`,
    ).run({
      id: purchase.id,
      title: purchase.title,
      status: purchase.status,
      supplier: purchase.supplier ?? null,
      orderIds: JSON.stringify(purchase.orderIds || []),
      dueDate: purchase.dueDate,
      createdAt: purchase.createdAt,
    })

    db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(purchase.id)
    const insertItem = db.prepare(
      `INSERT INTO purchase_items
        (id, purchase_id, ingredient_id, name, unit, qty, price, sort_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    purchase.items.forEach((item, index) => {
      insertItem.run(
        item.id,
        purchase.id,
        item.ingredientId ?? null,
        item.name,
        item.unit,
        item.qty,
        item.price,
        index,
      )
    })
  })
  tx()
}

export function writeAudit(
  userId: string | undefined,
  action: string,
  entity?: string,
  entityId?: string,
  detail?: string,
) {
  db.prepare(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    userId ?? null,
    action,
    entity ?? null,
    entityId ?? null,
    detail ?? null,
    new Date().toISOString(),
  )
}

export function clearBusinessData() {
  const tx = db.transaction(() => {
    db.exec(`
      DELETE FROM purchase_items;
      DELETE FROM purchases;
      DELETE FROM payments;
      DELETE FROM estimate_lines;
      DELETE FROM orders;
      DELETE FROM catalog_items;
      DELETE FROM contacts;
      DELETE FROM companies;
      DELETE FROM settings;
      DELETE FROM audit_log;
    `)
  })
  tx()
}

export function getDbPath() {
  return dbPath
}
