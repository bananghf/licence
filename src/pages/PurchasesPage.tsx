import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { useCrmStore } from '../store/useCrmStore'
import { formatDate, money } from '../lib/format'
import { fromLocalInput, toDateInput } from '../lib/datetime'
import { PURCHASE_LABELS } from '../lib/labels'
import {
  Button,
  Field,
  Label,
  Modal,
  PageHeader,
  Select,
} from '../components/ui'
import type { Purchase, PurchaseItem, PurchaseStatus } from '../types'
import { downloadCsv } from '../lib/csv'

export function PurchasesPage() {
  const purchases = useCrmStore((s) => s.purchases)
  const orders = useCrmStore((s) => s.orders)
  const catalog = useCrmStore((s) => s.catalog)
  const upsertPurchase = useCrmStore((s) => s.upsertPurchase)
  const setPurchaseStatus = useCrmStore((s) => s.setPurchaseStatus)
  const deletePurchase = useCrmStore((s) => s.deletePurchase)
  const generatePurchaseFromOrders = useCrmStore((s) => s.generatePurchaseFromOrders)
  const navigate = useNavigate()

  const [status, setStatus] = useState<PurchaseStatus | ''>('')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [genOpen, setGenOpen] = useState(false)
  const [editing, setEditing] = useState<(Partial<Purchase> & { title: string }) | null>(null)

  const filtered = useMemo(
    () => purchases.filter((p) => !status || p.status === status),
    [purchases, status],
  )

  const openOrders = useMemo(
    () =>
      orders.filter((o) => ['confirmed', 'sent', 'new', 'done'].includes(o.status)),
    [orders],
  )

  const ingredients = catalog.filter((c) => c.kind === 'ingredient')

  const purchaseTotal = (p: Purchase) =>
    p.items.reduce((s, i) => s + i.qty * i.price, 0)

  return (
    <div>
      <PageHeader
        title="Закупки"
        subtitle="Планування закупівель під замовлення"
        actions={
          <div className="btn-row">
            <Button onClick={() => setGenOpen(true)}>Згенерувати з замовлень</Button>
            <Button
              variant="primary"
              onClick={() =>
                setEditing({
                  title: 'Нова закупка',
                  status: 'planned',
                  orderIds: [],
                  items: [],
                  dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
                  supplier: '',
                })
              }
            >
              + Закупка
            </Button>
          </div>
        }
      />

      <div className="filters">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as PurchaseStatus | '')}
          style={{ maxWidth: 200 }}
        >
          <option value="">Усі статуси</option>
          {Object.entries(PURCHASE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Статус</th>
                <th>Постачальник</th>
                <th>Термін</th>
                <th>Позиції</th>
                <th>Сума</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.title}</strong>
                    {p.orderIds.length ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        Замовлення:{' '}
                        {p.orderIds
                          .map((id) => orders.find((o) => o.id === id)?.number || id)
                          .join(', ')}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <Select
                      value={p.status}
                      onChange={(e) =>
                        setPurchaseStatus(p.id, e.target.value as PurchaseStatus)
                      }
                      style={{ maxWidth: 160 }}
                    >
                      {Object.entries(PURCHASE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td>{p.supplier || '—'}</td>
                  <td>{formatDate(p.dueDate)}</td>
                  <td>{p.items.length}</td>
                  <td>{money(purchaseTotal(p))}</td>
                  <td>
                    <div className="btn-row">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                        Ред.
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          downloadCsv(`${p.title.replace(/\s+/g, '_')}.csv`, [
                            ['Назва', 'К-сть', 'Од.', 'Ціна', 'Сума'],
                            ...p.items.map((i) => [
                              i.name,
                              i.qty,
                              i.unit,
                              i.price,
                              i.qty * i.price,
                            ]),
                            [],
                            ['Разом', '', '', '', purchaseTotal(p)],
                          ])
                        }
                      >
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm('Видалити закупку?')) deletePurchase(p.id)
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">Немає закупок</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {genOpen ? (
        <Modal
          title="Згенерувати закупку з замовлень"
          onClose={() => setGenOpen(false)}
          footer={
            <>
              <Button onClick={() => setGenOpen(false)}>Скасувати</Button>
              <Button
                variant="primary"
                disabled={selectedOrders.length === 0}
                onClick={() => {
                  const id = generatePurchaseFromOrders(selectedOrders)
                  setGenOpen(false)
                  setSelectedOrders([])
                  const p = useCrmStore.getState().purchases.find((x) => x.id === id)
                  if (p) setEditing(p)
                }}
              >
                Згенерувати
              </Button>
            </>
          }
        >
          <p className="muted" style={{ fontSize: 13 }}>
            Система збере інгредієнти за ТТК (складом страв) × кількість порцій у сметах.
            Якщо ТТК порожня — використовується евристика за тегами. Далі можна
            відредагувати кількості.
          </p>
          <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflow: 'auto' }}>
            {openOrders.map((o) => {
              const checked = selectedOrders.includes(o.id)
              return (
                <label
                  key={o.id}
                  className="btn"
                  style={{
                    justifyContent: 'flex-start',
                    background: checked ? 'var(--brand-soft)' : undefined,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSelectedOrders((prev) =>
                        e.target.checked
                          ? [...prev, o.id]
                          : prev.filter((id) => id !== o.id),
                      )
                    }}
                  />
                  <span>
                    <strong>{o.number}</strong> · {o.title}
                    <div className="muted" style={{ fontSize: 12 }}>
                      {formatDate(o.eventStart)} · {o.lines.filter((l) => l.kind === 'product').length}{' '}
                      страв
                    </div>
                  </span>
                </label>
              )
            })}
          </div>
        </Modal>
      ) : null}

      {editing ? (
        <Modal
          wide
          title={editing.id ? 'Редагувати закупку' : 'Нова закупка'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Скасувати</Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!editing.title.trim()) return
                  upsertPurchase({
                    id: editing.id,
                    title: editing.title,
                    status: editing.status || 'planned',
                    supplier: editing.supplier,
                    orderIds: editing.orderIds || [],
                    items: editing.items || [],
                    dueDate:
                      editing.dueDate ||
                      new Date(Date.now() + 2 * 86400000).toISOString(),
                  })
                  setEditing(null)
                }}
              >
                Зберегти
              </Button>
            </>
          }
        >
          <div className="grid-2">
            <Label label="Назва">
              <Field
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </Label>
            <Label label="Постачальник">
              <Field
                value={editing.supplier || ''}
                onChange={(e) => setEditing({ ...editing, supplier: e.target.value })}
              />
            </Label>
            <Label label="Статус">
              <Select
                value={editing.status || 'planned'}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as PurchaseStatus })
                }
              >
                {Object.entries(PURCHASE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Label>
            <Label label="Термін">
              <Field
                type="date"
                value={toDateInput(editing.dueDate)}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    dueDate: fromLocalInput(`${e.target.value}T12:00`),
                  })
                }
              />
            </Label>
          </div>

          <div
            className="section-title"
            style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}
          >
            <span>Позиції</span>
            <div className="btn-row">
              <Select
                style={{ maxWidth: 220 }}
                defaultValue=""
                onChange={(e) => {
                  const ing = ingredients.find((i) => i.id === e.target.value)
                  if (!ing) return
                  const item: PurchaseItem = {
                    id: nanoid(8),
                    ingredientId: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    qty: 1,
                    price: ing.cost,
                  }
                  setEditing({
                    ...editing,
                    items: [...(editing.items || []), item],
                  })
                  e.target.value = ''
                }}
              >
                <option value="">+ з каталогу інгредієнтів</option>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                onClick={() =>
                  setEditing({
                    ...editing,
                    items: [
                      ...(editing.items || []),
                      {
                        id: nanoid(8),
                        name: 'Нова позиція',
                        unit: 'кг',
                        qty: 1,
                        price: 0,
                      },
                    ],
                  })
                }
              >
                + Рядок
              </Button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>К-сть</th>
                  <th>Од.</th>
                  <th>Ціна</th>
                  <th>Сума</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(editing.items || []).map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <Field
                        value={item.name}
                        onChange={(e) => {
                          const items = [...(editing.items || [])]
                          items[idx] = { ...item, name: e.target.value }
                          setEditing({ ...editing, items })
                        }}
                      />
                    </td>
                    <td>
                      <Field
                        type="number"
                        min={0}
                        step={0.1}
                        value={item.qty}
                        onChange={(e) => {
                          const items = [...(editing.items || [])]
                          items[idx] = { ...item, qty: Number(e.target.value) || 0 }
                          setEditing({ ...editing, items })
                        }}
                      />
                    </td>
                    <td>
                      <Field
                        value={item.unit}
                        onChange={(e) => {
                          const items = [...(editing.items || [])]
                          items[idx] = { ...item, unit: e.target.value }
                          setEditing({ ...editing, items })
                        }}
                      />
                    </td>
                    <td>
                      <Field
                        type="number"
                        min={0}
                        value={item.price}
                        onChange={(e) => {
                          const items = [...(editing.items || [])]
                          items[idx] = { ...item, price: Number(e.target.value) || 0 }
                          setEditing({ ...editing, items })
                        }}
                      />
                    </td>
                    <td>{money(item.qty * item.price)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            items: (editing.items || []).filter((x) => x.id !== item.id),
                          })
                        }
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'right', fontWeight: 700 }}>
            Разом: {money((editing.items || []).reduce((s, i) => s + i.qty * i.price, 0))}
          </div>
          {editing.orderIds?.length ? (
            <div className="muted" style={{ fontSize: 13 }}>
              Повʼязані замовлення:{' '}
              {editing.orderIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => navigate(`/orders/${id}`)}
                >
                  {orders.find((o) => o.id === id)?.number || id}
                </button>
              ))}
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  )
}
