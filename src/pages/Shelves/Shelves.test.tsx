// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Shelves from './index'
import StoreMap from '../StoreMap'
import TestSession from '../../test/TestSession'
import { installShelfApiMock } from '../../test/shelfApiMock'

let api: ReturnType<typeof installShelfApiMock>
beforeEach(() => { api = installShelfApiMock() })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function renderPage() {
  render(<TestSession><MemoryRouter initialEntries={['/gondolas']}><Routes>
    <Route path="/gondolas" element={<Shelves />} /><Route path="/mapa" element={<StoreMap />} />
  </Routes></MemoryRouter></TestSession>)
}
async function setup() { renderPage(); await screen.findByRole('table') }

it('calculates real indicators and paginates without repeating records', async () => {
  await setup()
  expect(within(screen.getByRole('region', { name: 'Gôndolas cadastradas' })).getByText('8')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Com saldo zero' })).getByText('1')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Capacidade cadastrada' })).getByText('760')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Com saldo' })).getByText('2')).toBeTruthy()
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(7)
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 7–8 de 8 gôndolas')
  expect(screen.queryByRole('rowheader', { name: '101' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Próxima' }).hasAttribute('disabled')).toBe(true)
})

it('combines accent-insensitive product search, sector and actual quantity status', async () => {
  await setup()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' AGUA ' } })
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–2 de 2 gôndolas')
  fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: '2' } })
  expect(screen.getByText('Nenhuma gôndola encontrada')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  fireEvent.change(screen.getByRole('combobox', { name: 'Situação' }), { target: { value: 'stockout' } })
  expect(screen.getByRole('rowheader', { name: '101' })).toBeTruthy()
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
})

it('opens the real shelf identity on the map', async () => {
  await setup()
  fireEvent.click(screen.getByRole('link', { name: 'Ver gôndola 103 no mapa' }))
  expect(await screen.findByRole('region', { name: 'Gôndola 103' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Gôndola 103 Sem produtos' }).getAttribute('aria-pressed')).toBe('true')
})

it('offers a new read after an API failure without falling back to the prototype', async () => {
  api.fetch.mockImplementationOnce(async () => new Response(null, { status: 503 }))
  renderPage()
  expect(screen.getByText('Carregando gôndolas…')).toBeTruthy()
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.queryByRole('table')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('table')).toBeTruthy()
})

it('handles an empty installation and prevents creation without an aisle', async () => {
  api.db.shelves = []; api.db.links = []; api.db.aisles = []
  renderPage()
  expect(await screen.findByText('Nenhuma gôndola encontrada')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Nova gôndola' }).hasAttribute('disabled')).toBe(true)
  expect(screen.getByText(/Cadastre um corredor antes/)).toBeTruthy()
})
