import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../AuthContext'

export default function ProtectedRoute({ role, loginPath = '/login' }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center text-xl">Checking your session…</div>
  if (!user) return <Navigate to={loginPath} replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  return <Outlet />
}
