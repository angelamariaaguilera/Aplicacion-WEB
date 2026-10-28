import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PawPrint, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react'

import api from '../services/api'
import useApiResource from '../hooks/useApiResource'
import useDebouncedValue from '../hooks/useDebouncedValue'
import Button, { IconButton } from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Modal from '../components/common/Modal'
import PetAvatar from '../components/pets/PetAvatar'
import PetForm from '../components/pets/PetForm'
import SuccessToast from '../components/common/Toast'
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '../components/common/LoadingSpinner'
import {
  SEX_LABELS,
  formatAge,
  formatNumber,
} from '../services/formatters'

export default function Pets() {
  const [search, setSearch] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const { data, loading, error, reload, setData } = useApiResource(
    () => api.get('/pets', { search: debouncedSearch, owner_id: ownerFilter }),
    [debouncedSearch, ownerFilter],
  )

  // Los propietarios se cargan aparte para poblar el filtro y el formulario.
  const { data: owners } = useApiResource(() => api.get('/owners'), [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState('')

  const pets = data || []
  const hasFilters = Boolean(debouncedSearch || ownerFilter)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (pet) => {
    setEditing(pet)
    setModalOpen(true)
  }

  const handleSubmit = async (payload) => {
    if (editing) {
      const updated = await api.put(`/pets/${editing.id}`, payload)
      setData((current) => (current || []).map((pet) => (pet.id === updated.id ? updated : pet)))
      setToast('Mascota actualizada correctamente.')
    } else {
      const created = await api.post('/pets', payload)
      setData((current) => [...(current || []), created])
      setToast('Mascota registrada correctamente.')
    }

    setModalOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)

    try {
      await api.delete(`/pets/${deleting.id}`)
      setData((current) => (current || []).filter((pet) => pet.id !== deleting.id))
      setToast('Mascota eliminada.')
    } catch (err) {
      setToast(err.message)
    } finally {
      setDeleteLoading(false)
      setDeleting(null)
    }
  }

  const ownerName = (pet) => pet.owner?.full_name || '—'

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mascotas</h1>
          <p className="page-subtitle">
            {pets.length > 0
              ? `${pets.length} mascota(s) registrada(s).`
              : 'Registra las mascotas que atiende la clínica.'}
          </p>
        </div>
        <div className="page-actions">
          <Button icon={Plus} onClick={openCreate}>
            Nueva mascota
          </Button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={15} strokeWidth={2} />
          <input
            type="search"
            className="input"
            placeholder="Buscar por nombre, especie, raza o propietario"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar mascotas"
          />
        </div>

        <div className="filter-field">
          <label htmlFor="owner-filter">Propietario</label>
          <select
            id="owner-filter"
            className="select"
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
          >
            <option value="">Todos los propietarios</option>
            {(owners || []).map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <section className="card">
          <LoadingSpinner message="Cargando mascotas..." />
        </section>
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : pets.length === 0 ? (
        <section className="card">
          <EmptyState
            icon={hasFilters ? Search : PawPrint}
            title={hasFilters ? 'Sin resultados' : 'No hay mascotas registradas.'}
            description={
              hasFilters
                ? 'Prueba con otro término de búsqueda o quita los filtros.'
                : 'Comienza registrando la primera mascota de la clínica.'
            }
            action={
              !hasFilters && (
                <Button icon={Plus} onClick={openCreate}>
                  Registrar mascota
                </Button>
              )
            }
          />
        </section>
      ) : (
        <div className="cards-list">
          {pets.map((pet) => (
            <article className="pet-card" key={pet.id}>
              <div className="pet-card-header">
                <PetAvatar species={pet.species} />
                <div style={{ minWidth: 0 }}>
                  <Link to={`/pets/${pet.id}`}>
                    <h2 className="pet-card-name">{pet.name}</h2>
                  </Link>
                  <p className="pet-card-meta">
                    {[pet.breed, pet.sex && SEX_LABELS[pet.sex]].filter(Boolean).join(' · ') || pet.species}
                  </p>
                </div>
              </div>

              <div className="pet-card-details">
                <div>
                  <div className="pet-card-detail-label">Edad</div>
                  <div className="pet-card-detail-value">{formatAge(pet.age_months)}</div>
                </div>
                <div>
                  <div className="pet-card-detail-label">Peso</div>
                  <div className="pet-card-detail-value">
                    {pet.weight ? `${formatNumber(pet.weight)} kg` : '—'}
                  </div>
                </div>
              </div>

              <div className="pet-card-footer">
                <span className="pet-card-owner">
                  <UserRound size={12} strokeWidth={2} style={{ display: 'inline', verticalAlign: -1 }} />{' '}
                  {ownerName(pet)}
                </span>

                <div className="table-actions">
                  <IconButton icon={Pencil} label="Editar" onClick={() => openEdit(pet)} />
                  <IconButton
                    icon={Trash2}
                    label="Eliminar"
                    variant="danger"
                    onClick={() => setDeleting(pet)}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar mascota' : 'Nueva mascota'}
        description={
          editing ? `Actualiza los datos de ${editing.name}.` : 'Completa la ficha de la mascota.'
        }
      >
        {modalOpen && (
          <PetForm
            initialData={editing}
            owners={owners || []}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar mascota"
        description={
          deleting
            ? `¿Seguro que deseas eliminar a ${deleting.name}? También se eliminarán sus citas e historias clínicas.`
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