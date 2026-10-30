// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TestSession from '../../test/TestSession'
import { mockDialogs } from '../../test/dialog'
import { handleSales } from '../../test/salesApiFixture'
import { salesCsv } from '../../services/salesApiService'
import SalesCustomers from './index'
mockDialogs()
let fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>
beforeEach(() => {
  fetch = vi.fn<typeof globalThis.fetch>(async input => { const result = handleSales('GET', new URL(String(input)).pathname.replace('/api/v1', '')); return Response.json(result?.json ?? {}, { status: result?.status ?? 404 }) })
  vi.stubGlobal('fetch', fetch)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
async function setup() { render(<TestSession><SalesCustomers /></TestSession>); await screen.findByRole('table') }
it('searches real customers and queries recommendations without inventing purchase histories', async () => {
  await setup()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'maria' } })
  expect(screen.getByRole('button', { name: 'Maria Souza' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Carlos Lima' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Maria Souza' }))
  fireEvent.click(screen.getByRole('button', { name: 'Ver recomendações' }))
  await screen.findByText('Coca-Cola 2 L')
  expect(screen.queryByText('12 compras')).toBeNull()
})
it('validates IDs and consults the total returned for the selected purchase', async () => {
  await setup(); fireEvent.click(screen.getByRole('button', { name: 'Vendas' }))
  fireEvent.change(screen.getByLabelText('ID da compra *'), { target: { value: '-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Consultar compra' }))
  expect(screen.getByLabelText('ID da compra *').getAttribute('aria-invalid')).toBe('true')
  fireEvent.change(screen.getByLabelText('ID da compra *'), { target: { value: '428' } })
  fireEvent.click(screen.getByRole('button', { name: 'Consultar compra' }))
  await screen.findByText('Total: R$ 126,40', { exact: false, normalizer: v => v.replace(/\u00a0/g, ' ') })
  expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/purchases/428/total'))).toBe(true)
})
it('shows API permission errors instead of demonstration records', async () => {
  fetch.mockResolvedValue(Response.json({}, { status: 403 }))
  render(<TestSession><SalesCustomers /></TestSession>); await screen.findByRole('alert')
  expect(screen.queryByRole('table')).toBeNull()
})
it('quotes CSV safely and prevents formulas in names from executing in spreadsheets', () => {
  expect(salesCsv([['=1+1', 'Nome "teste"', 'Normal']])).toContain('"\'=1+1";"Nome ""teste""";"Normal"')
})
