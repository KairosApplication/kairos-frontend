// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TestSession from '../../test/TestSession'
import { chatId, handleChat, makeChatFixture } from '../../test/assistantApiFixture'
import KairosAssistant from './index'
let db: ReturnType<typeof makeChatFixture>
let fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>
beforeEach(() => {
  db = makeChatFixture()
  fetch = vi.fn<typeof globalThis.fetch>(async (input, options) => {
    const path = new URL(String(input)).pathname
    if (path.endsWith('/auth/me')) return Response.json({ email: 'gerente@kairos.example', roles: ['MANAGER'] })
    if (path.endsWith('/auth/login')) return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'fixture-csrf' })
    const result = handleChat(db, options?.method ?? 'GET', path, options?.body ? JSON.parse(String(options.body)) : undefined)
    return Response.json(result?.json ?? {}, { status: result?.status ?? 404 })
  })
  vi.stubGlobal('fetch', fetch)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
async function setup() { render(<TestSession><KairosAssistant /></TestSession>); await screen.findByRole('log') }
it('sends only question and conversation ID with cookies and CSRF, then reloads persisted history', async () => {
  await setup()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Como está a operação?' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  await screen.findByText('Resposta recebida do serviço de IA.')
  const call = fetch.mock.calls.find(([url, options]) => String(url).endsWith('/me/chat/messages') && options?.method === 'POST')
  expect(JSON.parse(String(call?.[1]?.body))).toEqual({ question: 'Como está a operação?', conversationId: chatId })
  expect(new Headers(call?.[1]?.headers).get('X-CSRF-TOKEN')).toBe('fixture-csrf')
  expect(new Headers(call?.[1]?.headers).has('Authorization')).toBe(false)
  expect(call?.[1]?.credentials).toBe('include')
})
it('creates a persistent conversation without assigning a client user ID', async () => {
  await setup(); fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }))
  await screen.findByText('Como podemos cuidar da loja hoje?')
  expect(db.conversations).toHaveLength(2)
})
it('does not retry an uncertain message and recovers history with GET', async () => {
  const respond = fetch.getMockImplementation()!
  fetch.mockImplementation(async (input, options) => { const response = await respond(input, options); if (String(input).endsWith('/me/chat/messages')) throw new TypeError('lost response'); return response })
  await setup()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Minha pergunta' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  await screen.findByRole('alert')
  expect(screen.getByText('Como posso ajudar na operação?')).toBeTruthy()
  expect(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' })).toHaveProperty('value', 'Minha pergunta')
  expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar histórico' }))
  await screen.findByText('Minha pergunta', { selector: 'p' })
  expect(fetch.mock.calls.filter(([url, options]) => String(url).endsWith('/me/chat/messages') && options?.method === 'POST')).toHaveLength(1)
})
it.each([400, 403, 422, 429])('keeps history and draft after HTTP %s and accepts a corrected question', async status => {
  await setup()
  const respond = fetch.getMockImplementation()!
  fetch.mockImplementation((input, options) => String(input).endsWith('/me/chat/messages') ? Promise.resolve(Response.json({ detail: 'password=secret; internal.table' }, { status })) : respond(input, options))
  const input = screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' })
  fireEvent.change(input, { target: { value: 'Minha pergunta' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  await screen.findByRole('alert')
  expect(screen.getByRole('log')).toBeTruthy()
  expect(screen.getByText('Como posso ajudar na operação?')).toBeTruthy()
  expect(input).toHaveProperty('value', 'Minha pergunta')
  expect(screen.queryByText(/password|internal.table/)).toBeNull()
  fetch.mockImplementation(respond)
  fireEvent.change(input, { target: { value: 'Pergunta corrigida' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  await screen.findByText('Pergunta corrigida', { selector: 'p' })
  expect(db.conversations[0].messages.at(-2)?.content).toBe('Pergunta corrigida')
})

it.each([409, 500, 503])('keeps the conversation after HTTP %s and reconciles a persisted message without replay', async status => {
  const respond = fetch.getMockImplementation()!
  fetch.mockImplementation(async (input, options) => {
    const response = await respond(input, options)
    return String(input).endsWith('/me/chat/messages') ? Response.json({ detail: 'private.database' }, { status }) : response
  })
  await setup()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Pergunta processada' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  await screen.findByRole('alert')
  expect(screen.getByText('Como posso ajudar na operação?')).toBeTruthy()
  expect(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' })).toHaveProperty('value', 'Pergunta processada')
  expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar histórico' }))
  await screen.findByText('Pergunta processada', { selector: 'p' })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toHaveProperty('disabled', false))
  expect(fetch.mock.calls.filter(([url, options]) => String(url).endsWith('/me/chat/messages') && options?.method === 'POST')).toHaveLength(1)
  expect(screen.queryByText(/private.database/)).toBeNull()
})

it('preserves history when a read fails after a successful send and recovers with GET', async () => {
  const respond = fetch.getMockImplementation()!
  let sent = false
  fetch.mockImplementation(async (input, options) => {
    const path = new URL(String(input)).pathname
    if (sent && path.endsWith(`/conversations/${chatId}`)) return Response.json({}, { status: 503 })
    const response = await respond(input, options)
    if (path.endsWith('/me/chat/messages')) sent = true
    return response
  })
  await setup()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Mensagem enviada' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  await screen.findByText(/A mensagem foi processada, mas não foi possível atualizar/)
  expect(screen.getByText('Como posso ajudar na operação?')).toBeTruthy()
  expect(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' })).toHaveProperty('value', '')
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Próxima pergunta' } })
  expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar histórico' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Atualizar histórico' })).toHaveProperty('disabled', false))
  expect(screen.getByText('Como posso ajudar na operação?')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toHaveProperty('disabled', true)
  sent = false
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar histórico' }))
  await screen.findByText('Mensagem enviada', { selector: 'p' })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toHaveProperty('disabled', false))
})

it('keeps the active conversation and draft after an uncertain creation and reloads only the list', async () => {
  const respond = fetch.getMockImplementation()!
  fetch.mockImplementation(async (input, options) => {
    const response = await respond(input, options)
    return String(input).endsWith('/me/chat/conversations') && options?.method === 'POST' ? Response.json({}, { status: 500 }) : response
  })
  await setup()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Rascunho preservado' } })
  fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }))
  await screen.findByRole('alert')
  expect(screen.getByText('Como posso ajudar na operação?')).toBeTruthy()
  expect(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' })).toHaveProperty('value', 'Rascunho preservado')
  expect(screen.getByRole('button', { name: 'Nova conversa' })).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar conversas' }))
  await screen.findByRole('button', { name: /Conversa 000002/ })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Nova conversa' })).toHaveProperty('disabled', false))
  expect(fetch.mock.calls.filter(([url, options]) => String(url).endsWith('/me/chat/conversations') && options?.method === 'POST')).toHaveLength(1)
})
it('keeps the draft after a known rejection and renders model text as plain text', async () => {
  await setup()
  const respond = fetch.getMockImplementation()!
  fetch.mockImplementation((input, options) => String(input).endsWith('/me/chat/messages') ? Promise.resolve(Response.json({}, { status: 403 })) : respond(input, options))
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: '<script>alert(1)</script>' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  await screen.findByRole('alert')
  await waitFor(() => expect((screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }) as HTMLInputElement).value).toBe('<script>alert(1)</script>'))
  expect(document.querySelector('script')).toBeNull()
})

