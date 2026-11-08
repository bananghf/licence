import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCrmStore } from '../store/useCrmStore'
import { GlobalSearch } from './GlobalSearch'

const nav = [
  { to: '/', label: 'Огляд', icon: '◈', end: true },
  { to: '/orders', label: 'Замовлення', icon: '☰' },
  { to: '/calendar', label: 'Календар', icon: '▦' },
  { to: '/kitchen', label: 'Кухня', icon: '▣' },
  { to: '/catalog', label: 'Каталог', icon: '◎' },
  { to: '/clients', label: 'Клієнти', icon: '☺' },
  { to: '/purchases', label: 'Закупки', icon: '▤' },
  { to: '/warehouse', label: 'Склад', icon: '⬡' },
  { to: '/reports', label: 'Звіти', icon: '◫' },
  { to: '/settings', label: 'Налаштування', icon: '⚙' },
]

const mobileNav = [
  { to: '/', label: 'Огляд', icon: '◈', end: true },
  { to: '/orders', label: 'Замовл.', icon: '☰' },
  { to: '/calendar', label: 'Календ.', icon: '▦' },
  { to: '/catalog', label: 'Каталог', icon: '◎' },
  { to: '/clients', label: 'Клієнти', icon: '☺' },
]

export function Layout() {
  const settings = useCrmStore((s) => s.settings)
  const authUser = useCrmStore((s) => s.authUser)
  const logout = useCrmStore((s) => s.logout)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">Щ</div>
          <div className="brand-text">
            <strong>{settings.logoText}</strong>
            <span>{settings.companyName}</span>
          </div>
        </div>
        <nav className="nav-list">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-ico">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {authUser ? (
            <>
              {authUser.name} · {authUser.role}
              <br />
            </>
          ) : null}
          SQLite + API · Вінниця
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 8, width: '100%' }}
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            Вийти
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="search-trigger"
            onClick={() => setSearchOpen(true)}
          >
            <span>⌕</span>
            <span>Пошук замовлень, клієнтів, каталогу…</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const id = useCrmStore.getState().createOrder()
              navigate(`/orders/${id}`)
            }}
          >
            + Замовлення
          </button>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </div>

      <nav className="mobile-nav">
        {mobileNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <span className="ico">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {searchOpen ? <GlobalSearch onClose={() => setSearchOpen(false)} /> : null}
    </div>
  )
}
