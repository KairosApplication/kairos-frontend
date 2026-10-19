// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import KairosAssistant from './index'
import * as service from '../../services/assistantViewService'
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('seleciona e pesquisa conversas preservando mensagens separadas', async () => {
  render(<MemoryRouter><KairosAssistant /></MemoryRouter>)
  const conversation = await screen.findByRole('button', { name: /Vendas da semana/ })
  fireEvent.click(conversation)
  expect(within(screen.getByRole('log')).getByText(/receita da semana foi de R\$ 313.760/)).toBeTruthy()
  expect(within(screen.getByRole('log')).queryByText(/Comece pela gôndola A12/)).toBeNull()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'inexistente' } })
  expect(screen.getByText('Nenhuma conversa encontrada.')).toBeTruthy()
})

it('cria conversa e responde localmente sem consultar um modelo de IA', async () => {
  render(<MemoryRouter><KairosAssistant /></MemoryRouter>)
  await screen.findByRole('log')
  fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }))
  expect(screen.getByText('Como podemos cuidar da loja hoje?')).toBeTruthy()
  fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }), { target: { value: 'Quero ver as vendas' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await within(screen.getByRole('log')).findByText(/Mercearia representa 38%/)).toBeTruthy()
  expect(within(screen.getByRole('log')).getByText(/sem consulta a um modelo de IA/)).toBeTruthy()
  expect(screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }).getAttribute('value')).toBe('')
})

it('preserva o texto quando a resposta demonstrativa falha e permite nova tentativa', async () => {
  vi.spyOn(service, 'getDemonstrativeReply').mockRejectedValueOnce(new Error('Unavailable demo'))
  render(<MemoryRouter><KairosAssistant /></MemoryRouter>)
  await screen.findByRole('log')
  fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }))
  const input = screen.getByRole('textbox', { name: 'Mensagem para KAIROS IA' })
  fireEvent.change(input, { target: { value: 'Como está o estoque?' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(input.getAttribute('value')).toBe('Como está o estoque?')
  expect(within(screen.getByRole('log')).queryByText('Como está o estoque?')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
  expect(await within(screen.getByRole('log')).findByText('Comece pela gôndola A12, no setor de Bebidas.')).toBeTruthy()
})
