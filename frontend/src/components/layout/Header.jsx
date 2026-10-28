import { Menu } from 'lucide-react'

import { formatLongDate } from '../../services/formatters'

/** Barra superior: botón de menú en móvil y fecha actual. */
export default function Header({ onMenuClick, title }) {
  return (
    <header className="app-header">
      <button type="button" className="menu-toggle" onClick={onMenuClick} aria-label="Abrir menú">
        <Menu size={20} strokeWidth={2} />
      </button>

      <span className="header-title">{title}</span>

      <span className="spacer" />

      <span className="header-date">{formatLongDate(new Date())}</span>
    </header>
  )
}