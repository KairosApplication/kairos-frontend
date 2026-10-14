import { Navigate, useLocation } from 'react-router'
import SessionStatus from '../components/SessionStatus'
import { useAuth } from '../hooks/useAuth'
import Login from '../pages/Login'
import { loginDestination } from './loginDestination'

function LoginRoute() {
  const { state, refreshSession } = useAuth()
  const location = useLocation()
  if (state.status === 'checking' || state.status === 'error') {
    return <SessionStatus error={state.error} onRetry={refreshSession} />
  }
  if (state.status === 'authenticated') return <Navigate to={loginDestination(location.state)} replace />
  return <Login />
}

export default LoginRoute
