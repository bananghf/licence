import { useState } from 'react'
import { useCrmStore } from '../store/useCrmStore'
import { Button, Field, Label, PageHeader, Select } from '../components/ui'

export function SettingsPage() {
  const settings = useCrmStore((s) => s.settings)
  const updateSettings = useCrmStore((s) => s.updateSettings)
  const addManager = useCrmStore((s) => s.addManager)
  const removeManager = useCrmStore((s) => s.removeManager)
  const resetDemo = useCrmStore((s) => s.resetDemo)
  const [managerName, setManagerName] = useState('')
  const [saved, setSaved] = useState(false)

  const flash = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div>
      <PageHeader
        title="Налаштування"
        subtitle="Бренд панелі, менеджери та демо-дані"
        actions={
          saved ? <span className="badge" style={{ color: 'var(--ok)' }}>Збережено</span> : null
        }
      />

      <div className="split">
        <div className="panel panel-pad">
          <div className="section-title">Компанія</div>
          <div className="grid-2">
            <Label label="Назва компанії">
              <Field
                value={settings.companyName}
                onChange={(e) => {
                  updateSettings({ companyName: e.target.value })
                  flash()
                }}
              />
            </Label>
            <Label label="Логотекст (бренд CRM)">
              <Field
                value={settings.logoText}
                onChange={(e) => {
                  updateSettings({ logoText: e.target.value })
                  flash()
                }}
              />
            </Label>
            <Label label="Валюта">
              <Field
                value={settings.currency}
                onChange={(e) => {
                  updateSettings({ currency: e.target.value })
                  flash()
                }}
              />
            </Label>
            <Label label="Часовий пояс">
              <Select
                value={settings.timezone}
                onChange={(e) => {
                  updateSettings({ timezone: e.target.value })
                  flash()
                }}
              >
                <option value="Europe/Kyiv">Europe/Kyiv</option>
                <option value="Europe/Warsaw">Europe/Warsaw</option>
                <option value="UTC">UTC</option>
              </Select>
            </Label>
          </div>

          <div className="section-title" style={{ marginTop: 18 }}>
            Типи сервісу
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {settings.serviceTypes.map((s) => (
              <span key={s.id} className="badge">
                {s.label}
              </span>
            ))}
          </div>

          <div className="section-title" style={{ marginTop: 18 }}>
            Статуси замовлень
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {settings.orderStatuses.map((s) => (
              <span key={s.id} className="badge" style={{ color: s.color }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="section-title">Менеджери</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {settings.managers.map((m) => (
              <div
                key={m}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                }}
              >
                <span>{m}</span>
                <Button size="sm" variant="ghost" onClick={() => removeManager(m)}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <Field
              placeholder="Імʼя менеджера"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
            />
            <Button
              variant="primary"
              onClick={() => {
                addManager(managerName)
                setManagerName('')
                flash()
              }}
            >
              Додати
            </Button>
          </div>

          <div className="section-title" style={{ marginTop: 22 }}>
            Дані
          </div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
            Усі дані зберігаються в localStorage браузера (ключ shastya-crm-v1). Можна
            скинути до демо «Щастя».
          </p>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Скинути всі дані до демо-набору?')) {
                resetDemo()
                flash()
              }
            }}
          >
            Скинути демо-дані
          </Button>
        </div>
      </div>
    </div>
  )
}
