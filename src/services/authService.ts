import type { CsrfResponse, LoginCredentials, SessionUser } from '../types/auth'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCsrfResponse(value: unknown): value is CsrfResponse {
  return isRecord(value) && value.headerName === 'X-CSRF-TOKEN'
    && typeof value.token === 'string' && value.token.length > 0
}

function isSessionUser(value: unknown): value is SessionUser {
  return isRecord(value) && typeof value.email === 'string' && value.email.length > 0
    && Array.isArray(value.roles) && value.roles.every((role: unknown) =>
      role === 'MANAGER' || role === 'EMPLOYEE' || role === 'CUSTOMER')
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(`${apiBaseUrl}/api/v1/auth${path}`, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new Error('Não foi possível conectar à loja. Verifique sua conexão e tente novamente.')
  }
}

async function csrf(): Promise<CsrfResponse> {
  const response = await request('/login')
  if (!response.ok) throw new Error('Não foi possível iniciar uma sessão segura. Tente novamente.')
  try {
    const data: unknown = await response.json()
    if (!isCsrfResponse(data)) throw new Error()
    return data
  } catch {
    throw new Error('A loja retornou uma resposta inesperada. Tente novamente mais tarde.')
  }
}

export async function login(credentials: LoginCredentials): Promise<SessionUser> {
  const before = await csrf()
  const response = await request('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      [before.headerName]: before.token,
    },
    body: new URLSearchParams({ email: credentials.email.trim(), password: credentials.password }),
  })
  if (response.status === 401) throw new Error('E-mail ou senha inválidos.')
  if (response.status === 403) throw new Error('A sessão de acesso expirou. Tente entrar novamente.')
  if (response.status !== 204) throw new Error('Não foi possível entrar agora. Tente novamente mais tarde.')

  // Spring Security rotates both the session id and CSRF token after login.
  const after = await csrf()
  const session = await request('/me')
  if (session.status === 401) throw new Error('A sessão não foi mantida. Verifique as permissões de cookies e tente novamente.')
  if (!session.ok) throw new Error('Não foi possível confirmar seu acesso. Tente novamente.')
  let user: SessionUser
  try {
    const data: unknown = await session.json()
    if (!isSessionUser(data)) throw new Error()
    user = data
  } catch {
    throw new Error('A loja retornou uma resposta inesperada. Tente novamente mais tarde.')
  }

  if (!user.roles.includes('MANAGER')) {
    const logout = await request('/logout', {
      method: 'POST',
      headers: { [after.headerName]: after.token },
    })
    if (!logout.ok) throw new Error('Esta conta não tem acesso ao painel do gerente e não foi possível encerrar sua sessão. Procure o administrador da loja.')
    throw new Error('Esta conta não tem acesso ao painel do gerente. Procure o administrador da loja.')
  }
  return user
}