it('keeps sources attached to their own persisted reply when switching conversations', async () => {
  const second = '000000000000000000000002'
  db.conversations.push({ id: second, status: 'ACTIVE', messages: [{ sender: 'AI', content: 'Preferência salva', sources: ['memory', 'private.collection'] }] })
  await setup()
  expect(screen.getByText('Documento PDF')).toBeTruthy()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Consulte o estoque' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  const answer = await screen.findByText('Resposta recebida do serviço de IA.')
  const bubble = within(answer.closest('article')!)
  expect(bubble.getByText('Banco de dados')).toBeTruthy()
  expect(bubble.queryByText('Documento PDF')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /Conversa 000002/ }))
  await screen.findByText('Preferência salva')
  expect(screen.getByText('Memória')).toBeTruthy()
  expect(screen.queryByText('Banco de dados')).toBeNull()
  expect(screen.queryByText('Documento PDF')).toBeNull()
  expect(screen.queryByText(/private.collection/)).toBeNull()
})

it('omits the source section for old replies without recorded sources', async () => {
  db.conversations[0].messages[0].sources = []
  await setup()
  expect(screen.queryByLabelText('Fontes consultadas')).toBeNull()
  expect(screen.queryByText(/Dados demonstrativos|Demo/)).toBeNull()
})
