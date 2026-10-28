import { AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * Banner de confirmación que se muestra unos segundos después de una
 * acción exitosa (crear, editar, eliminar).
 */
export default function SuccessToast({ message, onClose }) {
  if (!message) return null

  return (
    <div className="toast" role="status">
      <span className="toast-icon">
        <CheckCircle2 size={16} strokeWidth={2} />
      </span>
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  )
}

/** Variante de error, para cuando una acción no se pudo completar. */
export function ErrorToast({ message, onClose }) {
  if (!message) return null

  return (
    <div className="toast toast-error" role="alert">
      <span className="toast-icon">
        <AlertCircle size={16} strokeWidth={2} />
      </span>
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  )
}