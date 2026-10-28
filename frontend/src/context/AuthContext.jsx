import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearToken, getToken, setToken } from '../services/api'
import api from '../services/api'

const AuthContext = createContext(null)

/**
 * Autenticación del frontend con Context API (sin Redux, según el diseño).
 * Guarda el token en localStorage y expone login/logout y el usuario actual.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Al cargar la app, si hay token guardado, recuperamos el perfil.
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!getToken()) {
        setLoading(false)
        return
      }

      try {
        const profile = await api.get('/auth/me')
        if (!cancelled) setUser(profile)
      } catch {
        // Token inválido o expirado: se limpia y se vuelve al login.
        clearToken()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }

  return context
}