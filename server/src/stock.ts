import { nanoid } from 'nanoid'
import { db, mapCatalog } from './db.js'
import type {
  CatalogItem,
  Purchase,
  StockBalance,
  StockMovement,
  StockMovementType,
} from './types.js'

function roundQty(n: number): number {
  return Math.round(n * 1000) / 1000
}

export function mapMovement(row: Record<string, unknown>): StockMovement {
  return {
    id: String(row.id),
    catalogItemId: String(row.catalog_item_id),
    name: row.name ? String(row.name) : undefined,
    unit: row.unit ? String(row.unit) : undefined,
    type: row.type as StockMovementType,
    qty: Number(row.qty),
    date: String(row.date),
    supplier: row.supplier ? String(row.supplier) : undefined,
    note: row.note ? String(row.note) : undefined,
    purchaseId: row.purchase_id ? String(row.purchase_id) : undefined,
    createdAt: String(row.created_at),
    createdBy: row.created_by ? String(row.created_by) : undefined,
  }
}

function ensureLevelRow(catalogItemId: string, now = new Date().toISOString()) {
  db.prepare(
    `INSERT INTO stock_levels (catalog_item_id, quantity, min_quantity, updated_at)
     VALUES (?, 0, 0, ?)
     ON CONFLICT(catalog_item_id) DO NOTHING`,
  ).run(catalogItemId, now)
}

export function getStockQuantity(catalogItemId: string): number {
  const row = db
    .prepare('SELECT quantity FROM stock_levels WHERE catalog_item_id = ?')
    .get(catalogItemId) as { quantity: number } | undefined
  return row ? Number(row.quantity) : 0
}

