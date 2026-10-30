// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it } from 'vitest'
import type { AnswerSource } from '../../types/assistantView'
import AssistantMessageBubble from './AssistantMessageBubble'

afterEach(cleanup)

it('mostra apenas categorias públicas sem duplicar nem exibir metadados internos', () => {
  render(<MemoryRouter><AssistantMessageBubble message={{ id: 'a', role: 'assistant', text: 'Resposta',
    sources: ['pdf', 'database', 'memory', 'database', 'private.users', 'mongodb.collection'] as AnswerSource[] }} /></MemoryRouter>)
  expect(screen.getByLabelText('Fontes consultadas')).toBeTruthy()
  expect(screen.getByText('Documento PDF')).toBeTruthy()
  expect(screen.getAllByText('Banco de dados')).toHaveLength(1)
  expect(screen.getByText('Memória')).toBeTruthy()
  expect(screen.queryByText(/private|mongodb/)).toBeNull()
})

it.each([undefined, [], ['private.collection'] as unknown as AnswerSource[]])('omite toda a seção quando não há fontes válidas: %j', (sources) => {
  render(<MemoryRouter><AssistantMessageBubble message={{ id: 'a', role: 'assistant', text: 'Olá', sources }} /></MemoryRouter>)
  expect(screen.queryByLabelText('Fontes consultadas')).toBeNull()
})

it('não atribui fontes a mensagens do usuário ou respostas demonstrativas', () => {
  render(<MemoryRouter><AssistantMessageBubble message={{ id: 'u', role: 'user', text: 'Pergunta', sources: ['database'] }} />
    <AssistantMessageBubble demo message={{ id: 'a', role: 'assistant', text: 'Demonstração', sources: ['pdf'] }} /></MemoryRouter>)
  expect(screen.queryByLabelText('Fontes consultadas')).toBeNull()
})
