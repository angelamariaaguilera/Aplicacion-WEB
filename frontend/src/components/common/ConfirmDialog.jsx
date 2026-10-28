import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

/** Confirmación antes de acciones destructivas (eliminar). */
export default function ConfirmDialog({
  open,
  title = '¿Confirmar acción?',
  description,
  confirmText = 'Eliminar',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--space-4)' }}>
        <span className="confirm-icon">
          <AlertTriangle size={20} strokeWidth={2} />
        </span>
        <div>
          <h3 className="modal-title" style={{ marginBottom: 'var(--space-2)' }}>
            {title}
          </h3>
          {description && <p className="text-secondary">{description}</p>}
        </div>
      </div>
    </Modal>
  )
}