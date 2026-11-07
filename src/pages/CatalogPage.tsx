import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCrmStore } from '../store/useCrmStore'
import { money } from '../lib/format'
import { KIND_LABELS } from '../lib/labels'
import {
  Button,
  Field,
  Label,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui'
import type { CatalogItem, CatalogKind } from '../types'

type Tab = CatalogKind

const emptyForm = (kind: CatalogKind): Omit<CatalogItem, 'id'> => ({
  kind,
  name: '',
  category: '',
  unit: kind === 'ingredient' ? 'кг' : 'порц.',
  price: 0,
  cost: 0,
  description: '',
  tags: [],
  active: true,
})

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'product'
  const qParam = params.get('q') || ''
  const catalog = useCrmStore((s) => s.catalog)
  const upsert = useCrmStore((s) => s.upsertCatalogItem)
  const remove = useCrmStore((s) => s.deleteCatalogItem)

  const [q, setQ] = useState(qParam)
  const [editing, setEditing] = useState<(Omit<CatalogItem, 'id'> & { id?: string }) | null>(
    null,
  )

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params)
    next.set('tab', t)
    setParams(next)
  }

  const items = useMemo(() => {
    return catalog
      .filter((c) => c.kind === tab)
      .filter((c) => {
        if (!q.trim()) return true
        const hay = `${c.name} ${c.category} ${c.tags.join(' ')}`.toLowerCase()
        return hay.includes(q.trim().toLowerCase())
      })
  }, [catalog, tab, q])

  const categories = useMemo(
    () => [...new Set(catalog.filter((c) => c.kind === tab).map((c) => c.category))].sort(),
    [catalog, tab],
  )

  return (
    <div>
      <PageHeader
        title="Каталог"
        subtitle="Страви, послуги та інгредієнти для кошторисів"
        actions={
          <Button variant="primary" onClick={() => setEditing(emptyForm(tab))}>
            + Додати
          </Button>
        }
      />

      <div className="tabs">
        {(['product', 'service', 'ingredient'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {KIND_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="filters">
        <Field
          placeholder="Пошук…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Категорія</th>
                <th>Од.</th>
                {tab !== 'ingredient' ? <th>Ціна</th> : null}
                <th>Собів.</th>
                <th>Теги</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        {item.description}
                      </div>
                    ) : null}
                  </td>
                  <td>{item.category}</td>
                  <td>{item.unit}</td>
                  {tab !== 'ingredient' ? <td>{money(item.price)}</td> : null}
                  <td>{money(item.cost)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {item.tags.map((t) => (
                        <span key={t} className="badge" style={{ borderRadius: 8 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{item.active ? 'Активний' : 'Вимкнено'}</td>
                  <td>
                    <div className="btn-row">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(item)}>
                        Ред.
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Видалити «${item.name}»?`)) remove(item.id)
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">Порожньо</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <Modal
          title={editing.id ? 'Редагувати позицію' : 'Нова позиція'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Скасувати</Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!editing.name.trim()) return
                  upsert({
                    ...editing,
                    name: editing.name.trim(),
                    category: editing.category || 'Інше',
                    tags: editing.tags || [],
                  })
                  setEditing(null)
                }}
              >
                Зберегти
              </Button>
            </>
          }
        >
          <div className="grid-2">
            <Label label="Назва">
              <Field
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                autoFocus
              />
            </Label>
            <Label label="Тип">
              <Select
                value={editing.kind}
                onChange={(e) =>
                  setEditing({ ...editing, kind: e.target.value as CatalogKind })
                }
              >
                <option value="product">Страва</option>
                <option value="service">Послуга</option>
                <option value="ingredient">Інгредієнт</option>
              </Select>
            </Label>
            <Label label="Категорія">
              <Field
                list="cat-categories"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              />
              <datalist id="cat-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Label>
            <Label label="Одиниця">
              <Field
                value={editing.unit}
                onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
              />
            </Label>
            <Label label="Ціна продажу">
              <Field
                type="number"
                min={0}
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: Number(e.target.value) || 0 })
                }
              />
            </Label>
            <Label label="Собівартість">
              <Field
                type="number"
                min={0}
                value={editing.cost}
                onChange={(e) =>
                  setEditing({ ...editing, cost: Number(e.target.value) || 0 })
                }
              />
            </Label>
          </div>
          <Label label="Теги (через кому)">
            <Field
              value={(editing.tags || []).join(', ')}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </Label>
          <Label label="Опис">
            <Textarea
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </Label>
          <Label label="Статус">
            <Select
              value={editing.active ? '1' : '0'}
              onChange={(e) => setEditing({ ...editing, active: e.target.value === '1' })}
            >
              <option value="1">Активний</option>
              <option value="0">Вимкнено</option>
            </Select>
          </Label>
        </Modal>
      ) : null}
    </div>
  )
}
