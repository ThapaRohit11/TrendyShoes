import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/auth/me').then(({ user: current }) => setUser(current)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  return <AuthContext.Provider value={{ user, setUser, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
