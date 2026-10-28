import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  HeartPulse,
  Pencil,
  Phone,
  Plus,
  Stethoscope,
  UserRound,
} from 'lucide-react'

import api from '../services/api'
import useApiResource from '../hooks/useApiResource'
import Button, { IconButton } from '../components/common/Button'
import Modal from '../components/common/Modal'
import PetAvatar from '../components/pets/PetAvatar'
import PetForm from '../components/pets/PetForm'
import SuccessToast from '../components/common/Toast'
import { StatusBadge } from '../components/common/Badge'
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '../components/common/LoadingSpinner'
import {
  SEX_LABELS,
  formatAge,
  formatDate,
  formatNumber,
  formatTimeOnly,
} from '../services/formatters'

/** Etiqueta: valor de una fila de la ficha. */
function Detail({ label, children }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children}</div>
    </div>
  )
}

/** Bloque de texto largo (síntomas, diagnóstico, tratamiento). */
function TextBlock({ label, value }) {
  return (
    <div>
      <p className="form-section-title" style={{ marginBottom: 'var(--space-2)' }}>
        {label}
      </p>
      <div className={`text-block ${value ? '' : 'text-block-empty'}`}>
        {value || 'Sin registro'}
      </div>
    </div>
  )
}

export default function PetDetail() {
  const { id } = useParams()

  const [editOpen, setEditOpen] = useState(false)
  const [recordOpen, setRecordOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [savingRecord, setSavingRecord] = useState(false)
  const [vetOptions, setVetOptions] = useState([])

  const {
    data: pet,
    loading,
    error,
    reload,
    setData: setPet,
  } = useApiResource(() => api.get(`/pets/${id}`), [id])

  const {
    data: records,
    loading: recordsLoading,
    setData: setRecords,
  } = useApiResource(() => api.get(`/pets/${id}/medical-records`), [id])

  const { data: appointments } = useApiResource(
    () => api.get('/appointments', { pet_id: id }),
    [id],
  )

  if (loading) return <LoadingSpinner message="Cargando ficha de la mascota..." />
  if (error) return <ErrorState description={error} onRetry={reload} />

  const handlePetUpdate = async (payload) => {
    const updated = await api.put(`/pets/${id}`, payload)
    setPet(updated)
    setEditOpen(false)
    setToast('Mascota actualizada correctamente.')
  }

  /**
   * Registrar una historia clínica desde la ficha de la mascota.
   */
  const handleCreateRecord = async (form) => {
    setSavingRecord(true)

    try {
      const payload = {
        pet_id: Number(id),
        veterinarian_id: Number(form.veterinarian_id),
        symptoms: form.symptoms || null,
        diagnosis: form.diagnosis || null,
        treatment: form.treatment || null,
        observations: form.observations || null,
        weight: form.weight ? Number(form.weight) : null,
      }

      const created = await api.post('/medical-records', payload)
      setRecords((current) => [created, ...(current || [])])
      setRecordOpen(false)
      setToast('Historia clínica registrada correctamente.')
    } catch (err) {
      setToast(err.message)
    } finally {
      setSavingRecord(false)
    }
  }

  // Los veterinarios activos se piden sólo cuando se abre el modal.
  const openRecordModal = async () => {
    try {
      const vets = await api.get('/veterinarians', { only_active: true })
      setVetOptions(vets)
      setRecordOpen(true)
    } catch (err) {
      setToast(err.message)
    }
  }

  const upcomingAppointments = (appointments || []).filter((item) =>
    ['scheduled', 'confirmed'].includes(item.status),
  )

  return (
    <>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/pets" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          <ArrowLeft size={14} strokeWidth={2} />
          Volver a mascotas
        </Link>
      </div>

      <div className="page-header">
        <div className="row" style={{ gap: 'var(--space-4)' }}>
          <PetAvatar species={pet.species} size="lg" />
          <div>
            <h1 className="page-title">{pet.name}</h1>
            <p className="page-subtitle">
              {[pet.breed, pet.species, pet.sex && SEX_LABELS[pet.sex]]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <div className="page-actions">
          <Button icon={Pencil} variant="secondary" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
          <Button icon={Plus} onClick={openRecordModal}>
            Nueva historia clínica
          </Button>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Ficha general */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Información general</h2>
          </div>
          <div className="card-body">
            <div className="detail-grid">
              <Detail label="Especie">{pet.species}</Detail>
              <Detail label="Raza">{pet.breed || '—'}</Detail>
              <Detail label="Sexo">{pet.sex ? SEX_LABELS[pet.sex] : '—'}</Detail>
              <Detail label="Color">{pet.color || '—'}</Detail>
              <Detail label="Fecha de nacimiento">
                {pet.birth_date ? formatDate(pet.birth_date) : '—'}
              </Detail>
              <Detail label="Edad">{formatAge(pet.age_months)}</Detail>
              <Detail label="Peso">
                {pet.weight ? `${formatNumber(pet.weight)} kg` : '—'}
              </Detail>
              <Detail label="Registrado">{formatDate(pet.created_at)}</Detail>
              {pet.notes && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label">Notas</div>
                  <div className="text-block" style={{ marginTop: 'var(--space-2)' }}>
                    {pet.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Propietario */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Propietario</h2>
            <Link to="/owners">
              <IconButton icon={Pencil} label="Ir a propietarios" />
            </Link>
          </div>
          <div className="card-body">
            {pet.owner ? (
              <div className="stack" style={{ gap: 'var(--space-4)' }}>
                <div className="row" style={{ gap: 'var(--space-3)' }}>
                  <span className="avatar" style={{ width: 40, height: 40 }}>
                    <UserRound size={18} strokeWidth={2} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{pet.owner.full_name}</div>
                    <div className="text-sm text-secondary">Propietario registrado</div>
                  </div>
                </div>

                <div className="detail-grid">
                  <Detail label="Teléfono">
                    <span className="row" style={{ gap: 'var(--space-1)' }}>
                      <Phone size={13} strokeWidth={2} className="text-muted" />
                      {pet.owner.phone || '—'}
                    </span>
                  </Detail>
                  <Detail label="Correo">{pet.owner.email || '—'}</Detail>
                </div>
              </div>
            ) : (
              <p className="text-muted">Sin propietario asociado.</p>
            )}
          </div>
        </section>
      </div>

      {/* Próximas citas */}
      <section className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h2 className="card-title">Próximas citas</h2>
          <span className="text-sm text-muted">{upcomingAppointments.length} agendada(s)</span>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <CalendarDays size={22} strokeWidth={1.75} className="text-muted" />
            <p className="empty-title" style={{ marginTop: 'var(--space-3)' }}>
              No hay citas pendientes
            </p>
          </div>
        ) : (
          <div>
            {upcomingAppointments.map((appointment) => (
              <div className="list-row" key={appointment.id}>
                <span className="stat-icon primary" style={{ width: 38, height: 38 }}>
                  <CalendarDays size={17} strokeWidth={2} />
                </span>
                <div className="list-row-main">
                  <div className="list-row-title">
                    {formatDate(appointment.appointment_date)} ·{' '}
                    {formatTimeOnly(appointment.appointment_time)}
                  </div>
                  <div className="list-row-meta">
                    {appointment.service.name} · Dr. {appointment.veterinarian.full_name}
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

      {/* Historial médico */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Historial médico</h2>
          <span className="text-sm text-muted">
            {(records || []).length} consulta(s) registrada(s)
          </span>
        </div>

        {recordsLoading ? (
          <LoadingSpinner message="Cargando historial médico..." />
        ) : (records || []).length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <HeartPulse size={22} strokeWidth={1.75} className="text-muted" />
            <p className="empty-title" style={{ marginTop: 'var(--space-3)' }}>
              Sin historial médico
            </p>
            <p className="empty-description">
              Registra la primera consulta de {pet.name}.
            </p>
          </div>
        ) : (
          <div className="card-body" style={{ display: 'grid', gap: 'var(--space-5)' }}>
            {records.map((record) => (
              <article
                key={record.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                }}
              >
                <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
                  <div className="row" style={{ gap: 'var(--space-3)' }}>
                    <span className="stat-icon primary" style={{ width: 34, height: 34 }}>
                      <Stethoscope size={16} strokeWidth={2} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{formatDate(record.consultation_date)}</div>
                      <div className="text-sm text-secondary">
                        Dr. {record.veterinarian.full_name}
                        {record.veterinarian.specialty && ` · ${record.veterinarian.specialty}`}
                      </div>
                    </div>
                  </div>

                  {record.weight && (
                    <span className="badge badge-neutral">{formatNumber(record.weight)} kg</span>
                  )}
                </div>

                <div className="stack" style={{ gap: 'var(--space-4)' }}>
                  <TextBlock label="Síntomas" value={record.symptoms} />
                  <TextBlock label="Diagnóstico" value={record.diagnosis} />
                  <TextBlock label="Tratamiento" value={record.treatment} />
                  <TextBlock label="Observaciones" value={record.observations} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Editar mascota */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar mascota"
        description={`Actualiza los datos de ${pet.name}.`}
      >
        {editOpen && (
          <PetForm
            initialData={pet}
            owners={pet.owner ? [pet.owner] : []}
            onSubmit={handlePetUpdate}
            onCancel={() => setEditOpen(false)}
          />
        )}
      </Modal>

      {/* Registrar historia clínica */}
      <RecordModal
        open={recordOpen}
        veterinarians={vetOptions}
        saving={savingRecord}
        defaultWeight={pet.weight}
        onSubmit={handleCreateRecord}
        onClose={() => setRecordOpen(false)}
      />

      <SuccessToast message={toast} onClose={() => setToast('')} />
    </>
  )
}

/** Modal simple para registrar una consulta en el historial de la mascota. */
function RecordModal({ open, veterinarians, defaultWeight, saving, onSubmit, onClose }) {
  const [form, setForm] = useState({
    veterinarian_id: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    observations: '',
    weight: defaultWeight ? String(defaultWeight) : '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Nueva historia clínica"
      description="Registra la consulta de la mascota."
    >
      {open && (
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor="veterinarian_id">
                Veterinario<span className="required">*</span>
              </label>
              <select
                id="veterinarian_id"
                name="veterinarian_id"
                className="select"
                value={form.veterinarian_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona el veterinario</option>
                {veterinarians.map((vet) => (
                  <option key={vet.id} value={vet.id}>
                    Dr. {vet.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="record-weight">
                Peso (kg)
              </label>
              <input
                id="record-weight"
                name="weight"
                type="number"
                className="input"
                value={form.weight}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            {[
              { name: 'symptoms', label: 'Síntomas' },
              { name: 'diagnosis', label: 'Diagnóstico' },
              { name: 'treatment', label: 'Tratamiento' },
              { name: 'observations', label: 'Observaciones' },
            ].map((field) => (
              <div className="form-field full" key={field.name}>
                <label className="form-label" htmlFor={field.name}>
                  {field.label}
                </label>
                <textarea
                  id={field.name}
                  name={field.name}
                  className="textarea"
                  rows={2}
                  value={form[field.name]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>

          <div className="form-actions">
            <Button variant="secondary" onClick={onClose} disabled={Boolean(saving)}>
              Cancelar
            </Button>
            <Button type="submit" loading={Boolean(saving)}>
              Registrar consulta
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}