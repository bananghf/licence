import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCrmStore } from '../store/useCrmStore'
import { KIND_LABELS } from '../lib/labels'
import { Field } from './ui'

type Hit = {
  id: string
  group: string
  title: string
  subtitle: string
  to: string
}

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const orders = useCrmStore((s) => s.orders)
  const catalog = useCrmStore((s) => s.catalog)
  const contacts = useCrmStore((s) => s.contacts)
  const companies = useCrmStore((s) => s.companies)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  const hits = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return [] as Hit[]
    const out: Hit[] = []

    for (const o of orders) {
      const hay = `${o.number} ${o.title} ${o.address} ${o.manager}`.toLowerCase()
      if (hay.includes(query)) {
        out.push({
          id: o.id,
          group: 'Замовлення',
          title: `${o.number} · ${o.title}`,
          subtitle: o.address || o.manager,
          to: `/orders/${o.id}`,
        })
      }
    }

    for (const c of catalog) {
      const hay = `${c.name} ${c.category} ${c.tags.join(' ')}`.toLowerCase()
      if (hay.includes(query)) {
        out.push({
          id: c.id,
          group: 'Каталог',
          title: c.name,
          subtitle: `${KIND_LABELS[c.kind]} · ${c.category}`,
          to: `/catalog?q=${encodeURIComponent(c.name)}`,
        })
      }
    }

    for (const c of contacts) {
      const hay = `${c.name} ${c.phone || ''} ${c.email || ''}`.toLowerCase()
      if (hay.includes(query)) {
        out.push({
          id: c.id,
          group: 'Контакти',
          title: c.name,
          subtitle: c.phone || c.email || '',
          to: `/clients?tab=contacts&q=${encodeURIComponent(c.name)}`,
        })
      }
    }

    for (const c of companies) {
      const hay = `${c.name} ${c.phone || ''} ${c.email || ''}`.toLowerCase()
      if (hay.includes(query)) {
        out.push({
          id: c.id,
          group: 'Компанії',
          title: c.name,
          subtitle: c.phone || c.email || '',
          to: `/clients?tab=companies&q=${encodeURIComponent(c.name)}`,
        })
      }
    }

    return out.slice(0, 20)
  }, [q, orders, catalog, contacts, companies])

  useEffect(() => setActive(0), [q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, Math.max(hits.length - 1, 0)))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      }
      if (e.key === 'Enter' && hits[active]) {
        navigate(hits[active].to)
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hits, active, navigate, onClose])

  return (
    <div className="modal-backdrop search-modal" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(640px, 100%)' }}>
        <div className="modal-body" style={{ paddingBottom: 10 }}>
          <Field
            autoFocus
            placeholder="Пошук… замовлення, страви, клієнти"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div style={{ maxHeight: 420, overflow: 'auto', marginTop: 8 }}>
            {!q.trim() ? (
              <div className="empty">Почніть вводити запит</div>
            ) : hits.length === 0 ? (
              <div className="empty">Нічого не знайдено</div>
            ) : (
              hits.map((hit, i) => (
                <button
                  key={`${hit.group}-${hit.id}`}
                  type="button"
                  className={`result${i === active ? ' active' : ''}`}
                  style={{ width: '100%', border: 0, background: i === active ? 'var(--brand-soft)' : 'transparent', textAlign: 'left' }}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    navigate(hit.to)
                    onClose()
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{hit.title}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{hit.subtitle}</div>
                  </div>
                  <div className="meta">{hit.group}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
