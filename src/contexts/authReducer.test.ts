import { expect, it } from 'vitest'
import { authReducer, initialAuthState } from './authReducer'

const user = { email: 'manager@example.test', roles: ['MANAGER' as const] }

it('preserva sessão confirmada durante revalidação e remove identidade na expiração', () => {
  const authenticated = authReducer(initialAuthState, { type: 'SESSION_FOUND', user })
  expect(authReducer(authenticated, { type: 'CHECK_STARTED' })).toBe(authenticated)
  const expired = authReducer(authenticated, { type: 'SESSION_MISSING', reason: 'expired' })
  expect(expired).toMatchObject({ status: 'anonymous', user: null, reason: 'expired' })
  expect(authReducer(expired, { type: 'SESSION_FOUND', user })).toMatchObject({ status: 'authenticated', reason: null })
})

it('bloqueia conteúdo após falha de logout mesmo se uma verificação foi cancelada', () => {
  const pending = authReducer(initialAuthState, { type: 'SIGN_OUT_STARTED' })
  expect(authReducer(pending, { type: 'SIGN_OUT_FAILED', error: 'Sem conexão' })).toMatchObject({ status: 'error', user: null, signingOut: false, error: 'Sem conexão' })
})
