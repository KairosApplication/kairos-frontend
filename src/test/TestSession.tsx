import type { ReactNode } from 'react'
import { vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'
const value: AuthContextValue = {
  state: { status: 'authenticated', user: { email: 'gerente@kairos.example', roles: ['MANAGER'] }, reason: null, error: null, signingOut: false },
  signIn: vi.fn(), signOut: vi.fn(), refreshSession: vi.fn(),
}
export default function TestSession({ children, refreshSession = value.refreshSession }: { children: ReactNode; refreshSession?: AuthContextValue['refreshSession'] }) {
  return <AuthContext.Provider value={{ ...value, refreshSession }}>{children}</AuthContext.Provider>
}
