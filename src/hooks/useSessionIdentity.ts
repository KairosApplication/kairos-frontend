import { useAuth } from './useAuth'

export function useSessionIdentity() {
  const { state } = useAuth()
  const email = state.user?.email ?? ''
  const initials = email.split('@')[0].split(/[._-]/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]).join('').toLocaleUpperCase('pt-BR')
  return { email, initials }
}
