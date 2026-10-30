import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ChatUncertainError, getConversation, sendChatMessage } from './assistantApiService'
import { publicSources } from './assistantSources'

const id = '000000000000000000000001'
const fetchMock = vi.fn<typeof fetch>()
let payload: unknown
let status: number
beforeEach(() => {
  vi.stubEnv('VITE_AI_BASE_URL', 'https://ai.kairos.test')
  vi.stubEnv('VITE_CHATBOT_API_URL', '')
  status = 200
  payload = {}
  fetchMock.mockReset().mockImplementation(async input => {
    const path = new URL(String(input)).pathname
    if (path.endsWith('/auth/me')) return Response.json({ email: 'gerente@kairos.example', roles: ['MANAGER'] })
    if (path.endsWith('/auth/login')) return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'csrf' })
    return Response.json(payload, { status })
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
const reply = (extra = {}) => ({ answer: 'Resposta', conversationId: id, executionId: '000000000000000000000099', approved: true, blocked: false, ...extra })

it('deduplicates public categories and rejects unknown or internal sources', () => {
  expect(publicSources(['database', 'private.users', 'memory', { collection: 'internal' }, 'database'])).toEqual(['database', 'memory'])
  expect(publicSources(undefined)).toEqual([])
})
it('sends only the question and conversation with cookies and CSRF and filters response sources', async () => {
  payload = reply({ sources: ['database', 'users.cpf', 'memory', 'database'], database: 'private-db' })
  const answer = await sendChatMessage(id, 'Pergunta')
  expect(answer.sources).toEqual(['database', 'memory'])
  expect(answer).not.toHaveProperty('database')
  const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/chat/messages'))!
  expect(call[0]).toBe('https://ai.kairos.test/api/v1/me/chat/messages')
  expect(call[1]).toMatchObject({ credentials: 'include', cache: 'no-store', redirect: 'error' })
  expect(new Headers(call[1]?.headers).get('X-CSRF-TOKEN')).toBe('csrf')
  expect(JSON.parse(String(call[1]?.body))).toEqual({ question: 'Pergunta', conversationId: id })
})
it('recovers sources per history message without returning internal metadata or user sources', async () => {
  payload = { id, status: 'ACTIVE', messages: [
    { sender: 'USER', content: 'Pergunta', sources: ['database'] },
    { sender: 'AI', content: 'Resposta', sources: ['pdf', 'private.collection'], table: 'private' },
    { sender: 'AI', content: 'Antiga' },
  ] }
  const history = await getConversation(id)
  expect(history.messages.map(m => m.sources)).toEqual([[], ['pdf'], []])
  expect(JSON.stringify(history)).not.toContain('private')
})
it.each([{ approved: false }, { blocked: true }])('omits sources for an unapproved or blocked response: %j', async flags => {
  payload = reply({ ...flags, sources: ['database'] })
  expect((await sendChatMessage(id, 'Pergunta')).sources).toEqual([])
})
it.each([401, 403, 500])('does not replay a failed write or expose its remote body: %s', async code => {
  status = code; payload = { message: 'password=secret; collection=private' }
  const failed = sendChatMessage(id, 'Pergunta')
  await expect(failed).rejects.not.toThrow(/password|collection|secret/)
  expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/chat/messages'))).toHaveLength(1)
  if (code === 500) await expect(failed).rejects.toBeInstanceOf(ChatUncertainError)
})
it('accepts the configured chatbot alias while preserving the same secure client', async () => {
  vi.stubEnv('VITE_CHATBOT_API_URL', 'https://chat.kairos.test/')
  payload = { id, status: 'ACTIVE', messages: [] }
  await getConversation(id)
  expect(fetchMock.mock.calls.some(([url]) => String(url) === `https://chat.kairos.test/api/v1/me/chat/conversations/${id}`)).toBe(true)
})
it('rejects an insecure external alias before sending authentication requests', async () => {
  vi.stubEnv('VITE_CHATBOT_API_URL', 'http://external.kairos.test')
  await expect(getConversation(id)).rejects.toThrow('Configure uma origem válida')
  expect(fetchMock).not.toHaveBeenCalled()
})
