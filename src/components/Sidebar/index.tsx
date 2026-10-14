import {
  ChartColumn,
  CircleHelp,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Map,
  Package,
  RefreshCw,
  Rows3,
  Settings,
  ShoppingCart,
  Store,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink } from 'react-router'
import logo from '../../assets/kairos-logo.svg'
import { managerPages } from '../../routes/managerPages'
import { useAuth } from '../../hooks/useAuth'
import { useSessionIdentity } from '../../hooks/useSessionIdentity'
import './styles.css'

type ManagerPath = (typeof managerPages)[number]['path']

const iconsByPath: Record<ManagerPath, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/mapa': Map,
  '/gondolas': Rows3,
  '/produtos': Package,
  '/reposicoes': RefreshCw,
  '/funcionarios': UsersRound,
  '/vendas-clientes': ShoppingCart,
  '/insights': ChartColumn,
  '/kairos-ia': Lightbulb,
  '/perfil': UserRound,
  '/configuracoes': Settings,
}

function Sidebar() {
  const { state, signOut } = useAuth()
  const { email, initials } = useSessionIdentity()
  return (
    <aside className="sidebar" aria-label="Menu do gerente">
      <div className="sidebar__top">
        <Link className="sidebar__brand" to="/dashboard" aria-label="KAIROS, ir para o Dashboard">
          <img className="sidebar__logo" src={logo} alt="" />
        </Link>

        <p className="sidebar__caption">Painel do gerente</p>

        <div className="sidebar__store" aria-label="Loja demonstrativa Mercado Aurora, Unidade Centro">
          <Store size={18} aria-hidden="true" />
          <span>
            <strong>Mercado Aurora</strong>
            <small>Unidade Centro</small>
          </span>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Navegação principal">
        {managerPages.map((page) => {
          const { path, title } = page
          const Icon = iconsByPath[path]

          return (
            <NavLink
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              end
              key={path}
              to={path}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{'navTitle' in page ? page.navTitle : title}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar__bottom">
        <p className="sidebar__help">
          <CircleHelp size={17} aria-hidden="true" />
          <span>Ajuda e suporte</span>
        </p>
        <Link className="sidebar__profile" to="/perfil">
          <span className="sidebar__avatar" aria-hidden="true">{initials}</span>
          <span>
            <strong title={email}>{email}</strong>
            <small>Gerente da loja</small>
          </span>
        </Link>
        <button type="button" className="sidebar__logout" disabled={state.signingOut} onClick={() => void signOut()}>
          <LogOut size={18} aria-hidden="true" />
          {state.signingOut ? 'Saindo…' : 'Sair da conta'}
        </button>
        {state.error && <p className="sidebar__error" role="alert">{state.error}</p>}
        <p className="sidebar__demo">Dados da loja demonstrativos</p>
      </div>
    </aside>
  )
}

export default Sidebar
