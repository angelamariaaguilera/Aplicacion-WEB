import { useEffect, useState } from 'react'

/**
 * Hook que carga un recurso de la API y expone los estados de
 * carga, error y datos, evitando repetir esa lógica en cada página.
 *
 * `deps` funciona como el array de dependencias de useEffect.
 */
export default function useApiResource(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result = await fetcher()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err.message || 'No fue posible cargar la información.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  /** Permite refrescar la lista sin volver a montar el componente. */
  const reload = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err.message || 'No fue posible cargar la información.')
    } finally {
      setLoading(false)
    }
  }

  /** Permite que la página actualice la lista en memoria tras crear/editar. */
  const setDataSafely = (updater) => {
    setData((current) => (typeof updater === 'function' ? updater(current) : updater))
  }

  return { data, loading, error, reload, setData: setDataSafely }
}