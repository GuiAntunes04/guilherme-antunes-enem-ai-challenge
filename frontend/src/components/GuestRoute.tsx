import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function GuestRoute() {
  const { session, loading, recoveringPassword } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
        Carregando...
      </div>
    )
  }

  if (session && !recoveringPassword) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
