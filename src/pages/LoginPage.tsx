import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useCrmStore } from '../store/useCrmStore'
import { Button, Field, Label } from '../components/ui'

export function LoginPage() {
  const authUser = useCrmStore((s) => s.authUser)
  const loading = useCrmStore((s) => s.loading)
  const authError = useCrmStore((s) => s.authError)
  const login = useCrmStore((s) => s.login)
  const [email, setEmail] = useState('admin@shastya.local')
  const [password, setPassword] = useState('admin123')

  if (authUser) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await login(email.trim(), password)
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">Щ</div>
          <div>
            <strong>Щастя CRM</strong>
            <div className="muted" style={{ fontSize: 13 }}>
              Операційна панель кейтерингу
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, margin: '18px 0 6px' }}>Вхід</h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Дані на сервері (SQLite). Увійдіть, щоб відкрити панель.
        </p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <Label label="Email">
            <Field
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Label>
          <Label label="Пароль">
            <Field
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Label>
          {authError ? (
            <div className="badge" style={{ color: 'var(--danger)' }}>
              {authError}
            </div>
          ) : null}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Входимо…' : 'Увійти'}
          </Button>
        </form>

        <div
          className="panel panel-pad"
          style={{ marginTop: 18, background: 'var(--brand-soft)', padding: 12 }}
        >
          <div className="section-title" style={{ marginBottom: 6 }}>
            Демо-доступ
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55 }}>
            <div>
              <strong>admin@shastya.local</strong> / admin123 (адмін)
            </div>
            <div>
              <strong>manager@shastya.local</strong> / manager123 (менеджер)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
