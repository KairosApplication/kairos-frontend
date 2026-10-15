import { Navigate, Outlet, useLocation } from 'react-router'
import SessionStatus from '../components/SessionStatus'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute() {
  const { state, refreshSession } = useAuth()
  const location = useLocation()
  if (state.status === 'checking' || state.status === 'error') {
    return <SessionStatus error={state.error} onRetry={refreshSession} />
  }
  if (state.status !== 'authenticated' || !state.user?.roles.includes('MANAGER')) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  }
  return <Outlet />
}

export default ProtectedRoute
