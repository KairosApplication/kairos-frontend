import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const fetchMock = vi.fn<typeof fetch>()
let apiRequest: typeof import('./apiClient')['apiRequest']
const csrf = { headerName: 'X-CSRF-TOKEN', token: 'csrf-test-value' }

beforeEach(async () => {
  vi.resetModules()
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  apiRequest = (await import('./apiClient')).apiRequest
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it.each(['GET', 'HEAD', 'OPTIONS'])('lê com %s, cookies e timeout sem requisitar CSRF', async (method) => {
  fetchMock.mockResolvedValueOnce(new Response())
  await apiRequest('/products/list', { method })
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith('https://api.example.test/api/v1/products/list', expect.objectContaining({
    method, credentials: 'include', cache: 'no-store', redirect: 'error', signal: expect.any(AbortSignal),
  }))
})

it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('protege %s com CSRF atual, preservando corpo e headers', async (method) => {
  fetchMock.mockResolvedValueOnce(Response.json(csrf)).mockResolvedValueOnce(new Response(null, { status: 204 }))
  const headers = new Headers({ 'Content-Type': 'application/json', 'X-CSRF-TOKEN': 'stale' })
  await apiRequest('/products/update/1', { method, headers, body: '{"name":"Exemplo"}' })
  expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/api/v1/auth/login')
  const options = fetchMock.mock.calls[1][1]
  expect(options).toMatchObject({ method, body: '{"name":"Exemplo"}' })
  const sentHeaders = new Headers(options?.headers)
  expect(sentHeaders.get('Content-Type')).toBe('application/json')
  expect(sentHeaders.get('X-CSRF-TOKEN')).toBe(csrf.token)
  expect(headers.get('X-CSRF-TOKEN')).toBe('stale')
})

it.each([401, 403, 409, 500])('retorna status %s ao módulo sem repetir operações de escrita', async (status) => {
  fetchMock.mockResolvedValueOnce(Response.json(csrf)).mockResolvedValueOnce(new Response(null, { status }))
  const response = await apiRequest('/restockings/registration', { method: 'POST' })
  expect(response.status).toBe(status)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('não conserva CSRF entre escritas ou logout/login', async () => {
  fetchMock.mockResolvedValueOnce(Response.json(csrf)).mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json({ ...csrf, token: 'rotated' })).mockResolvedValueOnce(new Response(null, { status: 204 }))
  await apiRequest('/products/update/1', { method: 'PATCH' })
  await apiRequest('/products/update/2', { method: 'PATCH' })
  expect(new Headers(fetchMock.mock.calls[3][1]?.headers).get('X-CSRF-TOKEN')).toBe('rotated')
})

it.each([{}, { ...csrf, headerName: 'Unexpected' }, { ...csrf, token: ' ' }])('não envia escrita com CSRF inválido: %j', async (payload) => {
  fetchMock.mockResolvedValueOnce(Response.json(payload))
  await expect(apiRequest('/products/registration', { method: 'POST' })).rejects.toThrow('resposta inesperada')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('não envia a escrita se for cancelada durante a obtenção do CSRF', async () => {
  const controller = new AbortController()
  fetchMock.mockImplementationOnce(async () => {
    controller.abort()
    return Response.json(csrf)
  })
  await expect(apiRequest('/products/registration', { method: 'POST', signal: controller.signal })).rejects.toThrow()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('mantém a causa de cancelamento e apresenta mensagem segura para falha de transporte', async () => {
  const controller = new AbortController()
  controller.abort()
  await expect(apiRequest('/products/list', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  expect(fetchMock).not.toHaveBeenCalled()
  fetchMock.mockRejectedValueOnce(new TypeError('sensitive technical details'))
  await expect(apiRequest('/products/list')).rejects.toThrow('Não foi possível conectar à loja.')
})

it('identifica timeout sem tratar a demora como perda de conexão', async () => {
  fetchMock.mockRejectedValueOnce(new DOMException('sensitive details', 'TimeoutError'))
  await expect(apiRequest('/employees/list')).rejects.toThrow('A API da loja demorou mais de 15 segundos')
})

it.each([204, 500])('invalida leituras após uma escrita, inclusive resposta incerta: %s', async status => {
  const { setApiReadScope, sharedApiRead } = await import('./apiReadCache')
  setApiReadScope('manager')
  const load = vi.fn(async () => [])
  await sharedApiRead('/employees/list', load)
  fetchMock.mockResolvedValueOnce(Response.json(csrf)).mockResolvedValueOnce(new Response(null, { status }))
  await apiRequest('/employees/update/1', { method: 'PATCH' })
  await sharedApiRead('/employees/list', load)
  expect(load).toHaveBeenCalledTimes(2)
  setApiReadScope(null)
})
