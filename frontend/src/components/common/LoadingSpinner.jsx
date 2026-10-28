/** Estados de carga, vacío y error para cualquier listado. */

export function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <div className="loading-block">
      <span className="spinner" />
      <span>{message}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-icon">
          <Icon size={24} strokeWidth={1.75} />
        </span>
      )}
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'No fue posible cargar la información', description, onRetry }) {
  return (
    <div className="empty-state error-state card">
      <span className="empty-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </span>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {onRetry && (
        <div className="empty-action">
          <button type="button" className="btn btn-secondary" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}