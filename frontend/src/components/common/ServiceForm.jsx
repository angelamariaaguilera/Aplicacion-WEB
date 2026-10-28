import { useState } from 'react'

import Alert from '../common/Alert'
import Button from '../common/Button'
import Input from './Input'
import { pickFields } from './formUtils'

const EDITABLE = ['name', 'description', 'price', 'duration_minutes', 'is_active']

const EMPTY = {
  name: '',
  description: '',
  price: '',
  duration_minutes: 30,
  is_active: true,
}

/** Formulario de servicio de la clínica. */
export default function ServiceForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = pickFields(initialData, EDITABLE, {
      ...EMPTY,
      duration_minutes: initialData?.duration_minutes ?? 30,
      is_active: initialData?.is_active ?? true,
    })
    // La API devuelve el precio como Decimal serializado; se edita como texto.
    if (base.price !== '') base.price = String(base.price)
    return base
  })
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
        name: form.name.trim(),
        price: Number(form.price),
        duration_minutes: Number(form.duration_minutes),
        is_active: form.is_active,
        description: form.description.trim() || null,
      }

      await onSubmit(payload)
    } catch (err) {
      setError(err.message || 'No fue posible guardar el servicio.')
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
        <p className="form-section-title">Datos del servicio</p>

        <div className="form-grid">
          <Input
            label="Nombre del servicio"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Consulta general"
            maxLength={100}
            required
          />

          <Input
            label="Precio (COP)"
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="50000"
            min="1"
            step="0.01"
            hint="No puede ser negativo"
            required
          />

          <Input
            label="Duración (minutos)"
            type="number"
            name="duration_minutes"
            value={form.duration_minutes}
            onChange={handleChange}
            placeholder="30"
            min="1"
            max="1440"
            step="5"
            required
          />

          <label className="checkbox-field" style={{ alignSelf: 'end', paddingBottom: 12 }}>
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            Servicio activo
          </label>

          <div className="form-field full">
            <label className="form-label" htmlFor="description">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              className="textarea"
              rows={2}
              value={form.description}
              onChange={handleChange}
              placeholder="Evaluación clínica completa de la mascota."
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Guardar cambios' : 'Registrar servicio'}
        </Button>
      </div>
    </form>
  )
}