// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Products from './index'
import StoreMap from '../StoreMap'
import { getProductCatalog } from '../../services/productCatalogService'

vi.mock('../../services/productCatalogService', async (original) => ({ ...await original<typeof import('../../services/productCatalogService')>(), getProductCatalog: vi.fn() }))
const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeEach(async () => {
  const real = await vi.importActual<typeof import('../../services/productCatalogService')>('../../services/productCatalogService')
  vi.mocked(getProductCatalog).mockReset().mockResolvedValue(await real.getProductCatalog())
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(() => {
  cleanup()
  if (showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

function renderPage() {
  render(<MemoryRouter initialEntries={['/produtos']}><Routes>
    <Route path="/produtos" element={<Products />} /><Route path="/mapa" element={<StoreMap />} />
  </Routes></MemoryRouter>)
}
async function setup() { renderPage(); await screen.findByRole('table') }

it('calcula totais da amostra e pagina em cinco registros sem perder os limites', async () => {
  await setup()
  const summary = screen.getByRole('region', { name: 'Resumo do catálogo demonstrativo' })
  expect(summary.querySelectorAll('dd').length).toBe(5)
  expect(Array.from(summary.querySelectorAll('dd'), (item) => item.textContent)).toEqual(['12', '10', '2', '3', '2'])
  expect(screen.getByText(/^Amostra demonstrativa · 12 produtos/)).toBeTruthy()
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(6)
  expect(screen.getByRole('button', { name: 'Anterior' }).hasAttribute('disabled')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 6–10 de 12 produtos')
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3)
  expect(screen.getByRole('status').textContent).toBe('Exibindo 11–12 de 12 produtos')
  expect(screen.getByRole('button', { name: 'Próxima' }).hasAttribute('disabled')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 6–10 de 12 produtos')
})

it('combina categoria, disponibilidade e busca sem acentos e retorna à primeira página', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  fireEvent.click(screen.getByRole('button', { name: /^Bebidas/ }))
  fireEvent.change(screen.getByRole('combobox', { name: 'Disponibilidade' }), { target: { value: 'stockout' } })
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' AGUA ' } })
  expect(screen.getByRole('rowheader', { name: 'Água mineral 500 ml' })).toBeTruthy()
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–1 de 1 produto')
  fireEvent.click(screen.getByRole('button', { name: /^Limpeza/ }))
  expect(screen.getByText('Nenhum produto encontrado')).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Paginação dos produtos' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–5 de 12 produtos')
})

it.each([
  [' mer-018 ', 'Arroz branco 5 kg'],
  ['7891000000005', 'Detergente neutro 500 ml'],
])('busca pelo identificador %s', async (query, name) => {
  await setup()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: query } })
  expect(screen.getByRole('rowheader', { name })).toBeTruthy()
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
})

it('filtra pendências de estoque sem incluir inativos e limpa a categoria anterior', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: /^Limpeza/ }))
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'inexistente' } })
  fireEvent.click(screen.getByRole('button', { name: 'Ver pendências' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–5 de 5 produtos')
  expect(screen.getByRole('rowheader', { name: 'Coca-Cola 2 L' })).toBeTruthy()
  expect(screen.queryByRole('rowheader', { name: 'Café tradicional 500 g' })).toBeNull()
  fireEvent.change(screen.getByRole('combobox', { name: 'Disponibilidade' }), { target: { value: 'inactive' } })
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–2 de 2 produtos')
})

it('abre detalhes e restaura foco sem associar produtos demonstrativos ao mapa real', async () => {
  await setup()
  const trigger = screen.getByRole('button', { name: 'Ver detalhes de Coca-Cola 2 L' })
  trigger.focus()
  fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Coca-Cola 2 L' })
  expect(within(dialog).getByText('7891000000001')).toBeTruthy()
  expect(within(dialog).getByText('84 un.')).toBeTruthy()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
  fireEvent.click(trigger)
  expect(screen.queryByRole('link', { name: /Ver gôndola/ })).toBeNull()
})

it('mostra carregamento e permite repetir a consulta após falha', async () => {
  vi.mocked(getProductCatalog).mockRejectedValueOnce(new Error('Unavailable demo'))
  renderPage()
  expect(screen.getByText('Carregando produtos…')).toBeTruthy()
  expect(await screen.findByRole('alert')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('table')).toBeTruthy()
})
