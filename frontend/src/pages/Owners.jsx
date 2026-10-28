import { useState } from 'react'
import { Pencil, Plus, Search, Trash2, UserRound, Users } from 'lucide-react'

import api from '../services/api'
import useApiResource from '../hooks/useApiResource'
import useDebouncedValue from '../hooks/useDebouncedValue'
import Button, { IconButton } from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import OwnerForm from '../components/owners/OwnerForm'
import SuccessToast from '../components/common/Toast'
import { formatDate } from '../services/formatters'

export default function Owners() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const { data, loading, error, reload, setData } = useApiResource(
    () => api.get('/owners', { search: debouncedSearch }),
    [debouncedSearch],
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState('')

  const owners = data || []

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (owner) => {
    setEditing(owner)
    setModalOpen(true)
  }

  const handleSubmit = async (payload) => {
    if (editing) {
      const updated = await api.put(`/owners/${editing.id}`, payload)
      setData((current) =>
        (current || []).map((owner) => (owner.id === updated.id ? updated : owner)),
      )
      setToast('Propietario actualizado correctamente.')
    } else {
      const created = await api.post('/owners', payload)
      setData((current) => [...(current || []), created])
      setToast('Propietario registrado correctamente.')
    }

    setModalOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)

    try {
      await api.delete(`/owners/${deleting.id}`)
      setData((current) => (current || []).filter((owner) => owner.id !== deleting.id))
      setToast('Propietario eliminado.')
    } catch (err) {
      setToast(err.message)
    } finally {
      setDeleteLoading(false)
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Propietarios</h1>
          <p className="page-subtitle">
            {owners.length > 0
              ? `${owners.length} propietario(s) registrado(s).`
              : 'Registra a los tutores de las mascotas.'}
          </p>
        </div>
        <div className="page-actions">
          <div className="search-bar">
            <Search size={15} strokeWidth={2} />
            <input
              type="search"
              className="input"
              placeholder="Buscar nombre, documento o teléfono"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar propietarios"
            />
          </div>
          <Button icon={Plus} onClick={openCreate}>
            Nuevo propietario
          </Button>
        </div>
      </div>

      <section className="card">
        {loading ? (
          <LoadingSpinner message="Cargando propietarios..." />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : owners.length === 0 ? (
          <EmptyState
            icon={debouncedSearch ? Search : Users}
            title={debouncedSearch ? 'Sin resultados' : 'No hay propietarios registrados.'}
            description={
              debouncedSearch
                ? `No encontramos propietarios que coincidan con "${debouncedSearch}".`
                : 'Comienza registrando al primer propietario de la clínica.'
            }
            action={
              !debouncedSearch && (
                <Button icon={Plus} onClick={openCreate}>
                  Registrar propietario
                </Button>
              )
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Propietario</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Mascotas</th>
                  <th>Registrado</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr key={owner.id}>
                    <td>
                      <div className="table-cell-main">
                        <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          <UserRound size={15} strokeWidth={2} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="table-cell-title">{owner.full_name}</div>
                          {owner.email && (
                            <div className="table-cell-sub">{owner.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-secondary text-nowrap">
                      {owner.document_number || '—'}
                    </td>
                    <td className="text-secondary text-nowrap">{owner.phone}</td>
                    <td className="col-numeric">
                      <span className="badge badge-neutral">{owner.pets_count}</span>
                    </td>
                    <td className="text-secondary text-nowrap">{formatDate(owner.created_at)}</td>
                    <td className="col-actions">
                      <div className="table-actions">
                        <IconButton icon={Pencil} label="Editar" onClick={() => openEdit(owner)} />
                        <IconButton
                          icon={Trash2}
                          label="Eliminar"
                          variant="danger"
                          onClick={() => setDeleting(owner)}
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
        title={editing ? 'Editar propietario' : 'Nuevo propietario'}
        description={
          editing
            ? 'Actualiza los datos del propietario.'
            : 'Completa los datos del tutor de la mascota.'
        }
      >
        {modalOpen && (
          <OwnerForm
            initialData={editing}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar propietario"
        description={
          deleting
            ? `¿Seguro que deseas eliminar a ${deleting.full_name}? Esta acción no se puede deshacer.`
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