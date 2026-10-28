import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, ClipboardList, HeartPulse, PawPrint } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import Alert from '../components/common/Alert'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

const FEATURES = [
  { icon: PawPrint, text: 'Mascotas y propietarios centralizados' },
  { icon: CalendarDays, text: 'Agenda de citas sin conflictos de horario' },
  { icon: ClipboardList, text: 'Historial clínico por mascota' },
  { icon: HeartPulse, text: 'Resumen al instante de la clínica' },
]

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Si ya hay sesión activa, no mostramos el login.
  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(email.trim(), password)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message || 'No fue posible iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <aside className="login-aside">
        <div className="login-brand">
          <span className="login-brand-mark">
            <PawPrint size={22} strokeWidth={2.25} />
          </span>
          <span className="login-brand-name">VetCare</span>
        </div>

        <h1 className="login-aside-title">La clínica organizada, mascota por mascota.</h1>
        <p className="login-aside-text">
          Un solo lugar para gestionar propietarios, agenda, veterinarios e historial clínico.
        </p>

        <div className="login-features">
          {FEATURES.map((feature) => (
            <div className="login-feature" key={feature.text}>
              <span className="login-feature-icon">
                <feature.icon size={15} strokeWidth={2} />
              </span>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="login-main">
        <div className="login-form-container">
          <h2 className="login-title">Iniciar sesión</h2>
          <p className="login-subtitle">Ingresa con tu cuenta de la clínica.</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <Alert variant="danger">{error}</Alert>
              </div>
            )}

            <Input
              label="Correo electrónico"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@vetcare.com"
              autoComplete="email"
              required
            />

            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="btn-block"
              style={{ marginTop: 'var(--space-2)' }}
            >
              Iniciar sesión
              {!submitting && <ArrowRight size={16} strokeWidth={2} />}
            </Button>
          </form>

          <div className="login-hint">
            <strong>Acceso de demostración</strong>
            <br />
            <code>admin@vetcare.com</code> · <code>admin123</code>
          </div>
        </div>
      </main>
    </div>
  )
}