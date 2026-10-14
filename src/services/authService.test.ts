import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn<typeof fetch>()
let login: typeof import('./authService')['login']
const credentials = { email: ' manager@example.test ', password: 'test password&+=' }
const before = { headerName: 'X-CSRF-TOKEN', token: 'before-login' }
const after = { headerName: 'X-CSRF-TOKEN', token: 'after-login' }
const manager = { email: 'manager@example.test', roles: ['MANAGER'] }

function successfulLogin(user: unknown = manager) {
  fetchMock
    .mockResolvedValueOnce(Response.json(before))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json(after))
    .mockResolvedValueOnce(Response.json(user))
}

beforeEach(async () => {
  vi.resetModules()
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  login = (await import('./authService')).login
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('login por sessão Spring Boot', () => {
  it('usa cookies, formulário e CSRF renovado, sem tentar ler JSON do 204', async () => {
    successfulLogin()
    await expect(login(credentials)).resolves.toEqual(manager)
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example.test/api/v1/auth/login',
      'https://api.example.test/api/v1/auth/login',
      'https://api.example.test/api/v1/auth/login',
      'https://api.example.test/api/v1/auth/me',
    ])
    for (const [, options] of fetchMock.mock.calls) {
      expect(options).toMatchObject({ credentials: 'include', cache: 'no-store' })
      expect(options?.signal).toBeInstanceOf(AbortSignal)
    }
    const options = fetchMock.mock.calls[1][1]
    expect(options).toMatchObject({
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-TOKEN': 'before-login' },
    })
    expect(options?.body).toBeInstanceOf(URLSearchParams)
    const body = options?.body as URLSearchParams
    expect(body.get('email')).toBe('manager@example.test')
    expect(body.get('password')).toBe(credentials.password)
    expect([...body.keys()]).toEqual(['email', 'password'])
  })

  it.each([
    [401, 'E-mail ou senha inválidos.'],
    [403, 'A sessão de acesso expirou.'],
    [500, 'Não foi possível entrar agora.'],
    [200, 'Não foi possível entrar agora.'],
  ])('trata POST com status %s sem consultar /me', async (status, message) => {
    fetchMock.mockResolvedValueOnce(Response.json(before))
      .mockResolvedValueOnce(new Response(null, { status }))
    await expect(login(credentials)).rejects.toThrow(message)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each(['CUSTOMER', 'EMPLOYEE'])('recusa %s e encerra a sessão usando o CSRF renovado', async (role) => {
    successfulLogin({ email: 'other@example.test', roles: [role] })
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(login(credentials)).rejects.toThrow('Esta conta não tem acesso ao painel do gerente.')
    expect(fetchMock).toHaveBeenLastCalledWith('https://api.example.test/api/v1/auth/logout', expect.objectContaining({
      method: 'POST', headers: { 'X-CSRF-TOKEN': 'after-login' }, credentials: 'include',
    }))
  })

  it('informa quando não foi possível encerrar a sessão de outro perfil', async () => {
    successfulLogin({ email: 'other@example.test', roles: ['CUSTOMER'] })
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }))
    await expect(login(credentials)).rejects.toThrow('não foi possível encerrar sua sessão')
  })

  it('não aceita payload de sessão malformado', async () => {
    successfulLogin({ email: 'manager@example.test', roles: 'MANAGER' })
    await expect(login(credentials)).rejects.toThrow('resposta inesperada')
  })

  it('não envia a senha quando o CSRF é inválido', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ token: 'missing-header' }))
    await expect(login(credentials)).rejects.toThrow('resposta inesperada')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('não continua quando falha a renovação do CSRF após login', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(before))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
    await expect(login(credentials)).rejects.toThrow('sessão segura')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('identifica sessão não mantida após POST válido', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(before))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json(after))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
    await expect(login(credentials)).rejects.toThrow('A sessão não foi mantida.')
  })

  it('não expõe mensagens técnicas em falha de rede', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(login(credentials)).rejects.toThrow('Não foi possível conectar à loja.')
  })
})
