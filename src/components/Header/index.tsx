import { Bell, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { managerPages } from '../../routes/managerPages'
import { useSessionIdentity } from '../../hooks/useSessionIdentity'
import './styles.css'
import '../../styles/accessible-names.css'

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

function Header() {
  const { email, initials } = useSessionIdentity()
  const { pathname } = useLocation()
  const currentPage = managerPages.find(({ path }) => path === pathname)
  const [query, setQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const notificationButtonRef = useRef<HTMLButtonElement>(null)
  const searchTerm = normalize(query.trim())
  const results = managerPages.filter(({ title }) => normalize(title).includes(searchTerm))

  useEffect(() => {
    if (!notificationsOpen) return

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
        notificationButtonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [notificationsOpen])

  return (
    <header className="manager-header">
      <nav className="manager-header__breadcrumb" aria-label="Localização">
        <ol>
          <li><Link to="/dashboard">Área de gestão</Link></li>
          <li aria-current="page">{currentPage?.title}</li>
        </ol>
      </nav>

      <div className="manager-header__tools">
        <div
          className="manager-header__search"
          role="search"
          aria-label="Páginas do KAIROS"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setQuery('')
          }}
        >
          <label className="manager-header__search-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar páginas no KAIROS"
              placeholder="Buscar páginas no KAIROS"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setQuery('')
              }}
              aria-controls={searchTerm ? 'header-search-results' : undefined}
            />
          </label>
          {searchTerm && (
            <div className="manager-header__panel" id="header-search-results">
              <p className="manager-header__result-count" role="status">
                {results.length ? `${results.length} página(s) encontrada(s)` : 'Nenhuma página encontrada.'}
              </p>
              <ul>
                {results.map(({ path, title }) => (
                  <li key={path}>
                    <Link to={path} onClick={() => setQuery('')}>{title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="manager-header__notifications" ref={notificationsRef}>
          <button
            className="manager-header__notification-button"
            type="button"
            aria-label="Notificações"
            aria-expanded={notificationsOpen}
            aria-controls="header-notifications"
            onClick={() => setNotificationsOpen((open) => !open)}
            ref={notificationButtonRef}
          >
            <Bell size={20} aria-hidden="true" />
          </button>
          {notificationsOpen && (
            <section className="manager-header__panel" id="header-notifications" aria-label="Notificações">
              <h2>Notificações</h2>
              <p>As notificações ainda não estão disponíveis.</p>
            </section>
          )}
        </div>

        <Link className="manager-header__profile" to="/perfil">
          <span className="a11y-hidden-label">Meu perfil:</span>{' '}
          <span className="manager-header__avatar" aria-hidden="true">{initials}</span>
          <span className="manager-header__profile-details">
            <strong title={email}>{email}</strong>{' '}
            <small>Gerente</small>
          </span>
        </Link>
      </div>
    </header>
  )
}

export default Header
