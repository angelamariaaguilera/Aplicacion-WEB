import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartPulse, Plus, Search, Stethoscope } from 'lucide-react'

import api from '../services/api'
import useApiResource from '../hooks/useApiResource'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import SuccessToast from '../components/common/Toast'
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '../components/common/LoadingSpinner'
import { formatDate, formatNumber } from '../services/formatters'

/** Filtra los registros ya cargados por texto libre. */
function matchesSearch(record, term) {
  if (!term) return true
  const needle = term.toLowerCase()

  return [record.pet?.name, record.diagnosis, record.symptoms, record.treatment]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle))
}

export default function MedicalRecords() {
  const [search, setSearch] = useState('')
  const [petFilter, setPetFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [veterinarians, setVeterinarians] = useState([])

  const { data, loading, error, reload, setData } = useApiResource(
    () => api.get('/medical-records', { pet_id: petFilter }),
    [petFilter],
  )

  const { data: pets } = useApiResource(() => api.get('/pets'), [])

  const records = data || []
  const visible = records.filter((record) => matchesSearch(record, search))

  const openModal = async () => {
    try {
      const vets = await api.get('/veterinarians', { only_active: true })
      setVeterinarians(vets)
      setModalOpen(true)
    } catch (err) {
      setToast(err.message)
    }
  }

  const handleSubmit = async (form) => {
    setSaving(true)

    try {
      const created = await api.post('/medical-records', {
        pet_id: Number(form.pet_id),
        veterinarian_id: Number(form.veterinarian_id),
        symptoms: form.symptoms || null,
        diagnosis: form.diagnosis || null,
        treatment: form.treatment || null,
        observations: form.observations || null,
        weight: form.weight ? Number(form.weight) : null,
      })

      setData((current) => [created, ...(current || [])])
      setModalOpen(false)
      setToast('Historia clínica registrada correctamente.')
    } catch (err) {
      setToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historias clínicas</h1>
          <p className="page-subtitle">
            {records.length > 0
              ? `${records.length} consulta(s) registradas.`
              : 'Registro clínico de las mascotas.'}
          </p>
        </div>
        <div className="page-actions">
          <Button icon={Plus} onClick={openModal}>
            Nueva historia clínica
          </Button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={15} strokeWidth={2} />
          <input
            type="search"
            className="input"
            placeholder="Buscar por mascota, diagnóstico o tratamiento"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar historias clínicas"
          />
        </div>

        <div className="filter-field">
          <label htmlFor="pet-filter">Mascota</label>
          <select
            id="pet-filter"
            className="select"
            value={petFilter}
            onChange={(event) => setPetFilter(event.target.value)}
          >
            <option value="">Todas las mascotas</option>
            {(pets || []).map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="card">
        {loading ? (
          <LoadingSpinner message="Cargando historias clínicas..." />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={search || petFilter ? Search : HeartPulse}
            title="No hay historias clínicas para mostrar."
            description={
              search || petFilter
                ? 'Prueba con otro término de búsqueda.'
                : 'Registra la primera consulta de la clínica.'
            }
            action={
              <Button icon={Plus} onClick={openModal}>
                Registrar consulta
              </Button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Mascota</th>
                  <th>Veterinario</th>
                  <th>Diagnóstico</th>
                  <th className="col-numeric">Peso</th>
                  <th>Cita</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((record) => (
                  <tr key={record.id}>
                    <td className="text-secondary text-nowrap">
                      {formatDate(record.consultation_date)}
                    </td>

                    <td>
                      <Link to={`/pets/${record.pet.id}`} className="table-cell-title">
                        {record.pet.name}
                      </Link>
                      <div className="table-cell-sub">
                        {record.pet.breed || record.pet.species}
                      </div>
                    </td>

                    <td className="text-secondary text-nowrap">
                      <div className="row" style={{ gap: 'var(--space-2)' }}>
                        <Stethoscope size={14} strokeWidth={2} className="text-muted" />
                        Dr. {record.veterinarian.full_name}
                      </div>
                    </td>

                    <td>
                      <div className="text-truncate" style={{ maxWidth: 260 }}>
                        {record.diagnosis || '—'}
                      </div>
                    </td>

                    <td className="col-numeric text-secondary">
                      {record.weight ? `${formatNumber(record.weight)} kg` : '—'}
                    </td>

                    <td className="text-secondary text-nowrap">
                      {record.appointment ? `#${record.appointment.id}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <RecordModal
        open={modalOpen}
        pets={pets || []}
        veterinarians={veterinarians}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      />

      <SuccessToast message={toast} onClose={() => setToast('')} />
    </>
  )
}

/** Modal para registrar una consulta clínica. */
function RecordModal({ open, pets, veterinarians, saving, onSubmit, onClose }) {
  const [form, setForm] = useState({
    pet_id: '',
    veterinarian_id: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    observations: '',
    weight: '',
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
      description="Registra los datos de la consulta."
    >
      {open && (
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor="record-pet">
                Mascota<span className="required">*</span>
              </label>
              <select
                id="record-pet"
                name="pet_id"
                className="select"
                value={form.pet_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona la mascota</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="record-vet">
                Veterinario<span className="required">*</span>
              </label>
              <select
                id="record-vet"
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
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Registrar consulta
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}