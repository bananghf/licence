import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { isAfter, parseISO, startOfDay } from 'date-fns'
import { useCrmStore } from '../store/useCrmStore'
import { formatDate, formatDateTime } from '../lib/format'
import { PageHeader, ServiceBadge, StatusBadge } from '../components/ui'

export function KitchenBoardPage() {
  const orders = useCrmStore((s) => s.orders)

  const queue = useMemo(() => {
    const today = startOfDay(new Date())
    return orders
      .filter((o) => ['confirmed', 'sent', 'done'].includes(o.status))
      .filter((o) => {
        const prod = parseISO(o.productionDate || o.eventStart)
        return isAfter(prod, today) || o.status === 'confirmed'
      })
      .sort((a, b) =>
        (a.productionDate || a.eventStart).localeCompare(b.productionDate || b.eventStart),
      )
  }, [orders])

  return (
    <div>
      <PageHeader
        title="Кухня"
        subtitle="Черга внутрішніх смет і завдань поварам"
      />

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>№</th>
                <th>Подія</th>
                <th>Виробництво</th>
                <th>Подія</th>
                <th>Сервіс</th>
                <th>Порції</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {queue.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.number}</strong>
                  </td>
                  <td>
                    {o.title}
                    {o.kitchenNotes ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        {o.kitchenNotes}
                      </div>
                    ) : null}
                  </td>
                  <td>{formatDate(o.productionDate || o.eventStart)}</td>
                  <td>{formatDateTime(o.eventStart)}</td>
                  <td>
                    <ServiceBadge type={o.serviceType} />
                  </td>
                  <td>{o.portions}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td>
                    <div className="btn-row">
                      <Link className="btn btn-sm" to={`/orders/${o.id}/kitchen`}>
                        Лист
                      </Link>
                      <Link className="btn btn-sm btn-ghost" to={`/orders/${o.id}`}>
                        Замовлення
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">Немає замовлень у черзі кухні</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
