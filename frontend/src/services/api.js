/**
 * Cliente HTTP centralizado.
 *
 * Responsabilidades:
 * - anteponer la URL base definida en VITE_API_URL
 * - adjuntar el token JWT automáticamente cuando existe
 * - normalizar los errores de la API en un Error con .detail legible
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const TOKEN_KEY = 'vetcare_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/** Error de la API con el mensaje `detail` que devuelve FastAPI. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Extrae un mensaje legible de la respuesta de error de FastAPI.
 * FastAPI devuelve { detail: string } o { detail: [{ msg, loc }] } en validaciones.
 */
function extractMessage(payload, fallback) {
  const { detail } = payload || {}

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg || 'Dato inválido').join('. ')
  }

  return fallback
}

async function request(path, options = {}) {
  const { params, body, ...rest } = options
  const url = new URL(`${BASE_URL}${path}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value)
      }
    })
  }

  const headers = { ...(rest.headers || {}) }
  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url.toString(), {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).catch(() => {
    // fetch sólo lanza cuando el servidor no responde (apagado, puerto
    // equivocado o sin red). Se traduce a un mensaje útil.
    throw new ApiError(
      `No fue posible conectar con el servidor en ${BASE_URL}. Verifica que el backend esté corriendo.`,
      0,
    )
  })

  // 204 No Content: no hay JSON que parsear.
  if (response.status === 204) {
    return null
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload, 'No fue posible completar la operación.'),
      response.status,
    )
  }

  return payload
}

export const api = {
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export default api