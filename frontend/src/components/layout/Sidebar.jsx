import { NavLink, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Syringe,
  Users,
  PawPrint,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../services/formatters'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/owners', label: 'Propietarios', icon: Users },
  { to: '/pets', label: 'Mascotas', icon: PawPrint },
  { to: '/appointments', label: 'Citas', icon: CalendarDays },
]

const CATALOG_ITEMS = [
  { to: '/veterinarians', label: 'Veterinarios', icon: Stethoscope },
  { to: '/services', label: 'Servicios', icon: Syringe },
  { to: '/medical-records', label: 'Historias clínicas', icon: HeartPulse },
]

/** Iniciales del usuario para el avatar. */
function getInitials(fullName = '') {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const renderItem = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
      <item.icon size={17} strokeWidth={2} />
      <span>{item.label}</span>
    </NavLink>
  )

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-logo">
          <PawPrint size={19} strokeWidth={2.25} />
        </span>
        <span className="sidebar-title">VetCare</span>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section">Clínica</p>
        {NAV_ITEMS.map(renderItem)}

        <p className="nav-section" style={{ marginTop: 'var(--space-5)' }}>
          Catálogo
        </p>
        {CATALOG_ITEMS.map(renderItem)}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="avatar">{getInitials(user?.full_name)}</span>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.full_name}</div>
            <div className="sidebar-user-role">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
        </div>

        <button type="button" className="logout-button" onClick={handleLogout}>
          <LogOut size={17} strokeWidth={2} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}