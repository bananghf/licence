import { Router } from 'express'
import { nanoid } from 'nanoid'
import { requireAuth, requireRole, type AuthRequest } from '../auth.js'
import { computeOrderTotals } from '../calc.js'
import {
  db,
  getOrderById,
  getPurchaseById,
  getSettings,
  listCatalog,
  listCompanies,
  listContacts,
  listOrders,
  listPurchases,
  loadCrmState,
  replaceOrder,
  replacePurchase,
  saveSettings,
  upsertCatalogRow,
  upsertCompanyRow,
  upsertContactRow,
  writeAudit,
} from '../db.js'
import { buildPurchaseFromOrders } from '../purchases.js'
import {
  applyStockDelta,
  listStockBalances,
  listStockMovements,
  receivePurchaseToStock,
  setMinQuantity,
} from '../stock.js'
import { param } from '../params.js'
import { seedDemoData } from '../seed.js'
import type {
  AppSettings,
  CatalogItem,
  Company,
  Contact,
  EstimateLine,
  Order,
  Payment,
  Purchase,
} from '../types.js'

export const apiRouter = Router()

apiRouter.use(requireAuth)

apiRouter.get('/bootstrap', (_req, res) => {
  res.json(loadCrmState())
})

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

/* ---------- Companies ---------- */
apiRouter.get('/companies', (_req, res) => {
  res.json(listCompanies())
})

apiRouter.post('/companies', (req: AuthRequest, res) => {
  const body = req.body || {}
  const now = new Date().toISOString()
  const company: Company = {
    id: body.id || nanoid(8),
    name: String(body.name || '').trim(),
    inn: body.inn || undefined,
    phone: body.phone || undefined,
    email: body.email || undefined,
    address: body.address || undefined,
    notes: body.notes || undefined,
    createdAt: body.createdAt || now,
  }
  if (!company.name) {
    res.status(400).json({ error: 'name required' })
    return
  }
  upsertCompanyRow(company)
  writeAudit(req.user?.id, 'upsert', 'company', company.id, company.name)
  res.json(company)
})

apiRouter.put('/companies/:id', (req: AuthRequest, res) => {
  const existing = listCompanies().find((c) => c.id === param(req, 'id'))
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const company: Company = {
    ...existing,
    ...req.body,
    id: existing.id,
    createdAt: existing.createdAt,
  }
  upsertCompanyRow(company)
  writeAudit(req.user?.id, 'update', 'company', company.id)
  res.json(company)
})

apiRouter.delete('/companies/:id', (req: AuthRequest, res) => {
  db.prepare('UPDATE contacts SET company_id = NULL WHERE company_id = ?').run(
    param(req, 'id'),
  )
  db.prepare('DELETE FROM companies WHERE id = ?').run(param(req, 'id'))
  writeAudit(req.user?.id, 'delete', 'company', param(req, 'id'))
  res.json({ ok: true })
})

/* ---------- Contacts ---------- */
apiRouter.get('/contacts', (_req, res) => {
  res.json(listContacts())
})

apiRouter.post('/contacts', (req: AuthRequest, res) => {
  const body = req.body || {}
  const contact: Contact = {
    id: body.id || nanoid(8),
    name: String(body.name || '').trim(),
    phone: body.phone || undefined,
    email: body.email || undefined,
    position: body.position || undefined,
    companyId: body.companyId || undefined,
    notes: body.notes || undefined,
    createdAt: body.createdAt || new Date().toISOString(),
  }
  if (!contact.name) {
    res.status(400).json({ error: 'name required' })
    return
  }
  upsertContactRow(contact)
  writeAudit(req.user?.id, 'upsert', 'contact', contact.id, contact.name)
  res.json(contact)
})

apiRouter.put('/contacts/:id', (req: AuthRequest, res) => {
  const existing = listContacts().find((c) => c.id === param(req, 'id'))
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const contact: Contact = {
    ...existing,
    ...req.body,
    id: existing.id,
    createdAt: existing.createdAt,
  }
  upsertContactRow(contact)
  writeAudit(req.user?.id, 'update', 'contact', contact.id)
  res.json(contact)
})

apiRouter.delete('/contacts/:id', (req: AuthRequest, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(param(req, 'id'))
  writeAudit(req.user?.id, 'delete', 'contact', param(req, 'id'))
  res.json({ ok: true })
})

