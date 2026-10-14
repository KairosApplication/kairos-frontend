import type { SessionUser } from '../types/auth'

export type AuthReason = 'expired' | 'forbidden' | 'signed-out' | null

export type AuthState = {
  status: 'checking' | 'anonymous' | 'authenticated' | 'error'
  user: SessionUser | null
  error: string | null
  reason: AuthReason
  signingOut: boolean
}

export type AuthAction =
  | { type: 'CHECK_STARTED' }
  | { type: 'SESSION_FOUND'; user: SessionUser }
  | { type: 'SESSION_MISSING'; reason: AuthReason }
  | { type: 'CHECK_FAILED'; error: string }
  | { type: 'SIGN_OUT_STARTED' }
  | { type: 'SIGN_OUT_FAILED'; error: string }

export const initialAuthState: AuthState = {
  status: 'checking', user: null, error: null, reason: null, signingOut: false,
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'CHECK_STARTED':
      return { ...state, status: 'checking', user: null, error: null, signingOut: false }
    case 'SESSION_FOUND':
      return { status: 'authenticated', user: action.user, error: null, reason: null, signingOut: false }
    case 'SESSION_MISSING':
      return { status: 'anonymous', user: null, error: null, reason: action.reason ?? state.reason, signingOut: false }
    case 'CHECK_FAILED':
      return { ...state, status: 'error', user: null, error: action.error, signingOut: false }
    case 'SIGN_OUT_STARTED':
      return { ...state, signingOut: true, error: null }
    case 'SIGN_OUT_FAILED':
      return { ...state, status: 'error', user: null, signingOut: false, error: action.error }
  }
}
