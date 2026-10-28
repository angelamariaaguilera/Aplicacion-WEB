import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import Appointments from './pages/Appointments'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import MedicalRecords from './pages/MedicalRecords'
import Owners from './pages/Owners'
import PetDetail from './pages/PetDetail'
import Pets from './pages/Pets'
import Services from './pages/Services'
import Veterinarians from './pages/Veterinarians'
import { LoadingSpinner } from './components/common/LoadingSpinner'

/** Protege las rutas privadas: sin sesión va al login. */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner message="Verificando sesión..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="owners" element={<Owners />} />
            <Route path="pets" element={<Pets />} />
            <Route path="pets/:id" element={<PetDetail />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="veterinarians" element={<Veterinarians />} />
            <Route path="services" element={<Services />} />
            <Route path="medical-records" element={<MedicalRecords />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}