/* ---------- Catalog ---------- */
apiRouter.get('/catalog', (_req, res) => {
  res.json(listCatalog())
})

apiRouter.post('/catalog', (req: AuthRequest, res) => {
  const body = req.body || {}
  const item: CatalogItem = {
    id: body.id || nanoid(8),
    kind: body.kind,
    name: String(body.name || '').trim(),
    category: body.category || 'Інше',
    unit: body.unit || 'шт.',
    price: Number(body.price ?? 0),
    cost: Number(body.cost ?? 0),
    description: body.description || undefined,
    tags: Array.isArray(body.tags) ? body.tags : [],
    composition: Array.isArray(body.composition) ? body.composition : [],
    active: body.active ?? true,
  }
  if (!item.name || !item.kind) {
    res.status(400).json({ error: 'name and kind required' })
    return
  }
  upsertCatalogRow(item)
  writeAudit(req.user?.id, 'upsert', 'catalog', item.id, item.name)
  res.json(item)
})

apiRouter.put('/catalog/:id', (req: AuthRequest, res) => {
  const existing = listCatalog().find((c) => c.id === param(req, 'id'))
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const item: CatalogItem = {
    ...existing,
    ...req.body,
    id: existing.id,
    tags: Array.isArray(req.body.tags) ? req.body.tags : existing.tags,
    composition: Array.isArray(req.body.composition)
      ? req.body.composition
      : existing.composition,
  }
  upsertCatalogRow(item)
  writeAudit(req.user?.id, 'update', 'catalog', item.id)
  res.json(item)
})

apiRouter.delete('/catalog/:id', (req: AuthRequest, res) => {
  db.prepare('DELETE FROM catalog_items WHERE id = ?').run(param(req, 'id'))
  writeAudit(req.user?.id, 'delete', 'catalog', param(req, 'id'))
  res.json({ ok: true })
})

