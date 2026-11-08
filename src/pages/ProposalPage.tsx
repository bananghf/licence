import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  formatDateTime,
  lineTotal,
  money,
  orderSubtotal,
  orderTotal,
} from '../lib/format'
import { SERVICE_LABELS } from '../lib/labels'
import type { AppSettings, Company, Contact, EstimateLine, Order } from '../types'
import { api } from '../lib/api'

interface ProposalPayload {
  order: Order
  settings: AppSettings
  company: Company | null
  contact: Contact | null
}

export function ProposalPage() {
  const { id } = useParams()
  const [data, setData] = useState<ProposalPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    api<ProposalPayload>(`/public/proposals/${id}`)
      .then((payload) => {
        if (!cancelled) {
          setData(payload)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Не знайдено')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const order = data?.order
  const settings = data?.settings
  const company = data?.company
  const contact = data?.contact

  const grouped = useMemo(() => {
    if (!order) return [] as { section: string; lines: EstimateLine[]; sum: number }[]
    const map = new Map<string, EstimateLine[]>()
    for (const line of order.lines) {
      const list = map.get(line.section) || []
      list.push(line)
      map.set(line.section, list)
    }
    return [...map.entries()].map(([section, lines]) => ({
      section,
      lines,
      sum: lines.reduce((s, l) => s + lineTotal(l), 0),
    }))
  }, [order])

  if (loading) {
    return (
      <div className="proposal">
        <div className="proposal-card">
          <div className="proposal-body muted">Завантаження КП…</div>
        </div>
      </div>
    )
  }

  if (!order || !settings) {
    return (
      <div className="proposal">
        <div className="proposal-card">
          <div className="proposal-body">
            <h1>КП недоступне</h1>
            <p className="muted">
              {error || 'Замовлення не опубліковане або не існує.'}
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 12 }}>
              Увійти в CRM
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = orderSubtotal(order)
  const total = orderTotal(order)

  return (
    <div className="proposal">
      <div className="proposal-card">
        <div className="proposal-head">
          <div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{settings.logoText}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
              {settings.companyName}
            </div>
            <div style={{ marginTop: 8, opacity: 0.9 }}>Комерційна пропозиція</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{order.number}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
              {money(total, settings.currency)}
            </div>
          </div>
        </div>

        <div className="proposal-body">
          <h1 style={{ marginTop: 0 }}>{order.title}</h1>

          <div className="grid-3" style={{ marginBottom: 22 }}>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Подія
              </div>
              <div>{formatDateTime(order.eventStart)}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {SERVICE_LABELS[order.serviceType]} · {order.guests} гостей
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Клієнт
              </div>
              <div>{company?.name || contact?.name || '—'}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {contact?.phone || company?.phone || ''}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Адреса
              </div>
              <div>{order.address || '—'}</div>
            </div>
          </div>

          {grouped.map((g) => (
            <div key={g.section} style={{ marginBottom: 20 }}>
              <h2
                style={{
                  fontSize: 15,
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: 6,
                  marginBottom: 8,
                }}
              >
                {g.section}
              </h2>
              <table className="data">
                <thead>
                  <tr>
                    <th>Позиція</th>
                    <th>К-сть</th>
                    <th>Ціна</th>
                    <th>Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {g.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.name}</td>
                      <td>
                        {line.qty} {line.unit}
                      </td>
                      <td>{money(line.price, settings.currency)}</td>
                      <td>{money(lineTotal(line), settings.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 8,
                  fontWeight: 600,
                }}
              >
                {money(g.sum, settings.currency)}
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: 8,
              borderTop: '2px solid var(--brand)',
              paddingTop: 12,
              display: 'grid',
              gap: 6,
              maxWidth: 320,
              marginLeft: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Підсумок</span>
              <span>{money(subtotal, settings.currency)}</span>
            </div>
            {order.markupPercent > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Націнка {order.markupPercent}%</span>
                <span>
                  +{money(subtotal * (order.markupPercent / 100), settings.currency)}
                </span>
              </div>
            ) : null}
            {order.discountPercent > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Знижка {order.discountPercent}%</span>
                <span>−{order.discountPercent}%</span>
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              <span>Разом</span>
              <span>{money(total, settings.currency)}</span>
            </div>
          </div>

          {order.notes ? (
            <div style={{ marginTop: 18 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Примітки
              </div>
              <div>{order.notes}</div>
            </div>
          ) : null}

          <div
            className="muted"
            style={{
              marginTop: 28,
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            Підготовлено в {settings.logoText}
          </div>
        </div>
      </div>
    </div>
  )
}
