import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  PawPrint,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react'

import api from '../services/api'
import useApiResource from '../hooks/useApiResource'
import { ErrorState, LoadingSpinner } from '../components/common/LoadingSpinner'
import { StatusBadge } from '../components/common/Badge'
import Button from '../components/common/Button'
import {
  STATUS_LABELS,
  formatDate,
  formatNumber,
  formatTimeOnly,
  formatWeekday,
} from '../services/formatters'

/** Tarjeta de métrica del dashboard. */
function StatCard({ icon: Icon, tone, label, value, meta }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon ${tone}`}>
        <Icon size={19} strokeWidth={2} />
      </span>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {meta && <div className="stat-meta">{meta}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data, loading, error, reload } = useApiResource(() => api.get('/dashboard'), [])

  if (loading) return <LoadingSpinner message="Cargando resumen de la clínica..." />
  if (error) {
    return <ErrorState description={error} onRetry={reload} />
  }

  const totals = data.totals
  const distribution = data.appointments_by_status
  const maxStatus = Math.max(...distribution.map((item) => item.total), 1)

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resumen de la clínica</h1>
          <p className="page-subtitle">
            Una mirada rápida a la actividad de VetCare hoy.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/appointments">
            <Button icon={CalendarPlus}>Agendar cita</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          icon={PawPrint}
          tone="primary"
          label="Mascotas registradas"
          value={formatNumber(totals.pets_count)}
          meta={`${totals.new_pets_this_month} nuevas este mes`}
        />
        <StatCard
          icon={Users}
          tone="secondary"
          label="Propietarios"
          value={formatNumber(totals.owners_count)}
          meta="Tutores registrados"
        />
        <StatCard
          icon={CalendarDays}
          tone="info"
          label="Citas de hoy"
          value={formatNumber(totals.appointments_today)}
          meta="Sin contar canceladas"
        />
        <StatCard
          icon={Stethoscope}
          tone="success"
          label="Veterinarios activos"
          value={formatNumber(totals.active_veterinarians)}
          meta={`${totals.active_services} servicios disponibles`}
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Próximas citas */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Próximas citas</h2>
            <Link to="/appointments" className="btn btn-ghost btn-sm">
              Ver todas
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          {data.upcoming_appointments.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <CalendarCheck size={22} strokeWidth={1.75} className="text-muted" />
              <p className="empty-title" style={{ marginTop: 'var(--space-3)' }}>
                No hay citas próximas
              </p>
            </div>
          ) : (
            <div>
              {data.upcoming_appointments.map((appointment) => (
                <div className="list-row" key={appointment.id}>
                  <div
                    className="stat-icon primary"
                    style={{ width: 38, height: 38, flexDirection: 'column', gap: 0 }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>
                      {formatWeekday(appointment.appointment_date)}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.75, lineHeight: 1 }}>
                      {formatDate(appointment.appointment_date).split(' ')[0]}
                    </span>
                  </div>

                  <div className="list-row-main">
                    <div className="list-row-title">
                      {appointment.pet_name} · {formatTimeOnly(appointment.appointment_time)}
                    </div>
                    <div className="list-row-meta">
                      {appointment.service_name} · Dr. {appointment.vet_full_name}
                    </div>
                  </div>

                  <div className="list-row-side">
                    <StatusBadge status={appointment.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Distribución por estado */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Citas por estado</h2>
            <span className="text-sm text-muted">Últimos 30 días</span>
          </div>

          <div className="card-body">
            <div className="distribution-list">
              {distribution.map((item) => (
                <div className="distribution-item" key={item.status}>
                  <div className="distribution-header">
                    <span>{STATUS_LABELS[item.status]}</span>
                    <span className="text-secondary">{item.total}</span>
                  </div>
                  <div className="distribution-bar">
                    <div
                      className={`distribution-fill ${item.status}`}
                      style={{ width: `${Math.round((item.total / maxStatus) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Actividad reciente */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Actividad reciente</h2>
          <span className="text-sm text-muted">Citas creadas en los últimos 30 días</span>
        </div>

        {data.recent_activity.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <TrendingUp size={22} strokeWidth={1.75} className="text-muted" />
            <p className="empty-title" style={{ marginTop: 'var(--space-3)' }}>
              Aún no hay actividad registrada
            </p>
          </div>
        ) : (
          <div className="card-body card-body-flush">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Propietario</th>
                    <th>Fecha de la cita</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_activity.map((item) => (
                    <tr key={item.id}>
                      <td className="table-cell-title">{item.pet_name}</td>
                      <td className="text-secondary">{item.owner_full_name}</td>
                      <td className="text-secondary text-nowrap">{formatDate(item.appointment_date)}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  )
}