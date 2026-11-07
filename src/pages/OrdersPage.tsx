import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCrmStore } from '../store/useCrmStore'
import {
  formatDateTime,
  money,
  orderPaymentStatus,
  orderTotal,
} from '../lib/format'
import {
  Button,
  Field,
  PageHeader,
  PaymentBadge,
  Select,
  ServiceBadge,
  StatusBadge,
} from '../components/ui'
import type { OrderStatus, PaymentStatus, ServiceType } from '../types'
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import { STATUS_LABELS, SERVICE_LABELS, PAYMENT_LABELS } from '../lib/labels'

export function OrdersPage() {
  const orders = useCrmStore((s) => s.orders)
  const managers = useCrmStore((s) => s.settings.managers)
  const createOrder = useCrmStore((s) => s.createOrder)
  const deleteOrder = useCrmStore((s) => s.deleteOrder)
  const duplicateOrder = useCrmStore((s) => s.duplicateOrder)
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [service, setService] = useState<ServiceType | ''>('')
  const [payment, setPayment] = useState<PaymentStatus | ''>('')
  const [manager, setManager] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status && o.status !== status) return false
      if (service && o.serviceType !== service) return false
      if (manager && o.manager !== manager) return false
      if (payment && orderPaymentStatus(o) !== payment) return false
      if (from || to) {
        const d = parseISO(o.eventStart)
        const start = from ? startOfDay(parseISO(from)) : new Date(0)
        const end = to ? endOfDay(parseISO(to)) : new Date(8640000000000000)
        if (!isWithinInterval(d, { start, end })) return false
      }
      if (q.trim()) {
        const hay = `${o.number} ${o.title} ${o.address} ${o.manager}`.toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) return false
      }
      return true
    })
  }, [orders, status, service, payment, manager, from, to, q])

  return (
    <div>
      <PageHeader
        title="Замовлення"
        subtitle={`${filtered.length} з ${orders.length}`}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate(`/orders/${createOrder()}`)}
          >
            + Створити
          </Button>
        }
      />

      <div className="filters">
        <Field
          placeholder="Пошук…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')} style={{ maxWidth: 160 }}>
          <option value="">Усі статуси</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select value={service} onChange={(e) => setService(e.target.value as ServiceType | '')} style={{ maxWidth: 160 }}>
          <option value="">Усі типи</option>
          {Object.entries(SERVICE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select value={payment} onChange={(e) => setPayment(e.target.value as PaymentStatus | '')} style={{ maxWidth: 160 }}>
          <option value="">Оплата</option>
          {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select value={manager} onChange={(e) => setManager(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Усі менеджери</option>
          {managers.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>
        <Field type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ maxWidth: 150 }} />
        <Field type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ maxWidth: 150 }} />
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>№</th>
                <th>Назва</th>
                <th>Дата</th>
                <th>Тип</th>
                <th>Статус</th>
                <th>Оплата</th>
                <th>Менеджер</th>
                <th>Сума</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="clickable" onClick={() => navigate(`/orders/${o.id}`)}>
                  <td><strong>{o.number}</strong></td>
                  <td>
                    {o.title}
                    {o.published ? <div className="muted" style={{ fontSize: 11 }}>КП опубліковано</div> : null}
                  </td>
                  <td>{formatDateTime(o.eventStart)}</td>
                  <td><ServiceBadge type={o.serviceType} /></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td><PaymentBadge status={orderPaymentStatus(o)} /></td>
                  <td>{o.manager}</td>
                  <td>{money(orderTotal(o))}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="btn-row">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/orders/${duplicateOrder(o.id)}`)}
                      >
                        Копія
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Видалити ${o.number}?`)) deleteOrder(o.id)
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
                  <td colSpan={9}>
                    <div className="empty">Немає замовлень за фільтрами</div>
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
