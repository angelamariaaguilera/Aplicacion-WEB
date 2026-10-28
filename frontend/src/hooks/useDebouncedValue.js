import { useEffect, useState } from 'react'

/**
 * Retrasa la propagación de un valor para no disparar una petición
 * a la API en cada tecla del buscador.
 */
export default function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}