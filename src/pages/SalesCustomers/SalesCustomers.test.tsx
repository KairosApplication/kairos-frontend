// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import SalesCustomers from './index'
import { mockDialogs } from '../../test/dialog'
import { downloadSalesCsv } from '../../services/salesViewService'
vi.mock('../../services/salesViewService', async (original) => ({ ...await original<typeof import('../../services/salesViewService')>(), downloadSalesCsv: vi.fn() }))
mockDialogs()
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('combina pagamento e busca, exportando somente as transações filtradas', async () => {
  render(<SalesCustomers />)
  await screen.findByRole('table')
  fireEvent.change(screen.getByRole('combobox', { name: 'Pagamento' }), { target: { value: 'Pix' } })
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'maria' } })
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: 'Exportar dados' }))
  expect(vi.mocked(downloadSalesCsv).mock.calls[0][0]).toHaveLength(4)
  expect(screen.getByText(/Download dos dados demonstrativos iniciado/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Clientes' }))
  expect(screen.getByRole('table').textContent).toContain('maria@kairos.example')
})

it('seleciona cliente e consulta histórico sem misturar perfis', async () => {
  render(<SalesCustomers />)
  const trigger = await screen.findByRole('button', { name: 'Selecionar cliente Carlos Lima' })
  fireEvent.click(trigger)
  const panel = screen.getByRole('region', { name: 'Cliente selecionado' })
  expect(within(panel).getByRole('heading', { name: 'Carlos Lima' })).toBeTruthy()
  const history = within(panel).getByRole('button', { name: 'Ver histórico' })
  history.focus(); fireEvent.click(history)
  const dialog = screen.getByRole('dialog', { name: 'Histórico de Carlos Lima' })
  expect(within(dialog).getByText('#00426 · 14:22')).toBeTruthy()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(document.activeElement).toBe(history)
})

it('troca a data e apresenta ausência de vendas fora do dia demonstrativo', async () => {
  render(<SalesCustomers />)
  await screen.findByRole('table')
  fireEvent.click(screen.getByRole('button', { name: '25/09/2026' }))
  fireEvent.change(screen.getByLabelText('Data das vendas'), { target: { value: '2026-09-24' } })
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
  expect(screen.getByText('Nenhuma venda encontrada')).toBeTruthy()
  expect(screen.getByText('Sem dados neste dia da demonstração')).toBeTruthy()
})
