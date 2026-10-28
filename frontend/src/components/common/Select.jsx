import { AlertCircle } from 'lucide-react'

/**
 * Select con label visible y mensaje de error debajo.
 *
 * `options` acepta: { value, label }[]
 */
export default function Select({
  label,
  error,
  hint,
  required = false,
  full = false,
  options = [],
  placeholder = 'Selecciona una opción',
  id,
  ...props
}) {
  const selectId = id || props.name

  return (
    <div className={`form-field ${full ? 'full' : ''}`}>
      {label && (
        <label className="form-label" htmlFor={selectId}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <select
        id={selectId}
        className={`select ${error ? 'error' : ''}`}
        aria-invalid={Boolean(error)}
        required={required}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <span className="field-error">
          <AlertCircle size={13} strokeWidth={2} />
          {error}
        </span>
      ) : (
        hint && <span className="form-hint">{hint}</span>
      )}
    </div>
  )
}