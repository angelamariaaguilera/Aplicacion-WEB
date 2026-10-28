import { useState } from 'react'
import { Pencil, Plus, Search, Stethoscope } from 'lucide-react'

import api from '../services/api'
import useApiResource from '../hooks/useApiResource'
import useDebouncedValue from '../hooks/useDebouncedValue'
import Badge from '../components/common/Badge'
import Button, { IconButton } from '../components/common/Button'
import Modal from '../components/common/Modal'
import SuccessToast from '../components/common/Toast'
import VeterinarianForm from '../components/common/VeterinarianForm'
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '../components/common/LoadingSpinner'

export default function Veterinarians() {
  const [search, setSearch] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  const { data, loading, error, reload, setData } = useApiResource(
    () => api.get('/veterinarians', { search: debouncedSearch, only_active: onlyActive }),
    [debouncedSearch, onlyActive],
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')

  const vets = data || []

  const handleSubmit = async (payload) => {
    if (editing) {
      const updated = await api.put(`/veterinarians/${editing.id}`, payload)
      setData((current) => (current || []).map((vet) => (vet.id === updated.id ? updated : vet)))
      setToast('Veterinario actualizado correctamente.')
    } else {
      const created = await api.post('/veterinarians', payload)
      setData((current) => [...(current || []), created])
      setToast('Veterinario registrado correctamente.')
    }

    setModalOpen(false)
  }

  const handleToggleActive = async (vet) => {
    try {
      const updated = await api.put(`/veterinarians/${vet.id}`, { is_active: !vet.is_active })
      setData((current) => (current || []).map((item) => (item.id === updated.id ? updated : item)))
      setToast(updated.is_active ? 'Veterinario reactivado.' : 'Veterinario desactivado.')
    } catch (err) {
      setToast(err.message)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Veterinarios</h1>
          <p className="page-subtitle">
            {vets.length > 0
              ? `${vets.length} profesional(es) en el equipo.`
              : 'Registra al equipo médico de la clínica.'}
          </p>
        </div>
        <div className="page-actions">
          <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true) }}>
            Nuevo veterinario
          </Button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={15} strokeWidth={2} />
          <input
            type="search"
            className="input"
            placeholder="Buscar por nombre, matrícula o especialidad"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar veterinarios"
          />
        </div>

        <label className="checkbox-field" style={{ paddingBottom: 12 }}>
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(event) => setOnlyActive(event.target.checked)}
          />
          Mostrar solo activos
        </label>
      </div>

      <section className="card">
        {loading ? (
          <LoadingSpinner message="Cargando veterinarios..." />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : vets.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No hay veterinarios registrados."
            description="Registra a los profesionales que atenderán las citas."
            action={
              <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true) }}>
                Registrar veterinario
              </Button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Veterinario</th>
                  <th>Matrícula</th>
                  <th>Especialidad</th>
                  <th>Contacto</th>
                  <th>Citas</th>
                  <th>Estado</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vets.map((vet) => (
                  <tr key={vet.id}>
                    <td className="table-cell-title">{vet.full_name}</td>
                    <td className="text-secondary text-nowrap">{vet.license_number}</td>
                    <td className="text-secondary">{vet.specialty || '—'}</td>
                    <td className="text-secondary">
                      <div>{vet.phone || '—'}</div>
                      {vet.email && <div className="table-cell-sub">{vet.email}</div>}
                    </td>
                    <td className="col-numeric">
                      <span className="badge badge-neutral">{vet.appointments_count}</span>
                    </td>
                    <td>
                      <Badge variant={vet.is_active ? 'confirmed' : 'neutral'}>
                        {vet.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="col-actions">
                      <div className="table-actions">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleToggleActive(vet)}
                        >
                          {vet.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <IconButton
                          icon={Pencil}
                          label="Editar"
                          onClick={() => { setEditing(vet); setModalOpen(true) }}
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
        title={editing ? 'Editar veterinario' : 'Nuevo veterinario'}
        description={
          editing ? 'Actualiza los datos del profesional.' : 'Registra a un profesional de la clínica.'
        }
      >
        {modalOpen && (
          <VeterinarianForm
            initialData={editing}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>

      <SuccessToast message={toast} onClose={() => setToast('')} />
    </>
  )
}