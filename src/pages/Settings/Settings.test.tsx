// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import Settings from './index'
import { mockDialogs } from '../../test/dialog'
mockDialogs()
afterEach(cleanup)

it('altera preferências e salva somente o cenário demonstrativo', async () => {
  render(<Settings />)
  const name = await screen.findByRole('textbox', { name: 'Nome da loja' })
  fireEvent.change(name, { target: { value: 'Mercado de Teste' } })
  const toggle = screen.getByRole('switch', { name: 'Alertas de ruptura' })
  fireEvent.click(toggle)
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  fireEvent.change(screen.getByRole('combobox', { name: 'Fuso horário' }), { target: { value: 'America/Manaus' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(screen.getByRole('status').textContent).toContain('a loja real não foi alterada')
  expect(name.getAttribute('value')).toBe('Mercado de Teste')
})

it('oferece prévia do tema e navegação por seções', async () => {
  render(<Settings />)
  await screen.findByRole('textbox', { name: 'Nome da loja' })
  fireEvent.click(screen.getByRole('button', { name: 'Escuro' }))
  expect(screen.getByRole('main').classList.contains('settings--dark')).toBe(true)
  expect(screen.getByText('Prévia do tema nesta página.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Claro' }))
  expect(screen.getByRole('main').classList.contains('settings--dark')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Notificações' }))
  expect(screen.getByRole('button', { name: 'Notificações' }).getAttribute('aria-current')).toBe('location')
})

it('consulta acessos fictícios e encerra somente o exemplo, preservando a sessão real', async () => {
  render(<Settings />)
  const trigger = await screen.findByRole('button', { name: 'Gerenciar acessos' })
  trigger.focus(); fireEvent.click(trigger)
  expect(screen.getByRole('dialog', { name: 'Gerenciar acessos' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Encerrar exemplo' }))
  expect(screen.queryByText('Celular de exemplo')).toBeNull()
  expect(screen.getByRole('status').textContent).toContain('Nenhum acesso real foi encerrado')
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(document.activeElement).toBe(trigger)
})
