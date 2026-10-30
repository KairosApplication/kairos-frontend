// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it } from 'vitest'
import Dashboard from './index'
import Insights from '../Insights'
import TestSession from '../../test/TestSession'
import { installShelfApiMock } from '../../test/shelfApiMock'
import { mockDialogs } from '../../test/dialog'
import { analyticsRecords } from '../../test/analyticsApiFixture'
import { vi } from 'vitest'
mockDialogs()
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function setup(insights = false, status = 200) {
  const api = installShelfApiMock()
  api.fetch.mockImplementation((input, options) => String(input).endsWith('/restockings/list') ? Promise.resolve(Response.json(status === 200 ? analyticsRecords() : {}, { status })) : api.respond(input, options))
  render(<TestSession><MemoryRouter>{insights ? <Insights /> : <Dashboard />}</MemoryRouter></TestSession>)
}
it('shows actual catalog totals and exposes daily quantities as a table', async () => {
  setup(); await screen.findByText('3 produtos')
  expect(screen.getByText('34 unidades registradas nas gôndolas')).toBeTruthy()
  fireEvent.click(await screen.findByRole('button', { name: 'Ver valores por dia' }))
  expect(screen.getByRole('table', { name: 'Unidades registradas sem avarias' })).toBeTruthy()
  expect(screen.queryByText('R$ 48.760')).toBeNull()
})
it('keeps the catalog visible when the replenishment source is unavailable', async () => {
  setup(false, 503); await screen.findByText('3 produtos')
  await screen.findByText('Reposições indisponíveis.')
  expect(screen.queryByRole('button', { name: 'Ver valores por dia' })).toBeNull()
})
it('Insights derives categories and does not invent sales growth', async () => {
  setup(true); await screen.findByRole('progressbar', { name: 'Bebidas: 2 produtos' })
  expect(screen.queryByText('Uma semana em crescimento.')).toBeNull()
  expect(screen.getByText(/Receita, tempo médio/)).toBeTruthy()
})

it('renders the catalog while the heavy history request is still pending', async () => {
  const api = installShelfApiMock()
  let finish!: (response: Response) => void
  api.fetch.mockImplementation((input, options) => String(input).endsWith('/restockings/list') ? new Promise(resolve => { finish = resolve }) : api.respond(input, options))
  render(<TestSession><MemoryRouter><Dashboard /></MemoryRouter></TestSession>)
  await screen.findByText('3 produtos')
  expect(screen.getByText('Carregando indicadores de reposição…')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Ver valores por dia' })).toBeNull()
  finish(Response.json({}, { status: 503 }))
  await screen.findByText('Reposições indisponíveis.')
  expect(screen.getByText('3 produtos')).toBeTruthy()
})
