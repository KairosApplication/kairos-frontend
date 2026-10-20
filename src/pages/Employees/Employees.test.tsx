// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import Employees from './index'
import { mockDialogs } from '../../test/dialog'
mockDialogs()
afterEach(cleanup)

it('pagina e combina busca, função e status sem alterar o total da equipe', async () => {
  render(<Employees />)
  await screen.findByRole('heading', { name: 'João Silva' })
  expect(screen.getByText('de 18 funcionários cadastrados')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Próxima →' }))
  expect(screen.queryByRole('heading', { name: 'João Silva' })).toBeNull()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'JOAO' } })
  expect(screen.getByRole('heading', { name: 'João Silva' })).toBeTruthy()
  fireEvent.change(screen.getByRole('combobox', { name: 'Função' }), { target: { value: 'Caixa' } })
  expect(screen.getByText('Nenhum funcionário encontrado')).toBeTruthy()
})

it('abre perfil e cria somente cadastro demonstrativo', async () => {
  render(<Employees />)
  const trigger = await screen.findByRole('button', { name: 'Ver perfil de João Silva' })
  trigger.focus(); fireEvent.click(trigger)
  expect(screen.getByText('joao@kairos.example')).toBeTruthy()
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(document.activeElement).toBe(trigger)
  fireEvent.click(screen.getByRole('button', { name: 'Novo funcionário' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome completo' }), { target: { value: 'Pessoa de Teste' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), { target: { value: 'nova@kairos.example' } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar à demonstração' }))
  expect(screen.getByRole('heading', { name: 'Pessoa de Teste' })).toBeTruthy()
  expect(screen.getByText(/Nenhuma conta ou acesso real foi criado/)).toBeTruthy()
})
