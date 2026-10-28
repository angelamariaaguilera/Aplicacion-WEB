import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'

import api from '../services/api'
import useApiResource from '../hooks/useApiResource'
import Button, { IconButton } from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Modal from '../components/common/Modal'
import PetAvatar from '../components/pets/PetAvatar'
import SuccessToast from '../components/common/Toast'
import AppointmentForm from '../components/appointments/AppointmentForm'
import { StatusBadge } from '../components/common/Badge'
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '../components/common/LoadingSpinner'
import {
  STATUS_LABELS,
  formatCurrency,
  formatDate,
  formatTimeOnly,
  todayISO,
} from '../services/formatters'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export default function Appointments() {
  const [filters, setFilters] = useState({
    date: todayISO(),
    status: '',
    veterinarian_id: '',
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)

  const { data, loading, error, reload, setData } = useApiResource(
    () => api.get('/appointments', appliedFilters),
    [appliedFilters.date, appliedFilters.status, appliedFilters.veterinarian_id],
  )

  // Catálogos para los filtros y el formulario.
  const { data: veterinarians } = useApiResource(
    () => api.get('/veterinarians', { only_active: true }),
    [],
  )
  const { data: pets } = useApiResource(() => api.get('/pets'), [])
  const { data: services } = useApiResource(() => api.get('/services', { only_active: true }), [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState('')

  const appointments = data || []

  const applyFilters = (event) => {
    event.preventDefault()
    setAppliedFilters(filters)
  }

  const clearFilters = () => {
    const cleared = { date: '', status: '', veterinarian_id: '' }
    setFilters(cleared)
    setAppliedFilters(cleared)
  }

  const handleSubmit = async (payload) => {
    if (editing) {
      const updated = await api.put(`/appointments/${editing.id}`, payload)
      setData((current) =>
        (current || []).map((item) => (item.id === updated.id ? updated : item)),
      )
      setToast('Cita actualizada correctamente.')
    } else {
      await api.post('/appointments', payload)
      setToast('Cita agendada correctamente.')
    }

    setModalOpen(false)
    reload()
  }

  const handleStatusChange = async (appointment, status) => {
    try {
      const updated = await api.patch(`/appointments/${appointment.id}/status`, { status })
      setData((current) =>
        (current || []).map((item) => (item.id === updated.id ? updated : item)),
      )
      setToast(`Cita marcada como ${STATUS_LABELS[status].toLowerCase()}.`)
    } catch (err) {
      setToast(err.message)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)

    try {
      await api.delete(`/appointments/${deleting.id}`)
      setToast('Cita eliminada.')
      setDeleting(null)
      reload()
    } catch (err) {
      setToast(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Citas</h1>
          <p className="page-subtitle">
            {appointments.length > 0
              ? `${appointments.length} cita(s) en la agenda.`
              : 'Agenda y administra las citas de la clínica.'}
          </p>
        </div>
        <div className="page-actions">
          <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true) }}>
            Agendar cita
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <form className="filters-bar" onSubmit={applyFilters}>
        <div className="filter-field">
          <label htmlFor="filter-date">Fecha</label>
          <input
            id="filter-date"
            type="date"
            className="input"
            value={filters.date}
            onChange={(event) => setFilters((c) => ({ ...c, date: event.target.value }))}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="filter-status">Estado</label>
          <select
            id="filter-status"
            className="select"
            value={filters.status}
            onChange={(event) => setFilters((c) => ({ ...c, status: event.target.value }))}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="filter-vet">Veterinario</label>
          <select
            id="filter-vet"
            className="select"
            value={filters.veterinarian_id}
            onChange={(event) =>
              setFilters((c) => ({ ...c, veterinarian_id: event.target.value }))
            }
          >
            <option value="">Todos los veterinarios</option>
            {(veterinarians || []).map((vet) => (
              <option key={vet.id} value={vet.id}>
                Dr. {vet.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <Button type="submit" variant="secondary">
            Aplicar
          </Button>
          <Button type="button" variant="ghost" onClick={clearFilters}>
            Limpiar
          </Button>
        </div>
      </form>

      <section className="card">
        {loading ? (
          <LoadingSpinner message="Cargando citas..." />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No hay citas para mostrar."
            description={
              appliedFilters.date || appliedFilters.status || appliedFilters.veterinarian_id
                ? 'Prueba con otras fechas o quita los filtros aplicados.'
                : 'Agenda la primera cita de la clínica.'
            }
            action={
              <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true) }}>
                Agendar cita
              </Button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Mascota</th>
                  <th>Propietario</th>
                  <th>Veterinario</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="text-nowrap">
                      <div className="table-cell-title">
                        {formatTimeOnly(appointment.appointment_time)}
                      </div>
                      <div className="table-cell-sub">{formatDate(appointment.appointment_date)}</div>
                    </td>

                    <td>
                      <div className="table-cell-main">
                        <PetAvatar species={appointment.pet.species} />
                        <Link to={`/pets/${appointment.pet.id}`}>
                          <span className="table-cell-title">{appointment.pet.name}</span>
                        </Link>
                      </div>
                    </td>

                    <td className="text-secondary text-nowrap">{appointment.owner.full_name}</td>

                    <td className="text-secondary text-nowrap">
                      Dr. {appointment.veterinarian.full_name}
                    </td>

                    <td>
                      <div className="text-nowrap">{appointment.service.name}</div>
                      <div className="table-cell-sub">
                        {formatCurrency(appointment.service.price)}
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={appointment.status} />
                    </td>

                    <td className="col-actions">
                      <div className="table-actions">
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(appointment, 'confirmed')}
                          >
                            Confirmar
                          </Button>
                        )}

                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(appointment, 'completed')}
                          >
                            <CheckCircle2 size={14} strokeWidth={2} />
                            Atender
                          </Button>
                        )}

                        <IconButton
                          icon={Pencil}
                          label="Editar"
                          onClick={() => { setEditing(appointment); setModalOpen(true) }}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Eliminar"
                          variant="danger"
                          onClick={() => setDeleting(appointment)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        title={editing ? 'Editar cita' : 'Agendar cita'}
        description={
          editing
            ? 'Actualiza los datos de la cita.'
            : 'Elige mascota, veterinario, servicio y horario.'
        }
      >
        {modalOpen && (
          <AppointmentForm
            initialData={editing}
            pets={pets || []}
            veterinarians={veterinarians || []}
            services={services || []}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar cita"
        description={
          deleting
            ? `¿Eliminar la cita de ${deleting.pet.name} del ${formatDate(deleting.appointment_date)}?`
            : ''
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />

      <SuccessToast message={toast} onClose={() => setToast('')} />
    </>
  )
}