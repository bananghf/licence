import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { useCrmStore } from '../store/useCrmStore'
import {
  formatDateTime,
  lineCost,
  lineTotal,
  money,
  orderCost,
  orderMargin,
  orderPaid,
  orderPaymentStatus,
  orderSubtotal,
  orderTotal,
} from '../lib/format'
import { fromLocalInput, toDateInput, toLocalInput } from '../lib/datetime'
import { downloadCsv } from '../lib/csv'
import {
  Button,
  Field,
  Label,
  PageHeader,
  PaymentBadge,
  Select,
  StatusBadge,
  Textarea,
} from '../components/ui'
import { SERVICE_LABELS, STATUS_LABELS } from '../lib/labels'
import type { CatalogItem, EstimateLine, OrderStatus, ServiceType } from '../types'

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const order = useCrmStore((s) => s.orders.find((o) => o.id === id))
  const companies = useCrmStore((s) => s.companies)
  const contacts = useCrmStore((s) => s.contacts)
  const catalog = useCrmStore((s) => s.catalog)
  const managers = useCrmStore((s) => s.settings.managers)
  const paymentAccounts = useCrmStore((s) => s.settings.paymentAccounts)
  const trackPayments = useCrmStore((s) => s.settings.trackPayments)
  const updateOrder = useCrmStore((s) => s.updateOrder)
  const setOrderLines = useCrmStore((s) => s.setOrderLines)
  const addPayment = useCrmStore((s) => s.addPayment)
  const removePayment = useCrmStore((s) => s.removePayment)
  const deleteOrder = useCrmStore((s) => s.deleteOrder)
  const duplicateOrder = useCrmStore((s) => s.duplicateOrder)

  const [catalogQ, setCatalogQ] = useState('')
  const [catalogKind, setCatalogKind] = useState<'product' | 'service' | ''>('')
  const [section, setSection] = useState('Меню')
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState(
    () => paymentAccounts?.[0] || 'Безготівка',
  )
  const [payNote, setPayNote] = useState('')
  const [copied, setCopied] = useState(false)

  const sections = useMemo(() => {
    const set = new Set(order?.lines.map((l) => l.section) || [])
    ;['Меню', 'Закуски', 'Салати', 'Гаряче', 'Десерти', 'Напої', 'Сервіс', 'Логістика'].forEach(
      (s) => set.add(s),
    )
    return [...set]
  }, [order?.lines])

  const grouped = useMemo(() => {
    if (!order) return [] as { section: string; lines: EstimateLine[] }[]
    const map = new Map<string, EstimateLine[]>()
    for (const line of order.lines) {
      const list = map.get(line.section) || []
      list.push(line)
      map.set(line.section, list)
    }
    return [...map.entries()].map(([sec, lines]) => ({ section: sec, lines }))
  }, [order])

  const catalogHits = useMemo(() => {
    const q = catalogQ.trim().toLowerCase()
    return catalog
      .filter((c) => c.active && c.kind !== 'ingredient')
      .filter((c) => !catalogKind || c.kind === catalogKind)
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.tags.some((t) => t.includes(q)),
      )
      .slice(0, 40)
  }, [catalog, catalogQ, catalogKind])

  if (!order) {
    return (
      <div className="panel panel-pad">
        <div className="empty">Замовлення не знайдено</div>
        <Button onClick={() => navigate('/orders')}>До списку</Button>
      </div>
    )
  }

  const patch = (p: Partial<typeof order>) => updateOrder(order.id, p)

  const addFromCatalog = (item: CatalogItem) => {
    const line: EstimateLine = {
      id: nanoid(8),
      catalogItemId: item.id,
      name: item.name,
      kind: item.kind,
      unit: item.unit,
      qty: 1,
      price: item.price,
      cost: item.cost,
      section: section || item.category || 'Меню',
    }
    setOrderLines(order.id, [...order.lines, line])
  }

  const addCustomLine = () => {
    const line: EstimateLine = {
      id: nanoid(8),
      name: 'Нова позиція',
      kind: 'product',
      unit: 'шт.',
      qty: 1,
      price: 0,
      cost: 0,
      section: section || 'Меню',
    }
    setOrderLines(order.id, [...order.lines, line])
  }

  const updateLine = (lineId: string, p: Partial<EstimateLine>) => {
    setOrderLines(
      order.id,
      order.lines.map((l) => (l.id === lineId ? { ...l, ...p } : l)),
    )
  }

  const removeLine = (lineId: string) => {
    setOrderLines(
      order.id,
      order.lines.filter((l) => l.id !== lineId),
    )
  }

  const subtotal = orderSubtotal(order)
  const total = orderTotal(order)
  const cost = orderCost(order)
  const paid = orderPaid(order)
  const due = Math.max(0, total - paid)

  const proposalUrl = `${window.location.origin}/p/${order.id}`

  return (
    <div>
      <PageHeader
        title={order.title}
        subtitle={`${order.number} · оновлено ${formatDateTime(order.updatedAt)}`}
        actions={
          <div className="btn-row no-print">
            <Button
              variant="accent"
              onClick={() => {
                patch({ published: true, status: order.status === 'draft' ? 'sent' : order.status })
                navigator.clipboard?.writeText(proposalUrl).catch(() => undefined)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? 'Посилання скопійовано' : 'Опублікувати КП'}
            </Button>
            <Link className="btn" to={`/p/${order.id}`} target="_blank">
              Перегляд КП
            </Link>
            <Link className="btn" to={`/orders/${order.id}/kitchen`}>
              Кухонний лист
            </Link>
            <Button
              onClick={() => {
                downloadCsv(`${order.number}-koshtorys.csv`, [
                  ['Розділ', 'Позиція', 'К-сть', 'Од.', 'Ціна', 'Собів.', 'Сума'],
                  ...order.lines.map((l) => [
                    l.section,
                    l.name,
                    l.qty,
                    l.unit,
                    l.price,
                    l.cost,
                    lineTotal(l),
                  ]),
                  [],
                  ['Підсумок', '', '', '', '', '', orderSubtotal(order)],
                  ['Знижка %', order.discountPercent],
                  ['Націнка %', order.markupPercent],
                  ['Разом', '', '', '', '', '', orderTotal(order)],
                ])
              }}
            >
              Excel / CSV
            </Button>
            <Button
              onClick={() => {
                const id = duplicateOrder(order.id)
                if (id) navigate(`/orders/${id}`)
              }}
            >
              Дублювати
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Видалити ${order.number}?`)) {
                  deleteOrder(order.id)
                  navigate('/orders')
                }
              }}
            >
              Видалити
            </Button>
          </div>
        }
      />

      <div className="stat-grid">
        <div className="stat">
          <div className="k">Сума КП</div>
          <div className="v">{money(total)}</div>
          <div className="s">
            підсумок {money(subtotal)}
            {order.discountPercent ? ` · −${order.discountPercent}%` : ''}
            {order.markupPercent ? ` · +${order.markupPercent}%` : ''}
          </div>
        </div>
        <div className="stat">
          <div className="k">Собівартість / маржа</div>
          <div className="v">{orderMargin(order).toFixed(0)}%</div>
          <div className="s">собів. {money(cost)}</div>
        </div>
        <div className="stat">
          <div className="k">Оплата</div>
          <div className="v">{money(paid)}</div>
          <div className="s">залишок {money(due)}</div>
        </div>
        <div className="stat">
          <div className="k">Статус</div>
          <div className="v" style={{ fontSize: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={order.status} />
            <PaymentBadge status={orderPaymentStatus(order)} />
          </div>
          <div className="s">{order.published ? 'КП опубліковано' : 'КП чернетка'}</div>
        </div>
      </div>

      <div className="split" style={{ marginBottom: 14 }}>
        <div className="panel panel-pad">
          <div className="section-title">Параметри події</div>
          <div className="grid-2">
            <Label label="Назва">
              <Field value={order.title} onChange={(e) => patch({ title: e.target.value })} />
            </Label>
            <Label label="Внутрішній №">
              <Field
                value={order.internalNumber || ''}
                onChange={(e) => patch({ internalNumber: e.target.value })}
                placeholder="опційно"
              />
            </Label>
            <Label label="Статус">
              <Select
                value={order.status}
                onChange={(e) => patch({ status: e.target.value as OrderStatus })}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Label>
            <Label label="Тип сервісу">
              <Select
                value={order.serviceType}
                onChange={(e) => patch({ serviceType: e.target.value as ServiceType })}
              >
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Label>
            <Label label="Початок">
              <Field
                type="datetime-local"
                value={toLocalInput(order.eventStart)}
                onChange={(e) => patch({ eventStart: fromLocalInput(e.target.value) })}
              />
            </Label>
            <Label label="Кінець">
              <Field
                type="datetime-local"
                value={toLocalInput(order.eventEnd)}
                onChange={(e) =>
                  patch({ eventEnd: e.target.value ? fromLocalInput(e.target.value) : undefined })
                }
              />
            </Label>
            <Label label="Гості">
              <Field
                type="number"
                min={0}
                value={order.guests}
                onChange={(e) => patch({ guests: Number(e.target.value) || 0 })}
              />
            </Label>
            <Label label="Порції">
              <Field
                type="number"
                min={0}
                value={order.portions}
                onChange={(e) => patch({ portions: Number(e.target.value) || 0 })}
              />
            </Label>
            <Label label="Компанія">
              <Select
                value={order.companyId || ''}
                onChange={(e) => patch({ companyId: e.target.value || undefined })}
              >
                <option value="">—</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Label>
            <Label label="Контакт">
              <Select
                value={order.contactId || ''}
                onChange={(e) => patch({ contactId: e.target.value || undefined })}
              >
                <option value="">—</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Label>
            <Label label="Менеджер">
              <Select
                value={order.manager}
                onChange={(e) => patch({ manager: e.target.value })}
              >
                {managers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Label>
            <Label label="Адреса">
              <Field value={order.address} onChange={(e) => patch({ address: e.target.value })} />
            </Label>
            <Label label="Знижка %">
              <Field
                type="number"
                min={0}
                max={100}
                value={order.discountPercent}
                onChange={(e) => patch({ discountPercent: Number(e.target.value) || 0 })}
              />
            </Label>
            <Label label="Націнка %">
              <Field
                type="number"
                min={0}
                value={order.markupPercent}
                onChange={(e) => patch({ markupPercent: Number(e.target.value) || 0 })}
              />
            </Label>
            <Label label="Дата виробництва (кухня)">
              <Field
                type="date"
                value={toDateInput(order.productionDate)}
                onChange={(e) =>
                  patch({
                    productionDate: e.target.value
                      ? fromLocalInput(`${e.target.value}T10:00`)
                      : undefined,
                  })
                }
              />
            </Label>
          </div>
          <div className="grid-2" style={{ marginTop: 12 }}>
            <Label label="Нотатки для клієнта / КП">
              <Textarea
                value={order.notes || ''}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </Label>
            <Label label="Нотатки кухні">
              <Textarea
                value={order.kitchenNotes || ''}
                onChange={(e) => patch({ kitchenNotes: e.target.value })}
              />
            </Label>
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="section-title">Платежі</div>
          {!trackPayments ? (
            <div className="empty" style={{ padding: 16 }}>
              Облік платежів вимкнено в налаштуваннях
            </div>
          ) : order.payments.length === 0 ? (
            <div className="empty" style={{ padding: 16 }}>
              Платежів ще немає
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Рахунок</th>
                    <th>Сума</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments.map((p) => (
                    <tr key={p.id}>
                      <td>{formatDateTime(p.paidAt)}</td>
                      <td>
                        {p.method}
                        {p.note ? (
                          <div className="muted" style={{ fontSize: 12 }}>
                            {p.note}
                          </div>
                        ) : null}
                      </td>
                      <td>{money(p.amount)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePayment(order.id, p.id)}
                        >
                          ✕
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {trackPayments ? (
            <>
              <div className="grid-2" style={{ marginTop: 12 }}>
                <Label label="Сума">
                  <Field
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={String(Math.round(due) || '')}
                  />
                </Label>
                <Label label="Рахунок / метод">
                  <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                    {(paymentAccounts?.length
                      ? paymentAccounts
                      : ['Безготівка', 'Готівка', 'Термінал']
                    ).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                </Label>
              </div>
              <Label label="Коментар">
                <Field value={payNote} onChange={(e) => setPayNote(e.target.value)} />
              </Label>
              <Button
                variant="primary"
                style={{ marginTop: 8 }}
                onClick={() => {
                  const amount = Number(payAmount)
                  if (!amount || amount <= 0) return
                  addPayment(order.id, {
                    amount,
                    method: payMethod,
                    paidAt: new Date().toISOString(),
                    note: payNote || undefined,
                  })
                  setPayAmount('')
                  setPayNote('')
                }}
              >
                Додати платіж
              </Button>
            </>
          ) : null}
          {order.published ? (
            <div style={{ marginTop: 14, fontSize: 13 }} className="muted">
              Публічне КП:{' '}
              <a href={proposalUrl} target="_blank" rel="noreferrer">
                {proposalUrl}
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <div className="split">
        <div className="panel panel-pad">
          <div
            className="section-title"
            style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}
          >
            <span>Кошторис / меню</span>
            <Button size="sm" onClick={addCustomLine}>
              + Рядок
            </Button>
          </div>

          {grouped.length === 0 ? (
            <div className="empty">Додайте позиції з каталогу справа</div>
          ) : (
            grouped.map((g) => (
              <div key={g.section} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: 'var(--brand)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {g.section}
                </div>
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Позиція</th>
                        <th>К-сть</th>
                        <th>Ціна</th>
                        <th>Собів.</th>
                        <th>Сума</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.lines.map((line) => (
                        <tr key={line.id}>
                          <td>
                            <Field
                              value={line.name}
                              onChange={(e) => updateLine(line.id, { name: e.target.value })}
                            />
                            <Select
                              style={{ marginTop: 4 }}
                              value={line.section}
                              onChange={(e) => updateLine(line.id, { section: e.target.value })}
                            >
                              {sections.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td style={{ width: 90 }}>
                            <Field
                              type="number"
                              min={0}
                              step={0.1}
                              value={line.qty}
                              onChange={(e) =>
                                updateLine(line.id, { qty: Number(e.target.value) || 0 })
                              }
                            />
                            <div className="muted" style={{ fontSize: 11 }}>
                              {line.unit}
                            </div>
                          </td>
                          <td style={{ width: 100 }}>
                            <Field
                              type="number"
                              min={0}
                              value={line.price}
                              onChange={(e) =>
                                updateLine(line.id, { price: Number(e.target.value) || 0 })
                              }
                            />
                          </td>
                          <td style={{ width: 100 }}>
                            <Field
                              type="number"
                              min={0}
                              value={line.cost}
                              onChange={(e) =>
                                updateLine(line.id, { cost: Number(e.target.value) || 0 })
                              }
                            />
                          </td>
                          <td>
                            <div>{money(lineTotal(line))}</div>
                            <div className="muted" style={{ fontSize: 11 }}>
                              собів. {money(lineCost(line))}
                            </div>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeLine(line.id)}
                            >
                              ✕
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 24,
              paddingTop: 8,
              borderTop: '1px solid var(--line)',
              fontWeight: 650,
            }}
          >
            <span>Підсумок: {money(subtotal)}</span>
            <span>Разом: {money(total)}</span>
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="section-title">Каталог</div>
          <div className="filters" style={{ marginBottom: 10 }}>
            <Field
              placeholder="Пошук страв / послуг…"
              value={catalogQ}
              onChange={(e) => setCatalogQ(e.target.value)}
            />
            <Select
              value={catalogKind}
              onChange={(e) => setCatalogKind(e.target.value as typeof catalogKind)}
              style={{ maxWidth: 140 }}
            >
              <option value="">Усе</option>
              <option value="product">Страви</option>
              <option value="service">Послуги</option>
            </Select>
          </div>
          <Label label="Секція кошторису">
            <Select value={section} onChange={(e) => setSection(e.target.value)}>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Label>
          <div style={{ maxHeight: 560, overflow: 'auto', marginTop: 8 }}>
            {catalogHits.map((item) => (
              <button
                key={item.id}
                type="button"
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                  textAlign: 'left',
                }}
                onClick={() => addFromCatalog(item)}
              >
                <span>
                  <strong>{item.name}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {item.category} · {item.unit}
                  </div>
                </span>
                <span>{money(item.price)}</span>
              </button>
            ))}
            {catalogHits.length === 0 ? (
              <div className="empty">Нічого не знайдено</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
