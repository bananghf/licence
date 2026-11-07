import { Link, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useCrmStore } from '../store/useCrmStore'
import {
  formatDateTime,
  money,
  orderMargin,
  orderPaymentStatus,
  orderTotal,
} from '../lib/format'
import { PageHeader, PaymentBadge, ServiceBadge, Stat, StatusBadge, Button } from '../components/ui'
import { isAfter, parseISO, startOfDay, subDays } from 'date-fns'

export function Dashboard() {
  const orders = useCrmStore((s) => s.orders)
  const purchases = useCrmStore((s) => s.purchases)
  const settings = useCrmStore((s) => s.settings)
  const createOrder = useCrmStore((s) => s.createOrder)
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const active = orders.filter((o) => !['lost', 'done', 'draft'].includes(o.status))
    const upcoming = orders
      .filter((o) => isAfter(parseISO(o.eventStart), startOfDay(new Date())) && o.status !== 'lost')
      .sort((a, b) => a.eventStart.localeCompare(b.eventStart))
      .slice(0, 6)

    const since = subDays(new Date(), 30)
    const recentDone = orders.filter(
      (o) =>
        (o.status === 'done' || o.status === 'confirmed') &&
        isAfter(parseISO(o.updatedAt), since),
    )
    const revenue = recentDone.reduce((s, o) => s + orderTotal(o), 0)
    const avgMargin =
      recentDone.length === 0
        ? 0
        : recentDone.reduce((s, o) => s + orderMargin(o), 0) / recentDone.length

    return { active: active.length, upcoming, revenue, avgMargin }
  }, [orders])

  return (
    <div>
      <PageHeader
        title="Огляд"
        subtitle={`${settings.companyName} · операційна панель`}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate(`/orders/${createOrder()}`)}
          >
            + Нове замовлення
          </Button>
        }
      />

      <div className="stat-grid">
        <Stat label="Активні замовлення" value={String(stats.active)} hint="new / sent / confirmed" />
        <Stat label="Виручка 30 днів" value={money(stats.revenue)} hint="підтверджені та виконані" />
        <Stat label="Середня маржа" value={`${stats.avgMargin.toFixed(0)}%`} hint="по останніх подіях" />
        <Stat
          label="Закупки в роботі"
          value={String(purchases.filter((p) => p.status !== 'received').length)}
          hint="planned / ordered"
        />
      </div>

      <div className="split">
        <div className="panel panel-pad">
          <div className="section-title">Найближчі події</div>
          {stats.upcoming.length === 0 ? (
            <div className="empty">Немає найближчих подій</div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Подія</th>
                    <th>Дата</th>
                    <th>Тип</th>
                    <th>Статус</th>
                    <th>Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.upcoming.map((o) => (
                    <tr key={o.id} className="clickable" onClick={() => navigate(`/orders/${o.id}`)}>
                      <td>
                        <strong>{o.number}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>{o.title}</div>
                      </td>
                      <td>{formatDateTime(o.eventStart)}</td>
                      <td><ServiceBadge type={o.serviceType} /></td>
                      <td><StatusBadge status={o.status} /></td>
                      <td>{money(orderTotal(o))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel panel-pad">
          <div className="section-title">Швидкі дії</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Link className="btn" to="/calendar">Відкрити календар</Link>
            <Link className="btn" to="/purchases">Список закупок</Link>
            <Link className="btn" to="/reports">Звіти та ABC</Link>
            <Link className="btn" to="/catalog">Каталог меню</Link>
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="section-title">Оплата по відкритих</div>
            {orders
              .filter((o) => ['sent', 'confirmed', 'new'].includes(o.status))
              .slice(0, 5)
              .map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <Link to={`/orders/${o.id}`} style={{ fontWeight: 650 }}>
                    {o.number}
                  </Link>
                  <PaymentBadge status={orderPaymentStatus(o)} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
