import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { formatDate } from '../lib/format'
import { toDateInput } from '../lib/datetime'
import { KIND_LABELS, STOCK_MOVE_LABELS } from '../lib/labels'
import { useCrmStore } from '../store/useCrmStore'
import {
  Button,
  Field,
  Label,
  Modal,
  PageHeader,
  Select,
  Stat,
  Textarea,
} from '../components/ui'
import type { StockBalance, StockMovement } from '../types'

type KindFilter = 'ingredient' | 'product' | 'all'
type MoveFormLine = { catalogItemId: string; qty: string }

function fromDateInput(value: string): string {
  if (!value) return new Date().toISOString()
  const d = new Date(`${value}T12:00:00`)
  if (Number.isNaN(d.getTime())) return new Date().toISOString()
  return d.toISOString()
}

export function WarehousePage() {
  const catalog = useCrmStore((s) => s.catalog)
  const [balances, setBalances] = useState<StockBalance[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [kind, setKind] = useState<KindFilter>('ingredient')
  const [q, setQ] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intakeOpen, setIntakeOpen] = useState(false)
  const [writeoffOpen, setWriteoffOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [b, m] = await Promise.all([
        api<StockBalance[]>(`/warehouse/balances?kind=${kind}`),
        api<StockMovement[]>('/warehouse/movements?limit=80'),
      ])
      setBalances(b)
      setMovements(m)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    return balances.filter((b) => {
      if (lowOnly && !b.lowStock) return false
      if (!q.trim()) return true
      const hay = `${b.name} ${b.category}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [balances, lowOnly, q])

  const lowCount = balances.filter((b) => b.lowStock).length
  const totalSku = balances.length

  const stockable = useMemo(
    () =>
      catalog.filter(
        (c) =>
          c.active && (c.kind === 'ingredient' || c.kind === 'product'),
      ),
    [catalog],
  )

  const saveMin = async (catalogItemId: string, minQuantity: number) => {
    try {
      const updated = await api<StockBalance>(
        `/warehouse/balances/${catalogItemId}/min`,
        {
          method: 'PATCH',
          body: JSON.stringify({ minQuantity }),
        },
      )
      setBalances((prev) =>
        prev.map((b) =>
          b.catalogItemId === catalogItemId ? { ...b, ...updated } : b,
        ),
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не вдалося зберегти мінімум')
    }
  }

  return (
    <div>
      <PageHeader
        title="Склад"
        subtitle="Залишки інгредієнтів, оприбуткування та списання"
        actions={
          <div className="btn-row">
            <Button onClick={() => setWriteoffOpen(true)}>Списання</Button>
            <Button variant="primary" onClick={() => setIntakeOpen(true)}>
              + Оприбуткування
            </Button>
          </div>
        }
      />

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <Stat label="Позицій" value={String(totalSku)} />
        <Stat
          label="Низький залишок"
          value={String(lowCount)}
          hint={lowCount ? 'Перевірте закупку' : 'У нормі'}
        />
        <Stat
          label="Рухів"
          value={String(movements.length)}
          hint="Останні записи"
        />
      </div>

      <div className="filters">
        <Select
          value={kind}
          onChange={(e) => setKind(e.target.value as KindFilter)}
          style={{ maxWidth: 200 }}
        >
          <option value="ingredient">Інгредієнти</option>
          <option value="product">Страви / товари</option>
          <option value="all">Усе</option>
        </Select>
        <Field
          placeholder="Пошук…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 240 }}
        />
        <label className="label" style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />
          <span>Лише низький залишок</span>
        </label>
        <Button size="sm" variant="ghost" onClick={() => void load()}>
          Оновити
        </Button>
      </div>

      {error ? <div className="empty">{error}</div> : null}

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Тип</th>
                <th>Категорія</th>
                <th>Залишок</th>
                <th>Од.</th>
                <th>Мін.</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">Завантаження…</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">Немає позицій на складі</div>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.catalogItemId}>
                    <td>
                      <strong>{b.name}</strong>
                    </td>
                    <td>{KIND_LABELS[b.kind as keyof typeof KIND_LABELS] || b.kind}</td>
                    <td>{b.category}</td>
                    <td>
                      <strong
                        style={{
                          color: b.lowStock ? 'var(--warn)' : undefined,
                        }}
                      >
                        {b.quantity}
                      </strong>
                    </td>
                    <td>{b.unit}</td>
                    <td>
                      <Field
                        type="number"
                        min={0}
                        step="0.1"
                        defaultValue={b.minQuantity}
                        key={`${b.catalogItemId}-${b.minQuantity}`}
                        style={{ width: 88 }}
                        onBlur={(e) => {
                          const v = Number(e.target.value)
                          if (!Number.isNaN(v) && v !== b.minQuantity) {
                            void saveMin(b.catalogItemId, v)
                          }
                        }}
                      />
                    </td>
                    <td>
                      {b.lowStock ? (
                        <span className="badge" style={{ color: 'var(--warn)' }}>
                          Мало
                        </span>
                      ) : (
                        <span className="badge" style={{ color: 'var(--ok)' }}>
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="page-head" style={{ marginTop: 28 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Історія рухів</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Оприбуткування, списання та надходження з закупок
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Позиція</th>
                <th>К-сть</th>
                <th>Постачальник</th>
                <th>Примітка</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">Поки немає рухів</div>
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td>{formatDate(m.date)}</td>
                    <td>{STOCK_MOVE_LABELS[m.type]}</td>
                    <td>{m.name || m.catalogItemId}</td>
                    <td>
                      {m.type === 'writeoff' ? '−' : '+'}
                      {m.qty} {m.unit || ''}
                    </td>
                    <td>{m.supplier || '—'}</td>
                    <td className="muted">{m.note || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {intakeOpen ? (
        <StockMoveModal
          title="Оприбуткування / введення на склад"
          mode="intake"
          items={stockable}
          saving={saving}
          onClose={() => setIntakeOpen(false)}
          onSubmit={async (payload) => {
            setSaving(true)
            try {
              await api('/warehouse/intake', {
                method: 'POST',
                body: JSON.stringify(payload),
              })
              setIntakeOpen(false)
              await load()
            } catch (err) {
              const msg =
                err instanceof ApiError
                  ? err.message
                  : err instanceof Error
                    ? err.message
                    : 'Помилка'
              alert(msg)
            } finally {
              setSaving(false)
            }
          }}
        />
      ) : null}

      {writeoffOpen ? (
        <StockMoveModal
          title="Списання зі складу"
          mode="writeoff"
          items={stockable.filter((c) => c.kind === 'ingredient')}
          saving={saving}
          onClose={() => setWriteoffOpen(false)}
          onSubmit={async (payload) => {
            setSaving(true)
            try {
              await api('/warehouse/writeoff', {
                method: 'POST',
                body: JSON.stringify(payload),
              })
              setWriteoffOpen(false)
              await load()
            } catch (err) {
              const msg =
                err instanceof ApiError
                  ? err.message
                  : err instanceof Error
                    ? err.message
                    : 'Помилка'
              alert(msg)
            } finally {
              setSaving(false)
            }
          }}
        />
      ) : null}
    </div>
  )
}

function StockMoveModal({
  title,
  mode,
  items,
  saving,
  onClose,
  onSubmit,
}: {
  title: string
  mode: 'intake' | 'writeoff'
  items: { id: string; name: string; unit: string; kind: string }[]
  saving: boolean
  onClose: () => void
  onSubmit: (payload: {
    date: string
    supplier?: string
    note?: string
    items: { catalogItemId: string; qty: number }[]
  }) => Promise<void>
}) {
  const [date, setDate] = useState(toDateInput(new Date().toISOString()))
  const [supplier, setSupplier] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<MoveFormLine[]>([
    { catalogItemId: items[0]?.id || '', qty: '' },
  ])

  return (
    <Modal
      title={title}
      wide
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Скасувати
          </Button>
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => {
              const parsed = lines
                .filter((l) => l.catalogItemId && Number(l.qty) > 0)
                .map((l) => ({
                  catalogItemId: l.catalogItemId,
                  qty: Number(l.qty),
                }))
              if (parsed.length === 0) {
                alert('Додайте хоча б одну позицію з кількістю')
                return
              }
              void onSubmit({
                date: fromDateInput(date),
                supplier: mode === 'intake' ? supplier || undefined : undefined,
                note: note || undefined,
                items: parsed,
              })
            }}
          >
            {saving ? 'Збереження…' : 'Зберегти'}
          </Button>
        </>
      }
    >
      <div className="grid-2">
        <Label label="Дата">
          <Field
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Label>
        {mode === 'intake' ? (
          <Label label="Постачальник (необовʼязково)">
            <Field
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Назва постачальника"
            />
          </Label>
        ) : null}
        <Label label="Примітка">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Коментар до документа"
          />
        </Label>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Позиції</strong>
        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Товар / інгредієнт</th>
                <th>К-сть</th>
                <th>Од.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const item = items.find((i) => i.id === line.catalogItemId)
                return (
                  <tr key={idx}>
                    <td>
                      <Select
                        value={line.catalogItemId}
                        onChange={(e) => {
                          const next = [...lines]
                          next[idx] = {
                            ...next[idx],
                            catalogItemId: e.target.value,
                          }
                          setLines(next)
                        }}
                      >
                        <option value="">— оберіть —</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      <Field
                        type="number"
                        min={0}
                        step="0.001"
                        value={line.qty}
                        onChange={(e) => {
                          const next = [...lines]
                          next[idx] = { ...next[idx], qty: e.target.value }
                          setLines(next)
                        }}
                        style={{ width: 120 }}
                      />
                    </td>
                    <td>{item?.unit || '—'}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setLines((prev) => prev.filter((_, i) => i !== idx))
                        }
                        disabled={lines.length <= 1}
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Button
          size="sm"
          style={{ marginTop: 8 }}
          onClick={() =>
            setLines((prev) => [
              ...prev,
              { catalogItemId: items[0]?.id || '', qty: '' },
            ])
          }
        >
          + Рядок
        </Button>
      </div>
    </Modal>
  )
}
