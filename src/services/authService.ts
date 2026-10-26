import type { LoginCredentials, SessionUser, TokenResponse } from '../types/auth'
import { apiRequest, getCsrfToken, isRecord, readApiJson } from './apiClient'

export class AccessDeniedError extends Error {
  constructor() {
    super('Esta conta não tem acesso ao painel do gerente. Procure o administrador da loja.')
    this.name = 'AccessDeniedError'
  }
}

function isSessionUser(value: unknown): value is SessionUser {
  return isRecord(value) && typeof value.email === 'string' && value.email.trim().length > 0
    && Array.isArray(value.roles) && value.roles.every((role: unknown) =>
      role === 'MANAGER' || role === 'EMPLOYEE' || role === 'CUSTOMER')
}

function isTokenResponse(value: unknown): value is TokenResponse {
  return isRecord(value) && typeof value.accessToken === 'string' && value.accessToken.trim().length > 0
    && value.tokenType === 'Bearer' && typeof value.expiresIn === 'number'
    && Number.isSafeInteger(value.expiresIn) && value.expiresIn > 0
}

async function sessionUser(response: Response): Promise<SessionUser> {
  const data = await readApiJson(response)
  if (!isSessionUser(data)) throw new Error('A loja retornou uma resposta inesperada. Tente novamente mais tarde.')
  return data
}

export async function getSession(signal?: AbortSignal): Promise<SessionUser | null> {
  // The backend renews an expired/missing access cookie using its HttpOnly refresh cookie.
  const response = await apiRequest('/auth/me', { signal })
  if (response.status === 401) return null
  if (response.status === 403) throw new AccessDeniedError()
  if (!response.ok) throw new Error('Não foi possível verificar sua sessão. Tente novamente.')
  const user = await sessionUser(response)
  if (!user.roles.includes('MANAGER')) throw new AccessDeniedError()
  return user
}

export async function logout(): Promise<void> {
  const response = await apiRequest('/auth/logout', { method: 'POST' })
  if (response.status === 204 || response.status === 401) return
  if (response.status === 403) throw new Error('Não foi possível encerrar a sessão com segurança. Tente sair novamente.')
  throw new Error('Não foi possível sair agora. Tente novamente.')
}

export async function login(credentials: LoginCredentials): Promise<SessionUser> {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: credentials.email.trim(), password: credentials.password }),
  })
  if (response.status === 401) throw new Error('E-mail ou senha inválidos.')
  if (response.status === 403) throw new Error('A sessão de acesso expirou. Tente entrar novamente.')
  if (response.status !== 200) throw new Error('Não foi possível entrar agora. Tente novamente mais tarde.')
  // Validate, then discard the bearer payload. Browser requests use HttpOnly cookies.
  if (!isTokenResponse(await readApiJson(response))) {
    throw new Error('A loja retornou uma resposta inesperada. Tente novamente mais tarde.')
  }
  // Login clears the old CSRF cookie; initialize the new one before entering the panel.
  await getCsrfToken()
  const session = await apiRequest('/auth/me')
  if (session.status === 401) throw new Error('A sessão não foi mantida. Verifique as permissões de cookies e tente novamente.')
  if (!session.ok) throw new Error('Não foi possível confirmar seu acesso. Tente novamente.')
  const user = await sessionUser(session)
  if (!user.roles.includes('MANAGER')) {
    try { await logout() } catch {
      throw new Error('Esta conta não tem acesso ao painel do gerente e não foi possível encerrar sua sessão. Procure o administrador da loja.')
    }
    throw new AccessDeniedError()
  }
  return user
}
