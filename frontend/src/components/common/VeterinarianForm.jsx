import { useState } from 'react'

import Alert from '../common/Alert'
import Button from '../common/Button'
import Input from './Input'
import { pickFields } from './formUtils'

const EDITABLE = ['first_name', 'last_name', 'license_number', 'specialty', 'phone', 'email', 'is_active']

const EMPTY = {
  first_name: '',
  last_name: '',
  license_number: '',
  specialty: '',
  phone: '',
  email: '',
  is_active: true,
}

/** Formulario de veterinario. Sirve para crear y para editar. */
export default function VeterinarianForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    pickFields(initialData, EDITABLE, { ...EMPTY, is_active: initialData?.is_active ?? true }),
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(initialData?.id)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        license_number: form.license_number.trim(),
        is_active: form.is_active,
        specialty: form.specialty.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      }

      await onSubmit(payload)
    } catch (err) {
      setError(err.message || 'No fue posible guardar el veterinario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      <div className="form-section">
        <p className="form-section-title">Datos profesionales</p>

        <div className="form-grid">
          <Input
            label="Nombres"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="Laura"
            maxLength={80}
            required
          />

          <Input
            label="Apellidos"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Gómez"
            maxLength={80}
            required
          />

          <Input
            label="Matrícula profesional"
            name="license_number"
            value={form.license_number}
            onChange={handleChange}
            placeholder="VET-10245"
            maxLength={50}
            hint="Debe ser única"
            required
          />

          <Input
            label="Especialidad"
            name="specialty"
            value={form.specialty}
            onChange={handleChange}
            placeholder="Medicina general"
            maxLength={100}
          />

          <Input
            label="Teléfono"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+57 315 444 7788"
            maxLength={30}
          />

          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="laura.gomez@vetcare.com"
            maxLength={150}
          />

          <label className="checkbox-field" style={{ alignSelf: 'end', paddingBottom: 12 }}>
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            Veterinario activo
          </label>
        </div>
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Guardar cambios' : 'Registrar veterinario'}
        </Button>
      </div>
    </form>
  )
}