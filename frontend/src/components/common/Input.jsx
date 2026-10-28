import { AlertCircle } from 'lucide-react'

/**
 * Campo de texto con label visible y mensaje de error debajo.
 *
 * Props: label, error, hint, required, full (ocupa toda la fila), id...
 */
export default function Input({
  label,
  error,
  hint,
  required = false,
  full = false,
  id,
  className = '',
  ...props
}) {
  const inputId = id || props.name
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <div className={`form-field ${full ? 'full' : ''}`}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <input
        id={inputId}
        className={`input ${error ? 'error' : ''} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        required={required}
        {...props}
      />

      {error ? (
        <span className="field-error" id={errorId}>
          <AlertCircle size={13} strokeWidth={2} />
          {error}
        </span>
      ) : (
        hint && (
          <span className="form-hint" id={hintId}>
            {hint}
          </span>
        )
      )}
    </div>
  )
}