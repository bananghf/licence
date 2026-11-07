import { useMemo } from 'react'
import { isAfter, parseISO, subDays } from 'date-fns'
import { useCrmStore } from '../store/useCrmStore'
import {
  lineTotal,
  money,
  orderCost,
  orderMargin,
  orderPaid,
  orderTotal,
} from '../lib/format'
import { PageHeader, Stat } from '../components/ui'
import { SERVICE_LABELS } from '../lib/labels'

export function ReportsPage() {
  const orders = useCrmStore((s) => s.orders)
  const purchases = useCrmStore((s) => s.purchases)

  const report = useMemo(() => {
    const since = subDays(new Date(), 90)
    const relevant = orders.filter(
      (o) =>
        ['confirmed', 'done', 'sent'].includes(o.status) &&
        isAfter(parseISO(o.eventStart), since),
    )

    const revenue = relevant.reduce((s, o) => s + orderTotal(o), 0)
    const cost = relevant.reduce((s, o) => s + orderCost(o), 0)
    const paid = relevant.reduce((s, o) => s + orderPaid(o), 0)
    const profit = revenue - cost
    const avgMargin =
      relevant.length === 0
        ? 0
        : relevant.reduce((s, o) => s + orderMargin(o), 0) / relevant.length

    const byService = Object.keys(SERVICE_LABELS).map((id) => {
      const list = relevant.filter((o) => o.serviceType === id)
      const rev = list.reduce((s, o) => s + orderTotal(o), 0)
      return {
        id,
        label: SERVICE_LABELS[id as keyof typeof SERVICE_LABELS],
        count: list.length,
        revenue: rev,
      }
    }).filter((x) => x.count > 0)

    // ABC by catalog line revenue
    const productMap = new Map<string, { name: string; revenue: number; qty: number }>()
    for (const o of relevant) {
      for (const line of o.lines) {
        if (line.kind !== 'product') continue
        const key = line.catalogItemId || line.name
        const prev = productMap.get(key) || { name: line.name, revenue: 0, qty: 0 }
        prev.revenue += lineTotal(line)
        prev.qty += line.qty
        productMap.set(key, prev)
      }
    }
    const products = [...productMap.values()].sort((a, b) => b.revenue - a.revenue)
    const totalProdRev = products.reduce((s, p) => s + p.revenue, 0) || 1
    let cum = 0
    const abc = products.map((p) => {
      cum += p.revenue
      const share = (p.revenue / totalProdRev) * 100
      const cumShare = (cum / totalProdRev) * 100
      const grade = cumShare <= 80 ? 'A' : cumShare <= 95 ? 'B' : 'C'
      return { ...p, share, cumShare, grade }
    })

    const purchaseSpend = purchases.reduce(
      (s, p) => s + p.items.reduce((ss, i) => ss + i.qty * i.price, 0),
      0,
    )

    const pipeline = orders
      .filter((o) => ['new', 'sent', 'confirmed'].includes(o.status))
      .reduce((s, o) => s + orderTotal(o), 0)

    return {
      revenue,
      cost,
      profit,
      paid,
      avgMargin,
      byService,
      abc,
      purchaseSpend,
      pipeline,
      count: relevant.length,
    }
  }, [orders, purchases])

  const maxService = Math.max(...report.byService.map((s) => s.revenue), 1)

  return (
    <div>
      <PageHeader
        title="Звіти"
        subtitle="Виручка, маржинальність та ABC-аналіз страв (90 днів)"
      />

      <div className="stat-grid">
        <Stat label="Виручка" value={money(report.revenue)} hint={`${report.count} подій`} />
        <Stat label="Прибуток" value={money(report.profit)} hint={`собів. ${money(report.cost)}`} />
        <Stat
          label="Середня маржа"
          value={`${report.avgMargin.toFixed(0)}%`}
          hint={`оплачено ${money(report.paid)}`}
        />
        <Stat
          label="Пайплайн"
          value={money(report.pipeline)}
          hint={`закупки ${money(report.purchaseSpend)}`}
        />
      </div>

      <div className="split">
        <div className="panel panel-pad">
          <div className="section-title">Виручка за типом сервісу</div>
          {report.byService.length === 0 ? (
            <div className="empty">Немає даних</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {report.byService
                .sort((a, b) => b.revenue - a.revenue)
                .map((s) => (
                  <div key={s.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                        fontSize: 14,
                      }}
                    >
                      <span>
                        <strong>{s.label}</strong>
                        <span className="muted"> · {s.count}</span>
                      </span>
                      <span>{money(s.revenue)}</span>
                    </div>
                    <div className="kpi-bar">
                      <span style={{ width: `${(s.revenue / maxService) * 100}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="panel panel-pad">
          <div className="section-title">Топ менеджери</div>
          {(() => {
            const map = new Map<string, { count: number; revenue: number }>()
            for (const o of orders.filter((x) =>
              ['confirmed', 'done', 'sent'].includes(x.status),
            )) {
              const prev = map.get(o.manager) || { count: 0, revenue: 0 }
              prev.count += 1
              prev.revenue += orderTotal(o)
              map.set(o.manager, prev)
            }
            const rows = [...map.entries()].sort((a, b) => b[1].revenue - a[1].revenue)
            if (!rows.length) return <div className="empty">Немає даних</div>
            return (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Менеджер</th>
                      <th>Подій</th>
                      <th>Виручка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(([name, v]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{v.count}</td>
                        <td>{money(v.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()}
        </div>
      </div>

      <div className="panel panel-pad" style={{ marginTop: 14 }}>
        <div className="section-title">ABC-аналіз страв</div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          A — до 80% виручки, B — до 95%, C — решта. Допомагає пріоритезувати меню.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Клас</th>
                <th>Страва</th>
                <th>К-сть</th>
                <th>Виручка</th>
                <th>Частка</th>
                <th>Накопич.</th>
              </tr>
            </thead>
            <tbody>
              {report.abc.slice(0, 25).map((row) => (
                <tr key={row.name}>
                  <td>
                    <span
                      className="badge"
                      style={{
                        color:
                          row.grade === 'A'
                            ? 'var(--ok)'
                            : row.grade === 'B'
                              ? 'var(--warn)'
                              : 'var(--muted)',
                      }}
                    >
                      {row.grade}
                    </span>
                  </td>
                  <td>{row.name}</td>
                  <td>{Math.round(row.qty)}</td>
                  <td>{money(row.revenue)}</td>
                  <td>{row.share.toFixed(1)}%</td>
                  <td>{row.cumShare.toFixed(1)}%</td>
                </tr>
              ))}
              {report.abc.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">Немає даних по стравах</div>
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
