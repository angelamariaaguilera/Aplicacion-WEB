/**
 * Funciones de formato con convenciones colombianas:
 * - moneda en pesos colombianos, sin decimales
 * - fechas cortas como "10 oct 2026"
 * - edad aproximada a partir de meses
 */

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('es-CO')

const shortDateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const longDateFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const weekdayFormatter = new Intl.DateTimeFormat('es-CO', { weekday: 'short' })

/** Convierte un valor ISO o Date en Date. Devuelve null si no es válido. */
function toDate(value) {
  if (!value) return null
  // Las fechas "YYYY-MM-DD" se interpretan como UTC; añadimos T00:00 local
  // para evitar que salten de día por la zona horaria.
  const normalized = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatCurrency(value) {
  const number = Number(value ?? 0)
  return currencyFormatter.format(Number.isNaN(number) ? 0 : number)
}

export function formatNumber(value) {
  const number = Number(value ?? 0)
  return numberFormatter.format(Number.isNaN(number) ? 0 : number)
}

export function formatDate(value) {
  const date = toDate(value)
  if (!date) return '—'
  return shortDateFormatter.format(date).replace('.', '')
}

export function formatLongDate(value) {
  const date = toDate(value)
  if (!date) return '—'
  return longDateFormatter.format(date)
}

export function formatWeekday(value) {
  const date = toDate(value)
  if (!date) return ''
  return weekdayFormatter.format(date).replace('.', '')
}

export function formatTime(value) {
  const date = toDate(value)
  if (!date) return '—'
  return timeFormatter.format(date)
}

/** Convierte "14:30:00" en "2:30 p. m." */
export function formatTimeOnly(value) {
  if (!value) return '—'
  const [hours, minutes] = String(value).split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)
  return timeFormatter.format(date)
}

/** Convierte un número de meses en texto: "3 años y 2 meses" */
export function formatAge(months) {
  if (months === null || months === undefined) return 'Edad no registrada'

  const total = Number(months)
  if (Number.isNaN(total)) return 'Edad no registrada'
  if (total < 12) return `${total} ${total === 1 ? 'mes' : 'meses'}`

  const years = Math.floor(total / 12)
  const rest = total % 12

  if (rest === 0) return `${years} ${years === 1 ? 'año' : 'años'}`

  return `${years} ${years === 1 ? 'año' : 'años'} y ${rest} ${rest === 1 ? 'mes' : 'meses'}`
}

export const STATUS_LABELS = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export const SPECIES_LABELS = {
  Perro: 'Perro',
  Gato: 'Gato',
  Ave: 'Ave',
  Conejo: 'Conejo',
  Reptil: 'Reptil',
  Otro: 'Otro',
}

export const SEX_LABELS = {
  male: 'Macho',
  female: 'Hembra',
}

export const ROLE_LABELS = {
  admin: 'Administrador',
  receptionist: 'Recepcionista',
}

/** Fecha de hoy en formato YYYY-MM-DD, para los inputs de tipo date. */
export function todayISO() {
  return toDate(new Date()).toISOString().slice(0, 10)
}