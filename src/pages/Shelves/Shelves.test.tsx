// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Shelves from './index'
import StoreMap from '../StoreMap'
import { shelfCatalogDemo } from '../../mocks/shelfCatalog'
import { getShelfCatalog } from '../../services/shelfCatalogService'

vi.mock('../../services/shelfCatalogService', () => ({ getShelfCatalog: vi.fn() }))
beforeEach(() => { vi.mocked(getShelfCatalog).mockReset().mockResolvedValue(structuredClone(shelfCatalogDemo)) })
afterEach(cleanup)

function renderPage() {
  render(<MemoryRouter initialEntries={['/gondolas']}><Routes>
    <Route path="/gondolas" element={<Shelves />} />
    <Route path="/mapa" element={<StoreMap />} />
  </Routes></MemoryRouter>)
}

async function setup() { renderPage(); await screen.findByRole('table') }

it('mostra os indicadores da loja e seis gôndolas por página', async () => {
  await setup()
  expect(within(screen.getByRole('region', { name: 'Gôndolas cadastradas' })).getByText('24')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Com rupturas' })).getByText('3')).toBeTruthy()
  expect(screen.getByText('8 produtos sem exposição')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Estoque baixo' })).getByText('4')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Abastecidas' })).getByText('17')).toBeTruthy()
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(7)
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–6 de 24 gôndolas')
  expect(screen.getByRole('button', { name: 'Anterior' }).hasAttribute('disabled')).toBe(true)
  expect(screen.getByText(/^Dados demonstrativos ·/)).toBeTruthy()
})

it('pagina sem repetir linhas e limita os botões nas extremidades', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 7–12 de 24 gôndolas')
  expect(screen.queryByRole('rowheader', { name: 'A12' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 19–24 de 24 gôndolas')
  expect(screen.getByRole('button', { name: 'Próxima' }).hasAttribute('disabled')).toBe(true)
  expect(screen.getByLabelText('Página 4 de 4')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 13–18 de 24 gôndolas')
})

it('combina busca, setor e situação e volta à primeira página ao filtrar', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '  AGUA  ' } })
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–1 de 1 gôndola')
  expect(screen.getByRole('rowheader', { name: 'A12' })).toBeTruthy()
  fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: 'B' } })
  expect(screen.getByText('Nenhuma gôndola encontrada')).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Paginação das gôndolas' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  expect(screen.getByRole('status').textContent).toBe('Exibindo 1–6 de 24 gôndolas')
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'mercearia' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: 'B' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Situação' }), { target: { value: 'stockout' } })
  expect(screen.getByRole('rowheader', { name: 'B12' })).toBeTruthy()
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
  expect(within(screen.getByRole('region', { name: 'Gôndolas cadastradas' })).getByText('24')).toBeTruthy()
})

it('leva a gôndola escolhida para o mapa já selecionada', async () => {
  await setup()
  fireEvent.click(screen.getByRole('link', { name: 'Ver gôndola C31 no mapa' }))
  expect(await screen.findByRole('region', { name: 'Gôndola C31' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Gôndola C31 Estoque baixo' }).getAttribute('aria-pressed')).toBe('true')
})

it('trata carregamento e falha da fonte com nova tentativa', async () => {
  vi.mocked(getShelfCatalog).mockRejectedValueOnce(new Error('Unavailable demo source'))
  renderPage()
  expect(screen.getByText('Carregando gôndolas…')).toBeTruthy()
  expect(await screen.findByRole('alert')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('table')).toBeTruthy()
})