/** Apply a signed delta (+ intake, − write-off) and insert a movement. */
export function applyStockDelta(params: {
  catalogItemId: string
  type: StockMovementType
  qty: number
  date: string
  supplier?: string
  note?: string
  purchaseId?: string
  createdBy?: string
  allowNegative?: boolean
}): StockMovement {
  const qty = roundQty(Math.abs(Number(params.qty) || 0))
  if (qty <= 0) {
    throw new Error('qty must be > 0')
  }

  const catalog = db
    .prepare('SELECT * FROM catalog_items WHERE id = ?')
    .get(params.catalogItemId) as Record<string, unknown> | undefined
  if (!catalog) {
    throw new Error('Catalog item not found')
  }

  // intake / purchase increase; writeoff decreases
  const delta =
    params.type === 'intake' || params.type === 'purchase' ? qty : -qty

  const now = new Date().toISOString()
  const id = nanoid(8)

  const tx = db.transaction(() => {
    ensureLevelRow(params.catalogItemId, now)
    const current = getStockQuantity(params.catalogItemId)
    const next = roundQty(current + delta)
    if (next < -0.0001 && !params.allowNegative) {
      throw new Error(
        `Недостатньо на складі: ${String(catalog.name)} (є ${current}, потрібно ${qty})`,
      )
    }
    db.prepare(
      `UPDATE stock_levels SET quantity = ?, updated_at = ? WHERE catalog_item_id = ?`,
    ).run(Math.max(0, next), now, params.catalogItemId)

    db.prepare(
      `INSERT INTO stock_movements
        (id, catalog_item_id, type, qty, date, supplier, note, purchase_id, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      params.catalogItemId,
      params.type,
      qty,
      params.date || now,
      params.supplier ?? null,
      params.note ?? null,
      params.purchaseId ?? null,
      now,
      params.createdBy ?? null,
    )
  })
  tx()

  const item = mapCatalog(catalog)
  return {
    id,
    catalogItemId: params.catalogItemId,
    name: item.name,
    unit: item.unit,
    type: params.type,
    qty,
    date: params.date || now,
    supplier: params.supplier,
    note: params.note,
    purchaseId: params.purchaseId,
    createdAt: now,
    createdBy: params.createdBy,
  }
}

export function listStockBalances(kind?: string): StockBalance[] {
  const kinds =
    kind === 'product'
      ? ['product']
      : kind === 'all'
        ? ['ingredient', 'product']
        : ['ingredient']

  const placeholders = kinds.map(() => '?').join(',')
  const rows = db
    .prepare(
      `SELECT c.*,
              COALESCE(s.quantity, 0) as stock_qty,
              COALESCE(s.min_quantity, 0) as min_qty,
              s.updated_at as stock_updated_at
       FROM catalog_items c
       LEFT JOIN stock_levels s ON s.catalog_item_id = c.id
       WHERE c.active = 1 AND c.kind IN (${placeholders})
       ORDER BY c.kind, c.name COLLATE NOCASE`,
    )
    .all(...kinds) as Record<string, unknown>[]

  return rows.map((row) => {
    const item = mapCatalog(row)
    const quantity = Number(row.stock_qty || 0)
    const minQuantity = Number(row.min_qty || 0)
    return {
      catalogItemId: item.id,
      name: item.name,
      kind: item.kind,
      category: item.category,
      unit: item.unit,
      quantity,
      minQuantity,
      lowStock: minQuantity > 0 && quantity <= minQuantity,
      updatedAt: row.stock_updated_at
        ? String(row.stock_updated_at)
        : undefined,
    }
  })
}

export function listStockMovements(opts?: {
  catalogItemId?: string
  limit?: number
}): StockMovement[] {
  const limit = Math.min(Math.max(opts?.limit || 100, 1), 500)
  let rows: Record<string, unknown>[]
  if (opts?.catalogItemId) {
    rows = db
      .prepare(
        `SELECT m.*, c.name, c.unit
         FROM stock_movements m
         LEFT JOIN catalog_items c ON c.id = m.catalog_item_id
         WHERE m.catalog_item_id = ?
         ORDER BY m.date DESC, m.created_at DESC
         LIMIT ?`,
      )
      .all(opts.catalogItemId, limit) as Record<string, unknown>[]
  } else {
    rows = db
      .prepare(
        `SELECT m.*, c.name, c.unit
         FROM stock_movements m
         LEFT JOIN catalog_items c ON c.id = m.catalog_item_id
         ORDER BY m.date DESC, m.created_at DESC
         LIMIT ?`,
      )
      .all(limit) as Record<string, unknown>[]
  }
  return rows.map(mapMovement)
}

export function setMinQuantity(catalogItemId: string, minQuantity: number) {
  const now = new Date().toISOString()
  ensureLevelRow(catalogItemId, now)
  db.prepare(
    `UPDATE stock_levels SET min_quantity = ?, updated_at = ? WHERE catalog_item_id = ?`,
  ).run(Math.max(0, Number(minQuantity) || 0), now, catalogItemId)
}

export function receivePurchaseToStock(
  purchase: Purchase,
  createdBy?: string,
): StockMovement[] {
  if (purchase.status !== 'received') return []

  const existing = db
    .prepare(
      `SELECT COUNT(*) as c FROM stock_movements WHERE purchase_id = ?`,
    )
    .get(purchase.id) as { c: number }
  if (existing.c > 0) return []

  const movements: StockMovement[] = []
  const date = new Date().toISOString()
  const note = `Закупка: ${purchase.title}`

  for (const item of purchase.items) {
    if (!item.ingredientId || item.qty <= 0) continue
    const catalog = db
      .prepare('SELECT id FROM catalog_items WHERE id = ?')
      .get(item.ingredientId)
    if (!catalog) continue
    movements.push(
      applyStockDelta({
        catalogItemId: item.ingredientId,
        type: 'purchase',
        qty: item.qty,
        date,
        supplier: purchase.supplier,
        note,
        purchaseId: purchase.id,
        createdBy,
      }),
    )
  }
  return movements
}

export function seedInitialStock(catalog: CatalogItem[]) {
  const count = (
    db.prepare('SELECT COUNT(*) as c FROM stock_levels').get() as { c: number }
  ).c
  if (count > 0) return false

  const defaults: Record<string, { qty: number; min: number }> = {
    ing_salmon: { qty: 4.5, min: 2 },
    ing_chicken: { qty: 12, min: 5 },
    ing_turkey: { qty: 6, min: 3 },
    ing_zander: { qty: 3.2, min: 2 },
    ing_mozzarella: { qty: 5, min: 2 },
    ing_parmesan: { qty: 1.5, min: 1 },
    ing_cherry: { qty: 8, min: 3 },
    ing_iceberg: { qty: 1.2, min: 2 }, // low stock demo
    ing_potato: { qty: 25, min: 10 },
    ing_mushroom: { qty: 4, min: 2 },
    ing_rice: { qty: 10, min: 4 },
    ing_oil: { qty: 6, min: 2 },
    ing_coffee: { qty: 3, min: 1.5 },
    ing_sugar: { qty: 15, min: 5 },
    ing_cream: { qty: 8, min: 3 },
    ing_lemon: { qty: 0.8, min: 2 }, // low stock demo
    ing_berries: { qty: 2.5, min: 1 },
    ing_baguette: { qty: 20, min: 10 },
  }

  const now = new Date().toISOString()
  const date = now
  const ingredients = catalog.filter((c) => c.kind === 'ingredient')

  const tx = db.transaction(() => {
    for (const item of ingredients) {
      const d = defaults[item.id] || { qty: 5, min: 1 }
      db.prepare(
        `INSERT INTO stock_levels (catalog_item_id, quantity, min_quantity, updated_at)
         VALUES (?, ?, ?, ?)`,
      ).run(item.id, d.qty, d.min, now)
      db.prepare(
        `INSERT INTO stock_movements
          (id, catalog_item_id, type, qty, date, supplier, note, purchase_id, created_at, created_by)
         VALUES (?, ?, 'intake', ?, ?, ?, ?, NULL, ?, NULL)`,
      ).run(
        nanoid(8),
        item.id,
        d.qty,
        date,
        'Початкові залишки',
        'Демо-оприбуткування при seed',
        now,
      )
    }
  })
  tx()
  return true
}
