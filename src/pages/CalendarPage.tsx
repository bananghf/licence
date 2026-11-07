import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { uk } from 'date-fns/locale'
import { useCrmStore } from '../store/useCrmStore'
import { Button, PageHeader, ServiceBadge, StatusBadge } from '../components/ui'
import { formatDateTime, money, orderTotal } from '../lib/format'

export function CalendarPage() {
  const orders = useCrmStore((s) => s.orders)
  const navigate = useNavigate()
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<Date | null>(new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof orders>()
    for (const o of orders) {
      if (o.status === 'lost') continue
      const key = format(parseISO(o.eventStart), 'yyyy-MM-dd')
      const list = map.get(key) || []
      list.push(o)
      map.set(key, list)
    }
    return map
  }, [orders])

  const dayOrders = selected
    ? eventsByDay.get(format(selected, 'yyyy-MM-dd')) || []
    : []

  const weekLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

  return (
    <div>
      <PageHeader
        title="Календар подій"
        subtitle={format(cursor, 'LLLL yyyy', { locale: uk })}
        actions={
          <div className="btn-row">
            <Button onClick={() => setCursor((c) => addMonths(c, -1))}>←</Button>
            <Button onClick={() => setCursor(startOfMonth(new Date()))}>Сьогодні</Button>
            <Button onClick={() => setCursor((c) => addMonths(c, 1))}>→</Button>
          </div>
        }
      />

      <div className="split">
        <div className="panel panel-pad">
          <div className="calendar-grid" style={{ marginBottom: 6 }}>
            {weekLabels.map((d) => (
              <div key={d} className="cal-head">
                {d}
              </div>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const events = eventsByDay.get(key) || []
              const isToday = isSameDay(day, new Date())
              const isSelected = selected && isSameDay(day, selected)
              return (
                <button
                  key={key}
                  type="button"
                  className={`cal-cell${!isSameMonth(day, cursor) ? ' out' : ''}${isToday ? ' today' : ''}`}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    outline: isSelected ? '2px solid var(--accent)' : undefined,
                  }}
                  onClick={() => setSelected(day)}
                >
                  <div className="cal-day">{format(day, 'd')}</div>
                  {events.slice(0, 3).map((o) => (
                    <div
                      key={o.id}
                      className="cal-event"
                      title={o.title}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/orders/${o.id}`)
                      }}
                    >
                      {o.title}
                    </div>
                  ))}
                  {events.length > 3 ? (
                    <div className="muted" style={{ fontSize: 11 }}>
                      +{events.length - 3}
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="section-title">
            {selected
              ? format(selected, 'd MMMM yyyy', { locale: uk })
              : 'Оберіть день'}
          </div>
          {dayOrders.length === 0 ? (
            <div className="empty">Немає подій</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {dayOrders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="btn"
                  style={{
                    display: 'block',
                    textAlign: 'left',
                    padding: 14,
                    height: 'auto',
                  }}
                  onClick={() => navigate(`/orders/${o.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{o.number}</strong>
                    <StatusBadge status={o.status} />
                  </div>
                  <div style={{ marginTop: 4 }}>{o.title}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {formatDateTime(o.eventStart)} · {o.guests} гостей
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ServiceBadge type={o.serviceType} />
                    <span style={{ marginLeft: 'auto', fontWeight: 700 }}>
                      {money(orderTotal(o))}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
