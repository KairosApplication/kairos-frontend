// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Dashboard from './index'
import { dashboardDemo } from './demo'
import { downloadDashboardReport } from './report'

vi.mock('./report', async (original) => ({ ...await original<typeof import('./report')>(), downloadDashboardReport: vi.fn() }))

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeEach(() => {
  vi.resetAllMocks()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(() => {
  cleanup()
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

function setup() {
  render(<MemoryRouter initialEntries={['/dashboard']}><Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/reposicoes" element={<h1>Destino reposições</h1>} />
    <Route path="/mapa" element={<h1>Destino mapa</h1>} />
    <Route path="/produtos" element={<h1>Destino produtos</h1>} />
  </Routes></MemoryRouter>)
}

it('exibe a origem demonstrativa, o resumo e o total coerente das tarefas', () => {
  setup()
  expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeTruthy()
  expect(screen.getByText('Dados demonstrativos')).toBeTruthy()
  expect(screen.getByText(/428 vendas/)).toBeTruthy()
  const tasks = screen.getByRole('region', { name: 'Reposição em movimento' })
  expect(within(tasks).getByText('56 tarefas hoje')).toBeTruthy()
  expect(within(tasks).getByRole('img').getAttribute('aria-label')).toContain('36 concluídas')
})

it('fornece alternativa em tabela para todos os pontos do gráfico', () => {
  setup()
  expect(screen.getByRole('img', { name: /Receita demonstrativa dos últimos sete dias/ })).toBeTruthy()
  const summary = screen.getByText('Ver valores por dia')
  const details = summary.closest('details')
  expect(details?.open).toBe(false)
  fireEvent.click(summary)
  expect(details?.open).toBe(true)
  const table = screen.getByRole('table', { name: 'Receita diária demonstrativa' })
  expect(within(table).getAllByRole('row')).toHaveLength(8)
  expect(within(table).getByRole('rowheader', { name: /25\/09\/2026/ })).toBeTruthy()
})

it('aciona o download local e informa sucesso ou falha sem consultar a API', () => {
  setup()
  const button = screen.getByRole('button', { name: 'Exportar relatório' })
  fireEvent.click(button)
  expect(downloadDashboardReport).toHaveBeenCalledWith(dashboardDemo)
  expect(screen.getByRole('status').textContent).toContain('Download do relatório demonstrativo iniciado')
  vi.mocked(downloadDashboardReport).mockImplementationOnce(() => { throw new Error('Unavailable download') })
  fireEvent.click(button)
  expect(screen.getByRole('alert').textContent).toContain('Não foi possível preparar')
})

it('abre as sugestões, restaura foco ao fechar e navega para a central', () => {
  setup()
  const trigger = screen.getByRole('button', { name: 'Explorar oportunidades' })
  trigger.focus()
  fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Prepare a loja para o próximo pico' })
  expect(within(dialog).getByText(/Sugestões ilustrativas/)).toBeTruthy()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
  fireEvent.click(trigger)
  fireEvent.click(screen.getByRole('link', { name: 'Ver central de reposição' }))
  expect(screen.getByRole('heading', { name: 'Destino reposições' })).toBeTruthy()
  expect(document.body.style.overflow).toBe('')
})

it.each([
  ['Gôndola A12', 'Destino mapa'],
  ['Definir responsáveis', 'Destino reposições'],
  ['Leite integral 1 L', 'Destino produtos'],
])('direciona a prioridade %s ao módulo correto', (name, destination) => {
  setup()
  fireEvent.click(screen.getByRole('link', { name: new RegExp(name) }))
  expect(screen.getByRole('heading', { name: destination })).toBeTruthy()
})
