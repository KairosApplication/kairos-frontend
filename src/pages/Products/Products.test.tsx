// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Products from './index'
import StoreMap from '../StoreMap'
import TestSession from '../../test/TestSession'
import { installShelfApiMock } from '../../test/shelfApiMock'
import { addProductCatalogCases } from '../../test/shelvesApiFixture'

let api: ReturnType<typeof installShelfApiMock>
const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeEach(() => {
  api = installShelfApiMock(); addProductCatalogCases(api.db)
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(() => {
  cleanup(); vi.unstubAllGlobals()
  if (showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})
function renderPage() {
  render(<TestSession><MemoryRouter initialEntries={['/produtos']}><Routes>
    <Route path="/produtos" element={<Products />} /><Route path="/mapa" element={<StoreMap />} />
  </Routes></MemoryRouter></TestSession>)
}
async function setup() { renderPage(); await screen.findByRole('table') }

it('derives indicators from actual quantities and paginates without losing limits', async () => {
  await setup()
  const summary = screen.getByRole('region', { name: 'Resumo do catálogo da empresa' })
  expect(Array.from(summary.querySelectorAll('dd'), item => item.textContent)).toEqual(['7', '3', '2', '1', '1'])
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(6)
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 6–7 de 7 produtos')
  expect(screen.getByRole('button', { name: 'Próxima' }).hasAttribute('disabled')).toBe(true)
  expect(screen.queryByRole('rowheader', { name: 'Coca-Cola 2 L' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–5 de 7 produtos')
})

it('combines category, quantity and accent-insensitive search', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: /^Bebidas/ }))
  fireEvent.change(screen.getByRole('combobox', { name: 'Saldo nas gôndolas' }), { target: { value: 'stocked' } })
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' AGUA ' } })
  expect(screen.getByRole('rowheader', { name: 'Água mineral 500 ml' })).toBeTruthy()
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–1 de 1 produto')
  fireEvent.click(screen.getByRole('button', { name: /^Higiene/ }))
  expect(screen.getByText('Nenhum produto encontrado')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–5 de 7 produtos')
})

it.each([[' fonte clara ', 'Água mineral 500 ml'], ['7', 'Café tradicional 500 g']])('searches real brand or ID %s', async (query, name) => {
  await setup()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: query } })
  expect(screen.getByRole('rowheader', { name })).toBeTruthy()
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
})

it('finds zero-quantity placements even when another shelf has a positive quantity', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Ver pendências' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–2 de 2 produtos')
  expect(screen.getByRole('rowheader', { name: 'Coca-Cola 2 L' })).toBeTruthy()
  const row = screen.getByRole('rowheader', { name: 'Sabonete 90 g' }).closest('tr')!
  expect(within(row).getByText('Saldo parcial')).toBeTruthy()
  expect(within(row).getByText('2 un.')).toBeTruthy()
  expect(screen.queryByRole('rowheader', { name: 'Escova dental' })).toBeNull()
})

it('shows all real placements, restores focus and selects the chosen ID on the map', async () => {
  await setup()
  const trigger = screen.getByRole('button', { name: 'Ver detalhes de Água mineral 500 ml' })
  trigger.focus(); fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Água mineral 500 ml' })
  expect(within(dialog).getByText('14 un.')).toBeTruthy()
  expect(within(dialog).getByRole('link', { name: 'Ver gôndola 101 no mapa' }).getAttribute('href')).toBe('/mapa?gondola=101')
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(document.activeElement).toBe(trigger)
  fireEvent.click(trigger)
  fireEvent.click(screen.getByRole('link', { name: 'Ver gôndola 102 no mapa' }))
  expect(await screen.findByRole('region', { name: 'Gôndola 102' })).toBeTruthy()
  expect(document.body.style.overflow).toBe('')
})

it('does not turn absent placements into zero stock or fabricate warehouse values', async () => {
  await setup()
  const row = screen.getByRole('rowheader', { name: 'Escova dental' }).closest('tr')!
  expect(within(row).getByText('Não informado')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Escova dental' }))
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).queryByRole('link')).toBeNull()
  expect(within(dialog).getByText(/não possui vínculos/)).toBeTruthy()
  expect(within(dialog).getByText('R$ 0,00', { exact: false })).toBeTruthy()
})

it('retries a failed API read without showing demo products', async () => {
  api.fetch.mockResolvedValueOnce(new Response(null, { status: 503 }))
  renderPage()
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.queryByRole('table')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('table')).toBeTruthy()
})

it('shows an empty company without rendering a fabricated catalog', async () => {
  api.db.products = []; api.db.links = []
  renderPage()
  expect(await screen.findByText('Nenhum produto encontrado')).toBeTruthy()
  expect(screen.getByText('0 produtos encontrados').getAttribute('role')).toBe('status')
})
