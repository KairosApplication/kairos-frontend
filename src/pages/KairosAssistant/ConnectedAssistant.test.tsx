// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as service from '../../services/chatbotService'
import type { AssistantConversation } from '../../types/assistantView'
import KairosAssistant from './index'

const first = '000000000000000000000001'
const second = '000000000000000000000002'
const conversations: AssistantConversation[] = [
  { id: first, title: 'Ajuda', when: 'Hoje', messages: [] },
  { id: second, title: 'Preferências', when: 'Ontem', messages: [] },
]
beforeEach(() => {
  vi.spyOn(service, 'chatbotConfigured').mockReturnValue(true)
  vi.spyOn(service, 'listConversations').mockResolvedValue({ items: conversations, hasNext: false })
  vi.spyOn(service, 'readConversation').mockImplementation(async (id) => ({ ...conversations.find((item) => item.id === id)!,
    messages: [{ id: `${id}-a`, role: 'assistant', text: id === first ? 'Explicação do manual' : 'Preferência salva',
      sources: id === first ? ['pdf'] : ['memory'] }] }))
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('mantém fontes por resposta ao enviar perguntas e reabrir outra conversa', async () => {
  const send = vi.spyOn(service, 'sendMessage').mockResolvedValue({ id: 'new', role: 'assistant', text: 'Estoque consultado', sources: ['database'] })
  render(<MemoryRouter><KairosAssistant /></MemoryRouter>)
  await screen.findByText('Explicação do manual')
  expect(screen.getByText('Documento PDF')).toBeTruthy()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Consulte o estoque' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  await screen.findByText('Estoque consultado')
  expect(send).toHaveBeenCalledWith('Consulte o estoque', first, expect.any(AbortSignal))
  const bubble = screen.getByText('Estoque consultado').closest('article')!
  expect(within(bubble).getByText('Banco de dados')).toBeTruthy()
  expect(within(bubble).queryByText('Documento PDF')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /Preferências/ }))
  await screen.findByText('Preferência salva')
  expect(screen.getByText('Memória')).toBeTruthy()
  expect(screen.queryByText('Banco de dados')).toBeNull()
  expect(screen.queryByText('Documento PDF')).toBeNull()
})

it('não mostra fonte para uma resposta sem consultas nem usa a demonstração como fallback', async () => {
  vi.spyOn(service, 'sendMessage').mockResolvedValue({ id: 'a', role: 'assistant', text: 'Qual período você deseja?', sources: [] })
  render(<MemoryRouter><KairosAssistant /></MemoryRouter>)
  await screen.findByText('Explicação do manual')
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Vendas' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  const text = await screen.findByText('Qual período você deseja?')
  expect(within(text.closest('article')!).queryByLabelText('Fontes consultadas')).toBeNull()
  expect(screen.queryByText(/Demo/)).toBeNull()
  expect(screen.queryByText(/Dados demonstrativos/)).toBeNull()
})