/* ---------- Orders ---------- */
function nextOrderNumber(): string {
  const rows = db.prepare('SELECT number FROM orders').all() as { number: string }[]
  const nums = rows
    .map((o) => parseInt(o.number.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 1000
  return `З-${max + 1}`
}

function blankOrder(partial?: Partial<Order>): Order {
  const settings = getSettings()
  const now = new Date().toISOString()
  return {
    id: partial?.id || nanoid(8),
    number: partial?.number || nextOrderNumber(),
    title: partial?.title || 'Нове замовлення',
    status: partial?.status || 'draft',
    serviceType: partial?.serviceType || 'banquet',
    eventStart:
      partial?.eventStart ||
      new Date(Date.now() + 7 * 86400000).toISOString(),
    eventEnd: partial?.eventEnd,
    guests: partial?.guests ?? 20,
    portions: partial?.portions ?? 20,
    address: partial?.address || '',
    companyId: partial?.companyId,
    contactId: partial?.contactId,
    manager: partial?.manager || settings.managers[0] || '',
    discountPercent: partial?.discountPercent ?? 0,
    markupPercent: partial?.markupPercent ?? 0,
    lines: partial?.lines || [],
    payments: partial?.payments || [],
    notes: partial?.notes,
    kitchenNotes: partial?.kitchenNotes,
    productionDate: partial?.productionDate,
    published: partial?.published ?? false,
    createdAt: partial?.createdAt || now,
    updatedAt: now,
  }
}

apiRouter.get('/orders', (_req, res) => {
  const orders = listOrders().map((order) => ({
    ...order,
    totals: computeOrderTotals(order),
  }))
  res.json(orders)
})

apiRouter.get('/orders/:id', (req, res) => {
  const order = getOrderById(param(req, 'id'))
  if (!order) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json({ ...order, totals: computeOrderTotals(order) })
})

apiRouter.post('/orders', (req: AuthRequest, res) => {
  const order = blankOrder(req.body || {})
  replaceOrder(order)
  writeAudit(req.user?.id, 'create', 'order', order.id, order.number)
  res.status(201).json({ ...order, totals: computeOrderTotals(order) })
})

apiRouter.put('/orders/:id', (req: AuthRequest, res) => {
  const existing = getOrderById(param(req, 'id'))
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const body = req.body || {}
  const order: Order = {
    ...existing,
    ...body,
    id: existing.id,
    number: body.number || existing.number,
    lines: Array.isArray(body.lines) ? (body.lines as EstimateLine[]) : existing.lines,
    payments: Array.isArray(body.payments)
      ? (body.payments as Payment[])
      : existing.payments,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  }
  replaceOrder(order)
  writeAudit(req.user?.id, 'update', 'order', order.id)
  res.json({ ...order, totals: computeOrderTotals(order) })
})

apiRouter.put('/orders/:id/lines', (req: AuthRequest, res) => {
  const existing = getOrderById(param(req, 'id'))
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const lines = Array.isArray(req.body?.lines)
    ? (req.body.lines as EstimateLine[])
    : []
  const order: Order = {
    ...existing,
    lines,
    updatedAt: new Date().toISOString(),
  }
  replaceOrder(order)
  writeAudit(req.user?.id, 'update_lines', 'order', order.id)
  res.json({ ...order, totals: computeOrderTotals(order) })
})

apiRouter.post('/orders/:id/payments', (req: AuthRequest, res) => {
  const existing = getOrderById(param(req, 'id'))
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const payment: Payment = {
    id: req.body?.id || nanoid(8),
    amount: Number(req.body?.amount || 0),
    method: String(req.body?.method || 'Безготівка'),
    paidAt: req.body?.paidAt || new Date().toISOString(),
    note: req.body?.note || undefined,
  }
  const order: Order = {
    ...existing,
    payments: [...existing.payments, payment],
    updatedAt: new Date().toISOString(),
  }
  replaceOrder(order)
  writeAudit(req.user?.id, 'add_payment', 'order', order.id, String(payment.amount))
  res.json({ ...order, totals: computeOrderTotals(order) })
})

apiRouter.delete('/orders/:id/payments/:paymentId', (req: AuthRequest, res) => {
  const existing = getOrderById(param(req, 'id'))
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const order: Order = {
    ...existing,
    payments: existing.payments.filter((p) => p.id !== param(req, 'paymentId')),
    updatedAt: new Date().toISOString(),
  }
  replaceOrder(order)
  writeAudit(req.user?.id, 'remove_payment', 'order', order.id)
  res.json({ ...order, totals: computeOrderTotals(order) })
})

apiRouter.post('/orders/:id/duplicate', (req: AuthRequest, res) => {
  const source = getOrderById(param(req, 'id'))
  if (!source) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const copy: Order = {
    ...structuredClone(source),
    id: nanoid(8),
    number: nextOrderNumber(),
    title: `${source.title} (копія)`,
    status: 'draft',
    published: false,
    payments: [],
    lines: source.lines.map((l) => ({ ...l, id: nanoid(8) })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  replaceOrder(copy)
  writeAudit(req.user?.id, 'duplicate', 'order', copy.id, source.id)
  res.status(201).json({ ...copy, totals: computeOrderTotals(copy) })
})

apiRouter.delete('/orders/:id', (req: AuthRequest, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(param(req, 'id'))
  writeAudit(req.user?.id, 'delete', 'order', param(req, 'id'))
  res.json({ ok: true })
})

/* ---------- Purchases ---------- */
apiRouter.get('/purchases', (_req, res) => {
  res.json(listPurchases())
})

apiRouter.post('/purchases', (req: AuthRequest, res) => {
  const body = req.body || {}
  const purchase: Purchase = {
    id: body.id || nanoid(8),
    title: String(body.title || 'Закупка').trim(),
    status: body.status || 'planned',
    supplier: body.supplier || undefined,
    orderIds: Array.isArray(body.orderIds) ? body.orderIds : [],
    items: Array.isArray(body.items) ? body.items : [],
    dueDate: body.dueDate || new Date(Date.now() + 3 * 86400000).toISOString(),
    createdAt: body.createdAt || new Date().toISOString(),
  }
  replacePurchase(purchase)
  writeAudit(req.user?.id, 'upsert', 'purchase', purchase.id)
  res.status(201).json(purchase)
})

apiRouter.put('/purchases/:id', (req: AuthRequest, res) => {
  const existing = getPurchaseById(param(req, 'id'))
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const prevStatus = existing.status
  const purchase: Purchase = {
    ...existing,
    ...req.body,
    id: existing.id,
    createdAt: existing.createdAt,
    items: Array.isArray(req.body.items) ? req.body.items : existing.items,
    orderIds: Array.isArray(req.body.orderIds)
      ? req.body.orderIds
      : existing.orderIds,
  }
  replacePurchase(purchase)
  if (prevStatus !== 'received' && purchase.status === 'received') {
    try {
      receivePurchaseToStock(purchase, req.user?.id)
    } catch (err) {
      writeAudit(
        req.user?.id,
        'stock_error',
        'purchase',
        purchase.id,
        err instanceof Error ? err.message : 'stock receive failed',
      )
    }
  }
  writeAudit(req.user?.id, 'update', 'purchase', purchase.id)
  res.json(purchase)
})

apiRouter.patch('/purchases/:id/status', (req: AuthRequest, res) => {
  const existing = getPurchaseById(param(req, 'id'))
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const prevStatus = existing.status
  const purchase: Purchase = {
    ...existing,
    status: req.body?.status || existing.status,
  }
  replacePurchase(purchase)
  if (prevStatus !== 'received' && purchase.status === 'received') {
    try {
      receivePurchaseToStock(purchase, req.user?.id)
    } catch (err) {
      writeAudit(
        req.user?.id,
        'stock_error',
        'purchase',
        purchase.id,
        err instanceof Error ? err.message : 'stock receive failed',
      )
    }
  }
  writeAudit(req.user?.id, 'status', 'purchase', purchase.id, purchase.status)
  res.json(purchase)
})

apiRouter.post('/purchases/generate', (req: AuthRequest, res) => {
  const orderIds: string[] = Array.isArray(req.body?.orderIds)
    ? req.body.orderIds
    : []
  const orders = orderIds
    .map((id) => getOrderById(id))
    .filter((o): o is Order => Boolean(o))
  const purchase = buildPurchaseFromOrders(
    orders,
    listCatalog(),
    req.body?.title,
  )
  replacePurchase(purchase)
  writeAudit(
    req.user?.id,
    'generate',
    'purchase',
    purchase.id,
    orderIds.join(','),
  )
  res.status(201).json(purchase)
})

apiRouter.delete('/purchases/:id', (req: AuthRequest, res) => {
  db.prepare('DELETE FROM purchases WHERE id = ?').run(param(req, 'id'))
  writeAudit(req.user?.id, 'delete', 'purchase', param(req, 'id'))
  res.json({ ok: true })
})

/* ---------- Warehouse / Склад ---------- */
apiRouter.get('/warehouse/balances', (req, res) => {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : 'ingredient'
  res.json(listStockBalances(kind))
})

apiRouter.get('/warehouse/movements', (req, res) => {
  const catalogItemId =
    typeof req.query.catalogItemId === 'string'
      ? req.query.catalogItemId
      : undefined
  const limit =
    typeof req.query.limit === 'string' ? Number(req.query.limit) : 100
  res.json(listStockMovements({ catalogItemId, limit }))
})

apiRouter.post('/warehouse/intake', (req: AuthRequest, res) => {
  const body = req.body || {}
  const items: { catalogItemId: string; qty: number }[] = Array.isArray(
    body.items,
  )
    ? body.items
    : []
  if (items.length === 0) {
    res.status(400).json({ error: 'items required' })
    return
  }
  const date = body.date || new Date().toISOString()
  const supplier = body.supplier ? String(body.supplier) : undefined
  const note = body.note ? String(body.note) : undefined
  try {
    const movements = items.map((item) =>
      applyStockDelta({
        catalogItemId: item.catalogItemId,
        type: 'intake',
        qty: Number(item.qty),
        date,
        supplier,
        note,
        createdBy: req.user?.id,
      }),
    )
    writeAudit(
      req.user?.id,
      'intake',
      'warehouse',
      undefined,
      `${movements.length} поз.`,
    )
    res.status(201).json({
      movements,
      balances: listStockBalances('all'),
    })
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Intake failed',
    })
  }
})

apiRouter.post('/warehouse/writeoff', (req: AuthRequest, res) => {
  const body = req.body || {}
  const items: { catalogItemId: string; qty: number }[] = Array.isArray(
    body.items,
  )
    ? body.items
    : []
  if (items.length === 0) {
    res.status(400).json({ error: 'items required' })
    return
  }
  const date = body.date || new Date().toISOString()
  const note = body.note ? String(body.note) : undefined
  try {
    const movements = items.map((item) =>
      applyStockDelta({
        catalogItemId: item.catalogItemId,
        type: 'writeoff',
        qty: Number(item.qty),
        date,
        note,
        createdBy: req.user?.id,
      }),
    )
    writeAudit(
      req.user?.id,
      'writeoff',
      'warehouse',
      undefined,
      `${movements.length} поз.`,
    )
    res.status(201).json({
      movements,
      balances: listStockBalances('all'),
    })
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Write-off failed',
    })
  }
})

