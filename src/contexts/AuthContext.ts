import { createContext } from 'react'
import type { LoginCredentials } from '../types/auth'
import type { AuthState } from './authReducer'

export type AuthContextValue = {
  state: AuthState
  signIn: (credentials: LoginCredentials) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
