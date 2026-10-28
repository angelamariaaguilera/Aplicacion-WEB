import { useState } from 'react'

import Alert from '../common/Alert'
import Button from '../common/Button'
import Input from '../common/Input'
import { buildPayload, pickFields } from '../common/formUtils'

const EMPTY = {
  first_name: '',
  last_name: '',
  document_number: '',
  phone: '',
  email: '',
  address: '',
}

const EDITABLE = ['first_name', 'last_name', 'document_number', 'phone', 'email', 'address']

/** Formulario de propietario. Sirve para crear y para editar. */
export default function OwnerForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => pickFields(initialData, EDITABLE, EMPTY))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(initialData?.id)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      // El backend espera null, no cadena vacía, para los campos opcionales.
      const payload = buildPayload(form)
      payload.first_name = form.first_name.trim()
      payload.last_name = form.last_name.trim()
      payload.phone = form.phone.trim()

      await onSubmit(payload)
    } catch (err) {
      setError(err.message || 'No fue posible guardar el propietario.')
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
        <p className="form-section-title">Datos personales</p>

        <div className="form-grid">
          <Input
            label="Nombres"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="Carlos"
            maxLength={80}
            required
          />

          <Input
            label="Apellidos"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Ramírez"
            maxLength={80}
            required
          />

          <Input
            label="Número de documento"
            name="document_number"
            value={form.document_number}
            onChange={handleChange}
            placeholder="1001234567"
            maxLength={30}
            hint="Opcional, pero debe ser único"
          />

          <Input
            label="Teléfono"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+57 310 555 1122"
            maxLength={30}
            required
          />
        </div>
      </div>

      <div className="form-section">
        <p className="form-section-title">Contacto</p>

        <div className="form-grid">
          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            maxLength={150}
          />

          <Input
            label="Dirección"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Calle 45 # 12-30"
            maxLength={200}
          />
        </div>
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Guardar cambios' : 'Registrar propietario'}
        </Button>
      </div>
    </form>
  )
}