apiRouter.patch('/warehouse/balances/:id/min', (req: AuthRequest, res) => {
  const id = param(req, 'id')
  const catalog = listCatalog().find((c) => c.id === id)
  if (!catalog) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  setMinQuantity(id, Number(req.body?.minQuantity ?? 0))
  writeAudit(req.user?.id, 'min_qty', 'warehouse', id)
  res.json(listStockBalances('all').find((b) => b.catalogItemId === id))
})

/* ---------- Settings ---------- */
apiRouter.get('/settings', (_req, res) => {
  res.json(getSettings())
})

apiRouter.put('/settings', (req: AuthRequest, res) => {
  const current = getSettings()
  const next: AppSettings = { ...current, ...req.body }
  saveSettings(next)
  writeAudit(req.user?.id, 'update', 'settings', '1')
  res.json(next)
})

apiRouter.post(
  '/settings/reset-demo',
  requireRole('admin'),
  (req: AuthRequest, res) => {
    seedDemoData(true)
    writeAudit(req.user?.id, 'reset_demo', 'settings', '1')
    res.json(loadCrmState())
  },
)

/* ---------- Exports ---------- */
apiRouter.get('/export/orders.csv', (_req, res) => {
  const orders = listOrders()
  const header = [
    'number',
    'title',
    'status',
    'serviceType',
    'eventStart',
    'guests',
    'manager',
    'subtotal',
    'total',
    'cost',
    'paid',
    'paymentStatus',
    'marginPercent',
  ]
  const rows = orders.map((o) => {
    const t = computeOrderTotals(o)
    return [
      o.number,
      csvEscape(o.title),
      o.status,
      o.serviceType,
      o.eventStart,
      o.guests,
      csvEscape(o.manager),
      t.subtotal.toFixed(2),
      t.total.toFixed(2),
      t.cost.toFixed(2),
      t.paid.toFixed(2),
      t.paymentStatus,
      t.marginPercent.toFixed(1),
    ].join(',')
  })
  const csv = [header.join(','), ...rows].join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"')
  res.send('\uFEFF' + csv)
})

