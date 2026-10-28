import { useState } from 'react'

import Alert from '../common/Alert'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'
import { formatCurrency, todayISO } from '../../services/formatters'

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
]

const EMPTY = {
  pet_id: '',
  veterinarian_id: '',
  service_id: '',
  appointment_date: todayISO(),
  appointment_time: '09:00',
  status: 'scheduled',
  reason: '',
  notes: '',
}

/** Formulario de cita: elige mascota, veterinario, servicio y horario. */
export default function AppointmentForm({
  initialData,
  pets,
  veterinarians,
  services,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...Object.fromEntries(
      Object.entries(initialData || {}).map(([key, value]) => [key, value ?? '']),
    ),
    pet_id: initialData?.pet?.id ?? '',
    veterinarian_id: initialData?.veterinarian?.id ?? '',
    service_id: initialData?.service?.id ?? '',
  }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(initialData?.id)

  const petOptions = pets.map((pet) => ({
    value: pet.id,
    label: `${pet.name} · ${pet.owner?.full_name || pet.species}`,
  }))

  const vetOptions = veterinarians.map((vet) => ({
    value: vet.id,
    label: `Dr. ${vet.full_name}${vet.specialty ? ` · ${vet.specialty}` : ''}`,
  }))

  const serviceOptions = services.map((service) => ({
    value: service.id,
    label: `${service.name} · ${formatCurrency(service.price)}`,
  }))

  const selectedService = services.find((service) => String(service.id) === String(form.service_id))

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        pet_id: Number(form.pet_id),
        veterinarian_id: Number(form.veterinarian_id),
        service_id: Number(form.service_id),
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        status: form.status,
        reason: form.reason.trim() || null,
        notes: form.notes.trim() || null,
      }

      await onSubmit(payload)
    } catch (err) {
      setError(err.message || 'No fue posible guardar la cita.')
    } finally {
      setSaving(false)
    }
  }

  const missingData =
    pets.length === 0 || veterinarians.length === 0 || services.length === 0

  if (missingData) {
    const missing = [
      pets.length === 0 && 'al menos una mascota',
      veterinarians.length === 0 && 'al menos un veterinario activo',
      services.length === 0 && 'al menos un servicio activo',
    ].filter(Boolean)

    return (
      <>
        <Alert variant="warning">
          Para agendar citas necesitas registrar {missing.join(', ')}.
        </Alert>
        <div className="form-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cerrar
          </Button>
        </div>
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      <div className="form-section">
        <p className="form-section-title">Datos de la cita</p>

        <div className="form-grid">
          <Select
            label="Mascota"
            name="pet_id"
            value={form.pet_id}
            onChange={handleChange}
            options={petOptions}
            placeholder="Selecciona la mascota"
            required
          />

          <Select
            label="Veterinario"
            name="veterinarian_id"
            value={form.veterinarian_id}
            onChange={handleChange}
            options={vetOptions}
            placeholder="Selecciona el veterinario"
            required
          />

          <Select
            label="Servicio"
            name="service_id"
            value={form.service_id}
            onChange={handleChange}
            options={serviceOptions}
            placeholder="Selecciona el servicio"
            hint={
              selectedService ? `Duración estimada: ${selectedService.duration_minutes} min` : undefined
            }
            required
          />

          <Select
            label="Estado"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={STATUS_OPTIONS}
            placeholder="Agendada"
          />

          <Input
            label="Fecha"
            type="date"
            name="appointment_date"
            value={form.appointment_date}
            onChange={handleChange}
            required
          />

          <Input
            label="Hora"
            type="time"
            name="appointment_time"
            value={form.appointment_time}
            onChange={handleChange}
            required
          />

          <div className="form-field full">
            <label className="form-label" htmlFor="reason">
              Motivo de la consulta
            </label>
            <textarea
              id="reason"
              name="reason"
              className="textarea"
              rows={2}
              value={form.reason}
              onChange={handleChange}
              placeholder="Control de rutina anual, vacunación, dificultad para respirar..."
            />
          </div>

          <div className="form-field full">
            <label className="form-label" htmlFor="appointment-notes">
              Notas
            </label>
            <textarea
              id="appointment-notes"
              name="notes"
              className="textarea"
              rows={2}
              value={form.notes}
              onChange={handleChange}
              placeholder="Indicaciones especiales para esta cita"
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Guardar cambios' : 'Agendar cita'}
        </Button>
      </div>
    </form>
  )
}