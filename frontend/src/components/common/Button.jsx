/** Botón reutilizable. */

export default function Button({
  children,
  variant = 'primary',
  size,
  type = 'button',
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size ? `btn-${size}` : '',
    !size && !className ? '' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <span className="spinner spinner-inverse" style={{ width: 16, height: 16 }} />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} />
      )}
      {children}
    </button>
  )
}

/** Botón cuadrado con solo ícono, para acciones de tabla. */
export function IconButton({ icon: Icon, label, variant = 'ghost', ...props }) {
  return (
    <button type="button" className={`btn-icon ${variant}`} title={label} aria-label={label} {...props}>
      <Icon size={16} strokeWidth={2} />
    </button>
  )
}