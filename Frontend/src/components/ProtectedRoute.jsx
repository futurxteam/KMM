import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { HOME_BY_ROLE, LOGIN_BY_ROLE } from '../utils/constants'

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-500">Loading…</div>
  }
  if (!user) return <Navigate to={LOGIN_BY_ROLE[role]} state={{ from: location }} replace />
  if (user.role !== role) return <Navigate to={HOME_BY_ROLE[user.role]} replace />
  return children
}

