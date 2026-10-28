/**
 * Utilidades para los formularios.
 */

/**
 * Construye el estado inicial de un formulario tomando sólo los campos
 * editables desde `source`.
 *
 * Es necesario porque la API devuelve objetos con campos calculados
 * (`id`, `pets_count`, `created_at`, objetos anidados...) que no
 * pertenecen al formulario y romperían el mapeo a payload.
 */
export function pickFields(source, fields, fallback = {}) {
  const base = { ...fallback }
  if (!source) return base

  fields.forEach((field) => {
    const value = source[field]
    base[field] = value === null || value === undefined ? '' : value
  })

  return base
}

/**
 * Convierte los valores del formulario en el payload que espera la API:
 * los strings vacíos se envían como `null` para no sobrescribir con "".
 */
export function buildPayload(form, requiredFields = []) {
  const payload = {}

  Object.entries(form).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      payload[key] = trimmed === '' ? null : trimmed
    } else {
      payload[key] = value
    }
  })

  requiredFields.forEach((key) => {
    if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
      payload[key] = null
    }
  })

  return payload
}