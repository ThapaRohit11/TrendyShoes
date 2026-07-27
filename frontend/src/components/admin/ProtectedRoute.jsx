import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center text-xl">Checking your session…</div>
  if (!user) return <Navigate to="/admin/login" replace />
  if (user.role !== 'admin') return <Navigate to="/forbidden" replace />
  return <Outlet />
}
