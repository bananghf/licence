import { Link, useParams } from 'react-router-dom'
import { useCrmStore } from '../store/useCrmStore'
import { formatDate, formatDateTime } from '../lib/format'
import { SERVICE_LABELS } from '../lib/labels'
import { Button, PageHeader } from '../components/ui'

export function KitchenPage() {
  const { id } = useParams()
  const order = useCrmStore((s) => s.orders.find((o) => o.id === id))
  const settings = useCrmStore((s) => s.settings)
  const catalog = useCrmStore((s) => s.catalog)

  if (!order) {
    return (
      <div>
        <PageHeader title="Замовлення не знайдено" />
        <Link className="btn" to="/orders">До замовлень</Link>
      </div>
    )
  }

  const productLines = order.lines.filter((l) => l.kind === 'product')
  const sections = [...new Set(productLines.map((l) => l.section || 'Кухня'))]
  const productionLabel = order.productionDate
    ? formatDate(order.productionDate)
    : formatDate(order.eventStart)

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={`Кухня · ${order.number}`}
          subtitle="Внутрішня смета / друкований лист завдань"
          actions={
            <>
              <Link className="btn" to="/kitchen">Черга кухні</Link>
              <Link className="btn" to={`/orders/${order.id}`}>← Замовлення</Link>
              <Button variant="primary" onClick={() => window.print()}>Друк</Button>
            </>
          }
        />
      </div>

      <div className="kitchen-sheet">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <div className="muted">{settings.companyName}</div>
            <h1>Кухонне завдання</h1>
            <div style={{ marginTop: 6 }}>
              <strong>{order.number}</strong> · {order.title}
            </div>
            <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
              Виробництво: {productionLabel}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>Подія: {formatDateTime(order.eventStart)}</div>
            <div>{SERVICE_LABELS[order.serviceType]}</div>
            <div><strong>{order.guests}</strong> гостей / <strong>{order.portions}</strong> порцій</div>
          </div>
        </div>

        <div style={{ marginBottom: 14, padding: 12, background: '#f4f7f5', borderRadius: 10 }}>
          <strong>Адреса:</strong> {order.address || '—'}
          {order.kitchenNotes ? (
            <div style={{ marginTop: 6 }}>
              <strong>Нотатки:</strong> {order.kitchenNotes}
            </div>
          ) : null}
        </div>

        {sections.map((section) => (
          <div key={section} style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, marginBottom: 8, borderBottom: '2px solid var(--brand)', paddingBottom: 4 }}>
              {section}
            </h2>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>☐</th>
                  <th>Страва</th>
                  <th>К-сть</th>
                  <th>Од.</th>
                  <th>Склад (ТТК)</th>
                </tr>
              </thead>
              <tbody>
                {productLines
                  .filter((l) => (l.section || 'Кухня') === section)
                  .map((l) => {
                    const bom = l.catalogItemId
                      ? catalog.find((c) => c.id === l.catalogItemId)?.composition || []
                      : []
                    const bomText = bom
                      .map((row) => {
                        const ing = catalog.find((c) => c.id === row.ingredientId)
                        if (!ing) return null
                        const qty = Math.round(row.qty * l.qty * 1000) / 1000
                        return `${ing.name} ${qty} ${ing.unit}`
                      })
                      .filter(Boolean)
                      .join(' · ')
                    return (
                      <tr key={l.id}>
                        <td style={{ fontSize: 18 }}>☐</td>
                        <td><strong>{l.name}</strong></td>
                        <td style={{ fontSize: 18, fontWeight: 750 }}>{l.qty}</td>
                        <td>{l.unit}</td>
                        <td style={{ fontSize: 12 }}>{bomText || '—'}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        ))}

        {productLines.length === 0 ? (
          <div className="empty">Немає страв у кошторисі</div>
        ) : null}

        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div className="muted">Шеф</div>
            <div style={{ borderBottom: '1px solid #999', height: 28 }} />
          </div>
          <div>
            <div className="muted">Час готовності</div>
            <div style={{ borderBottom: '1px solid #999', height: 28 }} />
          </div>
          <div>
            <div className="muted">Відвантаження</div>
            <div style={{ borderBottom: '1px solid #999', height: 28 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
