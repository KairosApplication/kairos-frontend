// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  await screen.findByText('Não foi possível carregar a conversa.')
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await screen.findByText('Minha pergunta', { selector: 'p' })
  expect(fetch.mock.calls.filter(([url, options]) => String(url).endsWith('/me/chat/messages') && options?.method === 'POST')).toHaveLength(1)
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
