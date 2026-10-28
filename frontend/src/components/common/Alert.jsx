import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

const ICONS = {
  danger: AlertCircle,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
}

/** Mensaje destacado para errores de formulario y avisos. */
export default function Alert({ variant = 'danger', children }) {
  const Icon = ICONS[variant] || AlertCircle

  return (
    <div className={`alert alert-${variant}`} role="alert">
      <Icon size={16} strokeWidth={2} />
      <span>{children}</span>
    </div>
  )
}