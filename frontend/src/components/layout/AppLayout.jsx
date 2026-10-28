import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import Header from './Header'
import Sidebar from './Sidebar'

const TITLES = {
  '/': 'Dashboard',
  '/owners': 'Propietarios',
  '/pets': 'Mascotas',
  '/appointments': 'Citas',
  '/veterinarians': 'Veterinarios',
  '/services': 'Servicios',
  '/medical-records': 'Historias clínicas',
}

/** Estructura general: sidebar + header + contenido de la ruta actual. */
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Al cambiar de ruta se cierra el drawer en móvil.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const title = TITLES[location.pathname] || 'VetCare'

  return (
    <div className="app-layout">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      <div className="app-main">
        <Header onMenuClick={() => setMenuOpen(true)} title={title} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}