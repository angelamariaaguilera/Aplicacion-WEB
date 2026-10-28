import { STATUS_LABELS } from '../../services/formatters'

const CLASS_BY_STATUS = {
  scheduled: 'badge-scheduled',
  confirmed: 'badge-confirmed',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
}

/** Badge de estado de cita con colores suaves según el estado. */
export function StatusBadge({ status }) {
  return (
    <span className={`badge ${CLASS_BY_STATUS[status] || 'badge-neutral'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

/** Badge genérico para otros casos (activo/inactivo, roles). */
export default function Badge({ variant = 'neutral', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}