apiRouter.get('/export/catalog.csv', (_req, res) => {
  const catalog = listCatalog()
  const header = ['kind', 'name', 'category', 'unit', 'price', 'cost', 'active', 'tags']
  const rows = catalog.map((c) =>
    [
      c.kind,
      csvEscape(c.name),
      csvEscape(c.category),
      csvEscape(c.unit),
      c.price,
      c.cost,
      c.active ? 1 : 0,
      csvEscape(c.tags.join('|')),
    ].join(','),
  )
  const csv = [header.join(','), ...rows].join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="catalog.csv"')
  res.send('\uFEFF' + csv)
})

apiRouter.get('/audit', requireRole('admin'), (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, user_id as userId, action, entity, entity_id as entityId, detail, created_at as createdAt FROM audit_log ORDER BY id DESC LIMIT 200',
    )
    .all()
  res.json(rows)
})

/* Public proposal (published orders only) — auth optional via separate mount */
export function getPublishedOrder(id: string) {
  const order = getOrderById(id)
  if (!order || !order.published) return null
  return {
    order: {
      ...order,
      totals: computeOrderTotals(order),
    },
    settings: getSettings(),
    company: order.companyId
      ? listCompanies().find((c) => c.id === order.companyId) || null
      : null,
    contact: order.contactId
      ? listContacts().find((c) => c.id === order.contactId) || null
      : null,
  }
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}
