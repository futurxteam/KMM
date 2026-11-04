import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMe, loginAdmin, loginPA, logoutRequest } from '../services/authService'
import { TOKEN_KEY } from '../utils/constants'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))
  const [sessionExpired, setSessionExpired] = useState(false)

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  // Restore session from stored token, validated server-side.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    fetchMe()
      .then(setUser)
      .catch(clear)
      .finally(() => setLoading(false))
  }, [clear])

  useEffect(() => {
    const onExpired = () => {
      clear()
      setSessionExpired(true)
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [clear])

  const login = useCallback(async (role, credentials) => {
    const fn = role === 'ADMIN' ? loginAdmin : loginPA
    const { token, user: u } = await fn(credentials)
    localStorage.setItem(TOKEN_KEY, token)
    setSessionExpired(false)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    clear()
  }, [clear])

  const value = useMemo(
    () => ({ user, loading, login, logout, sessionExpired, isAuthenticated: Boolean(user) }),
    [user, loading, login, logout, sessionExpired]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

