import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCrmStore } from '../store/useCrmStore'
import {
  formatDateTime,
  lineTotal,
  money,
  orderSubtotal,
  orderTotal,
} from '../lib/format'
import { SERVICE_LABELS } from '../lib/labels'
import type { EstimateLine } from '../types'

export function ProposalPage() {
  const { id } = useParams()
  const order = useCrmStore((s) => s.orders.find((o) => o.id === id))
  const settings = useCrmStore((s) => s.settings)
  const companies = useCrmStore((s) => s.companies)
  const contacts = useCrmStore((s) => s.contacts)

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

  if (!order) {
    return (
      <div className="proposal">
        <div className="proposal-card">
          <div className="proposal-body">
            <div className="empty">Пропозицію не знайдено</div>
          </div>
        </div>
      </div>
    )
  }

  if (!order.published) {
    return (
      <div className="proposal">
        <div className="proposal-card">
          <div className="proposal-hero">
            <div style={{ opacity: 0.85, fontSize: 13 }}>{settings.companyName}</div>
            <h1>КП ще не опубліковано</h1>
            <p>Менеджер готує комерційну пропозицію. Завітайте пізніше.</p>
          </div>
          <div className="proposal-body">
            <Link className="btn" to={`/orders/${order.id}`}>
              Відкрити в CRM
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const company = companies.find((c) => c.id === order.companyId)
  const contact = contacts.find((c) => c.id === order.contactId)
  const subtotal = orderSubtotal(order)
  const total = orderTotal(order)
  const perGuest = order.guests > 0 ? total / order.guests : 0

  return (
    <div className="proposal">
      <div className="proposal-card">
        <div className="proposal-hero">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ opacity: 0.85, fontSize: 13, letterSpacing: '0.08em' }}>
                {settings.logoText.toUpperCase()}
              </div>
              <h1>Комерційна пропозиція</h1>
              <p style={{ opacity: 0.9, maxWidth: 520 }}>
                {order.title} · {SERVICE_LABELS[order.serviceType]}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>№ {order.number}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{money(total)}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {order.guests} гостей · {money(perGuest)} / гість
              </div>
            </div>
          </div>
        </div>

        <div className="proposal-body">
          <div className="grid-3" style={{ marginBottom: 22 }}>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Дата події
              </div>
              <strong>{formatDateTime(order.eventStart)}</strong>
              {order.eventEnd ? (
                <div className="muted" style={{ fontSize: 13 }}>
                  до {formatDateTime(order.eventEnd)}
                </div>
              ) : null}
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Локація
              </div>
              <strong>{order.address || 'Узгоджується'}</strong>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Клієнт
              </div>
              <strong>{company?.name || contact?.name || '—'}</strong>
              {contact ? (
                <div className="muted" style={{ fontSize: 13 }}>
                  {contact.name}
                  {contact.phone ? ` · ${contact.phone}` : ''}
                </div>
              ) : null}
            </div>
          </div>

          {grouped.map((g) => (
            <div key={g.section} style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: 6,
                }}
              >
                <strong style={{ color: 'var(--brand)' }}>{g.section}</strong>
                <span className="muted">{money(g.sum)}</span>
              </div>
              <table className="data">
                <tbody>
                  {g.lines.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <strong>{line.name}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {line.qty} {line.unit} × {money(line.price)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 650 }}>
                        {money(lineTotal(line))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div
            style={{
              marginTop: 8,
              padding: 16,
              borderRadius: 14,
              background: 'var(--bg)',
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">Підсумок</span>
              <span>{money(subtotal)}</span>
            </div>
            {order.markupPercent ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Націнка {order.markupPercent}%</span>
                <span>
                  +{money(subtotal * (order.markupPercent / 100))}
                </span>
              </div>
            ) : null}
            {order.discountPercent ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Знижка {order.discountPercent}%</span>
                <span>−{order.discountPercent}%</span>
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 20,
                fontWeight: 800,
                borderTop: '1px solid var(--line)',
                paddingTop: 10,
              }}
            >
              <span>Разом до сплати</span>
              <span>{money(total)}</span>
            </div>
          </div>

          {order.notes ? (
            <div style={{ marginTop: 18 }}>
              <div className="section-title">Умови та примітки</div>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-soft)' }}>{order.notes}</p>
            </div>
          ) : null}

          <div
            style={{
              marginTop: 28,
              paddingTop: 16,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              fontSize: 13,
              color: 'var(--muted)',
            }}
          >
            <div>
              <strong style={{ color: 'var(--ink)' }}>{settings.companyName}</strong>
              <div>Менеджер: {order.manager}</div>
            </div>
            <button type="button" className="btn no-print" onClick={() => window.print()}>
              Друкувати / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
