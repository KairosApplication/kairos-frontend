import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn<typeof fetch>()
let login: typeof import('./authService')['login']
const credentials = { email: ' manager@example.test ', password: 'test password&+=' }
const before = { headerName: 'X-CSRF-TOKEN', token: 'before-login' }
const after = { headerName: 'X-CSRF-TOKEN', token: 'after-login' }
const manager = { email: 'manager@example.test', roles: ['MANAGER'] }
const token = { accessToken: 'opaque-test-access', tokenType: 'Bearer', expiresIn: 900 }

function headersAt(index: number) { return new Headers(fetchMock.mock.calls[index][1]?.headers) }

describe('restauração e encerramento da sessão', () => {
  it('restaura gerente com cookies e reconhece sessão expirada', async () => {
    const { getSession } = await import('./authService')
    fetchMock.mockResolvedValueOnce(Response.json(manager))
    await expect(getSession()).resolves.toEqual(manager)
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/me'), expect.objectContaining({ credentials: 'include', cache: 'no-store' }))
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    await expect(getSession()).resolves.toBeNull()
  })
  it.each([403, 'EMPLOYEE', 'CUSTOMER'])('nega acesso para %s', async (value) => {
    const { getSession, AccessDeniedError } = await import('./authService')
    fetchMock.mockResolvedValueOnce(typeof value === 'number' ? new Response(null, { status: value }) : Response.json({ email: manager.email, roles: [value] }))
    await expect(getSession()).rejects.toBeInstanceOf(AccessDeniedError)
  })
  it('não confunde falha do servidor, payload ou rede com sessão anônima', async () => {
    const { getSession } = await import('./authService')
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
    await expect(getSession()).rejects.toThrow('verificar sua sessão')
    fetchMock.mockResolvedValueOnce(Response.json({ roles: 'MANAGER' }))
    await expect(getSession()).rejects.toThrow('resposta inesperada')
    fetchMock.mockRejectedValueOnce(new TypeError('offline'))
    await expect(getSession()).rejects.toThrow('conectar')
  })
  it('propaga cancelamento sem remover o timeout', async () => {
    const { getSession } = await import('./authService')
    const controller = new AbortController()
    fetchMock.mockResolvedValueOnce(Response.json(manager))
    await getSession(controller.signal)
    const signal = fetchMock.mock.calls[0][1]?.signal
    controller.abort()
    expect(signal?.aborted).toBe(true)
  })
  it.each([204, 401])('encerra sessão com CSRF novo: %s', async (status) => {
    const { logout } = await import('./authService')
    fetchMock.mockResolvedValueOnce(Response.json(before)).mockResolvedValueOnce(new Response(null, { status }))
    await expect(logout()).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/logout'), expect.objectContaining({ method: 'POST' }))
    expect(headersAt(1).get('X-CSRF-TOKEN')).toBe(before.token)
  })
  it.each([403, 500])('não declara logout bem sucedido com status %s', async (status) => {
    const { logout } = await import('./authService')
    fetchMock.mockResolvedValueOnce(Response.json(before)).mockResolvedValueOnce(new Response(null, { status }))
    await expect(logout()).rejects.toThrow()
  })
})

function successfulLogin(user: unknown = manager) {
  fetchMock
    .mockResolvedValueOnce(Response.json(before))
    .mockResolvedValueOnce(Response.json(token))
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

describe('login JWT por cookies HttpOnly', () => {
  it('aceita HTTP 200, confirma cookies por /me e descarta o bearer do corpo', async () => {
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
      method: 'POST',
    })
    expect(headersAt(1).get('Content-Type')).toBe('application/x-www-form-urlencoded')
    expect(headersAt(1).get('X-CSRF-TOKEN')).toBe('before-login')
    for (let index = 0; index < fetchMock.mock.calls.length; index += 1) expect(headersAt(index).has('Authorization')).toBe(false)
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
    [204, 'Não foi possível entrar agora.'],
  ])('trata POST com status %s sem consultar /me', async (status, message) => {
    fetchMock.mockResolvedValueOnce(Response.json(before))
      .mockResolvedValueOnce(new Response(null, { status }))
    await expect(login(credentials)).rejects.toThrow(message)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each(['CUSTOMER', 'EMPLOYEE'])('recusa %s e encerra a sessão usando o CSRF renovado', async (role) => {
    successfulLogin({ email: 'other@example.test', roles: [role] })
    fetchMock.mockResolvedValueOnce(Response.json(after)).mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(login(credentials)).rejects.toThrow('Esta conta não tem acesso ao painel do gerente.')
    expect(fetchMock).toHaveBeenLastCalledWith('https://api.example.test/api/v1/auth/logout', expect.objectContaining({
      method: 'POST', credentials: 'include',
    }))
    expect(headersAt(5).get('X-CSRF-TOKEN')).toBe('after-login')
  })

  it('informa quando não foi possível encerrar a sessão de outro perfil', async () => {
    successfulLogin({ email: 'other@example.test', roles: ['CUSTOMER'] })
    fetchMock.mockResolvedValueOnce(Response.json(after)).mockResolvedValueOnce(new Response(null, { status: 403 }))
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
      .mockResolvedValueOnce(Response.json(token))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
    await expect(login(credentials)).rejects.toThrow('sessão segura')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('identifica sessão não mantida após POST válido', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(before))
      .mockResolvedValueOnce(Response.json(token))
      .mockResolvedValueOnce(Response.json(after))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
    await expect(login(credentials)).rejects.toThrow('A sessão não foi mantida.')
  })

  it('não expõe mensagens técnicas em falha de rede', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(login(credentials)).rejects.toThrow('Não foi possível conectar à loja.')
  })

  it.each([
    {}, { ...token, accessToken: '' }, { ...token, tokenType: 'Other' },
    { ...token, expiresIn: 0 }, { ...token, expiresIn: 1.5 },
  ])('recusa payload de token inválido sem tentar confirmar acesso: %j', async (payload) => {
    fetchMock.mockResolvedValueOnce(Response.json(before)).mockResolvedValueOnce(Response.json(payload))
    await expect(login(credentials)).rejects.toThrow('resposta inesperada')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('não tenta renovar ou repetir /me quando o backend retorna 401 definitivo', async () => {
    const { getSession } = await import('./authService')
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    await expect(getSession()).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
