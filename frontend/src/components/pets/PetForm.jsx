import { useState } from 'react'

import Alert from '../common/Alert'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'
import { pickFields } from '../common/formUtils'

const SPECIES_OPTIONS = [
  { value: 'Perro', label: 'Perro' },
  { value: 'Gato', label: 'Gato' },
  { value: 'Ave', label: 'Ave' },
  { value: 'Conejo', label: 'Conejo' },
  { value: 'Reptil', label: 'Reptil' },
  { value: 'Otro', label: 'Otro' },
]

const SEX_OPTIONS = [
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Hembra' },
]

const EDITABLE = ['owner_id', 'name', 'species', 'breed', 'sex', 'birth_date', 'weight', 'color', 'notes']

const EMPTY = {
  owner_id: '',
  name: '',
  species: 'Perro',
  breed: '',
  sex: '',
  birth_date: '',
  weight: '',
  color: '',
  notes: '',
}

/** Formulario de mascota. Sirve para crear y para editar. */
export default function PetForm({ initialData, owners, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => pickFields(initialData, EDITABLE, EMPTY))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(initialData?.id)

  const ownerOptions = owners.map((owner) => ({
    value: owner.id,
    label: owner.full_name,
  }))

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const optional = ['breed', 'sex', 'birth_date', 'weight', 'color', 'notes']

      const payload = {
        owner_id: Number(form.owner_id),
        name: form.name.trim(),
        species: form.species,
      }

      optional.forEach((key) => {
        const raw = form[key]
        if (raw === '' || raw === null || raw === undefined) {
          payload[key] = null
        } else if (key === 'weight') {
          payload[key] = Number(raw)
        } else if (key === 'birth_date') {
          payload[key] = raw
        } else {
          payload[key] = String(raw).trim()
        }
      })

      await onSubmit(payload)
    } catch (err) {
      setError(err.message || 'No fue posible guardar la mascota.')
    } finally {
      setSaving(false)
    }
  }

  if (owners.length === 0) {
    return (
      <>
        <Alert variant="warning">
          Primero debes registrar al menos un propietario en la sección Propietarios.
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
        <p className="form-section-title">Datos de la mascota</p>

        <div className="form-grid">
          <Input
            label="Nombre"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Mango"
            maxLength={80}
            required
          />

          <Select
            label="Especie"
            name="species"
            value={form.species}
            onChange={handleChange}
            options={SPECIES_OPTIONS}
            placeholder="Selecciona la especie"
            required
          />

          <Input
            label="Raza"
            name="breed"
            value={form.breed}
            onChange={handleChange}
            placeholder="Golden Retriever"
            maxLength={80}
          />

          <Select
            label="Sexo"
            name="sex"
            value={form.sex}
            onChange={handleChange}
            options={SEX_OPTIONS}
            placeholder="Sin especificar"
          />

          <Input
            label="Fecha de nacimiento"
            type="date"
            name="birth_date"
            value={form.birth_date}
            onChange={handleChange}
          />

          <Input
            label="Peso (kg)"
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            placeholder="32.5"
            min="0"
            max="9999.99"
            step="0.01"
            hint="Debe ser mayor que 0"
          />

          <Input
            label="Color"
            name="color"
            value={form.color}
            onChange={handleChange}
            placeholder="Dorado"
            maxLength={50}
          />

          <Select
            label="Propietario"
            name="owner_id"
            value={form.owner_id}
            onChange={handleChange}
            options={ownerOptions}
            placeholder="Selecciona el propietario"
            required
          />

          <div className="form-field full">
            <label className="form-label" htmlFor="notes">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              className="textarea"
              value={form.notes}
              onChange={handleChange}
              placeholder="Alergias, comportamiento o detalles importantes"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Guardar cambios' : 'Registrar mascota'}
        </Button>
      </div>
    </form>
  )
}