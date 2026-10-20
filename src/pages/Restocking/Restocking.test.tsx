// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import Restocking from './index'
import { mockDialogs } from '../../test/dialog'
mockDialogs()
afterEach(cleanup)

it('combina filtros e permite consultar uma reposição com retorno de foco', async () => {
  render(<Restocking />)
  const pending = await screen.findByRole('region', { name: 'Pendentes' })
  expect(within(pending).getAllByRole('button', { name: /^Ver reposição/ })).toHaveLength(3)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'agua' } })
  expect(screen.getAllByRole('button', { name: /^Ver reposição/ })).toHaveLength(1)
  const trigger = screen.getByRole('button', { name: /Ver reposição REP-055/ })
  trigger.focus(); fireEvent.click(trigger)
  expect(screen.getByRole('dialog', { name: 'Reposição REP-055' })).toBeTruthy()
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(document.activeElement).toBe(trigger)
  fireEvent.change(screen.getByRole('combobox', { name: 'Responsável' }), { target: { value: 'João Silva' } })
  expect(screen.queryByRole('button', { name: /^Ver reposição/ })).toBeNull()
})

it('cria somente uma tarefa demonstrativa e aplica o filtro de data', async () => {
  render(<Restocking />)
  await screen.findByRole('region', { name: 'Pendentes' })
  fireEvent.click(screen.getByRole('button', { name: 'Criar reposição' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Produto' }), { target: { value: 'Leite integral' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Gôndola' }), { target: { value: 'B11' } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar à demonstração' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText(/Reposição adicionada à demonstração/)).toBeTruthy()
  expect(screen.getByRole('button', { name: /Ver reposição DEMO-1/ })).toBeTruthy()
  fireEvent.change(screen.getByRole('combobox', { name: 'Data' }), { target: { value: 'yesterday' } })
  expect(screen.queryByRole('button', { name: /^Ver reposição/ })).toBeNull()
})
