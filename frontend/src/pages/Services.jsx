import { useState } from 'react'
import { Pencil, Plus, Search, Syringe } from 'lucide-react'

import api from '../services/api'
import useApiResource from '../hooks/useApiResource'
import useDebouncedValue from '../hooks/useDebouncedValue'
import Badge from '../components/common/Badge'
import Button, { IconButton } from '../components/common/Button'
import Modal from '../components/common/Modal'
import ServiceForm from '../components/common/ServiceForm'
import SuccessToast from '../components/common/Toast'
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '../components/common/LoadingSpinner'
import { formatCurrency } from '../services/formatters'

export default function Services() {
  const [search, setSearch] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  const { data, loading, error, reload, setData } = useApiResource(
    () => api.get('/services', { search: debouncedSearch, only_active: onlyActive }),
    [debouncedSearch, onlyActive],
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')

  const services = data || []

  const handleSubmit = async (payload) => {
    if (editing) {
      const updated = await api.put(`/services/${editing.id}`, payload)
      setData((current) =>
        (current || []).map((service) => (service.id === updated.id ? updated : service)),
      )
      setToast('Servicio actualizado correctamente.')
    } else {
      const created = await api.post('/services', payload)
      setData((current) => [...(current || []), created])
      setToast('Servicio registrado correctamente.')
    }

    setModalOpen(false)
  }

  const handleToggleActive = async (service) => {
    try {
      const updated = await api.put(`/services/${service.id}`, { is_active: !service.is_active })
      setData((current) =>
        (current || []).map((item) => (item.id === updated.id ? updated : item)),
      )
      setToast(updated.is_active ? 'Servicio activado.' : 'Servicio desactivado.')
    } catch (err) {
      setToast(err.message)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Servicios</h1>
          <p className="page-subtitle">
            {services.length > 0
              ? `${services.length} servicio(s) en el catálogo.`
              : 'Configura los servicios que ofrece la clínica.'}
          </p>
        </div>
        <div className="page-actions">
          <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true) }}>
            Nuevo servicio
          </Button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={15} strokeWidth={2} />
          <input
            type="search"
            className="input"
            placeholder="Buscar servicio"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar servicios"
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
          <LoadingSpinner message="Cargando servicios..." />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : services.length === 0 ? (
          <EmptyState
            icon={Syringe}
            title="No hay servicios registrados."
            description="Agrega los servicios que la clínica ofrece para poder agendar citas."
            action={
              <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true) }}>
                Registrar servicio
              </Button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Descripción</th>
                  <th className="col-numeric">Precio</th>
                  <th className="col-numeric">Duración</th>
                  <th className="col-numeric">Citas</th>
                  <th>Estado</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="table-cell-title">{service.name}</td>
                    <td className="text-secondary">
                      <span className="text-truncate" style={{ display: 'block', maxWidth: 280 }}>
                        {service.description || '—'}
                      </span>
                    </td>
                    <td className="col-numeric table-cell-title">{formatCurrency(service.price)}</td>
                    <td className="col-numeric text-secondary">{service.duration_minutes} min</td>
                    <td className="col-numeric">
                      <span className="badge badge-neutral">{service.appointments_count}</span>
                    </td>
                    <td>
                      <Badge variant={service.is_active ? 'confirmed' : 'neutral'}>
                        {service.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="col-actions">
                      <div className="table-actions">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleToggleActive(service)}
                        >
                          {service.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <IconButton
                          icon={Pencil}
                          label="Editar"
                          onClick={() => { setEditing(service); setModalOpen(true) }}
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
        title={editing ? 'Editar servicio' : 'Nuevo servicio'}
        description={
          editing ? 'Actualiza los datos del servicio.' : 'Agrega un servicio al catálogo.'
        }
      >
        {modalOpen && (
          <ServiceForm
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