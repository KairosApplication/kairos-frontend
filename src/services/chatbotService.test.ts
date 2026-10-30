import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const id = '000000000000000000000001'
const fetchMock = vi.fn<typeof fetch>()
let service: typeof import('./chatbotService')
beforeEach(async () => {
  vi.resetModules()
  vi.stubEnv('VITE_API_BASE_URL', 'https://kairos.test')
  vi.stubEnv('VITE_CHATBOT_API_URL', 'https://kairos.test/')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  fetchMock.mockResolvedValueOnce(Response.json({ headerName: 'X-CSRF-TOKEN', token: 'csrf' }))
  service = await import('./chatbotService')
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('envia somente pergunta e conversa, usa cookies/CSRF e filtra a origem dos dados', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ answer: 'Resposta', conversationId: id, approved: true, blocked: false,
    sources: ['database', 'users.cpf', 'memory', { collection: 'private' }, 'database'], database: 'private-db' }))
  const answer = await service.sendMessage('Pergunta', id)
  expect(answer.sources).toEqual(['database', 'memory'])
  expect(answer).not.toHaveProperty('database')
  const [url, options] = fetchMock.mock.calls[1]
  expect(url).toBe('https://kairos.test/api/v1/me/chat/messages')
  expect(options).toMatchObject({ credentials: 'include', cache: 'no-store', redirect: 'error' })
  expect(new Headers(options?.headers).get('X-CSRF-TOKEN')).toBe('csrf')
  expect(JSON.parse(options?.body as string)).toEqual({ question: 'Pergunta', conversationId: id })
})

it('recupera fontes por mensagem no histórico sem atribuí-las ao usuário', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ id, status: 'ACTIVE', messages: [
    { sender: 'USER', content: 'Pergunta', sources: ['database'] },
    { sender: 'AI', content: 'Resposta', sources: ['pdf', 'private.collection'], table: 'private' },
    { sender: 'AI', content: 'Resposta antiga sem metadados' },
  ] }))
  const value = await service.readConversation(id)
  expect(value.messages.map((item) => item.sources)).toEqual([[], ['pdf'], []])
  expect(JSON.stringify(value)).not.toContain('private')
})

it.each([401, 403, 500])('não expõe detalhes remotos nem repete uma solicitação que falhou: %s', async (status) => {
  fetchMock.mockResolvedValueOnce(new Response('collection=private; password=secret', { status }))
  await expect(service.sendMessage('Pergunta', id)).rejects.not.toThrow(/collection|password|secret/)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('descarta fontes de respostas bloqueadas ou reprovadas', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ answer: 'Não confirmado', conversationId: id, approved: false, blocked: false, sources: ['database'] }))
  expect((await service.sendMessage('Pergunta', id)).sources).toEqual([])
})
