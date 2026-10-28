import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Modal accesible: cierra con Escape, bloquea el scroll del body
 * y renderiza en un portal para quedar por encima de todo.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size,
  footer,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        // Solo cerramos si el clic empieza y termina en el fondo.
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div className={`modal ${size ? `modal-${size}` : ''}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            {description && <p className="modal-description">{description}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}