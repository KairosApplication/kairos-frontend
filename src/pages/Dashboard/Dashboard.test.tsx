// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
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
  api.fetch.mockImplementation((input, options) => String(input).endsWith('/store-map') && status !== 200 ? Promise.resolve(Response.json({}, { status })) : String(input).endsWith('/restockings/list') ? Promise.resolve(Response.json(analyticsRecords())) : api.respond(input, options))
  render(<TestSession><MemoryRouter>{insights ? <Insights /> : <Dashboard />}</MemoryRouter></TestSession>)
  return api
}
it('preserves sales and task indicators without substituting catalog or replenishment metrics', async () => {
  setup(); await screen.findByRole('heading', { name: 'Pulso da loja · hoje' })
  expect(screen.getByRole('heading', { name: 'Ritmo das vendas' })).toBeTruthy()
  expect(screen.getByText('Histórico de vendas indisponível.')).toBeTruthy()
  expect(screen.getByText('produtos em ruptura').previousSibling?.textContent).toBe('1')
  expect(screen.queryByText('3 produtos')).toBeNull()
  expect(screen.queryByText('34 unidades registradas nas gôndolas')).toBeNull()
  expect(screen.queryByText('R$ 48.760')).toBeNull()
})
it('offers retry when actual store indicators cannot be loaded', async () => {
  setup(false, 503); await screen.findByText('Não foi possível carregar o Dashboard.')
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Ver valores por dia' })).toBeNull()
})
it('Insights derives categories and does not invent sales growth', async () => {
  setup(true); await screen.findByRole('progressbar', { name: 'Bebidas: 2 produtos' })
  expect(screen.queryByText('Uma semana em crescimento.')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Onde estão as rupturas' })).toBeTruthy()
})

it('does not request replenishment history to populate sales or task statuses', async () => {
  const api = setup()
  await screen.findByRole('heading', { name: 'Pulso da loja · hoje' })
  expect(api.fetch.mock.calls.some(([url]) => String(url).endsWith('/restockings/list'))).toBe(false)
  expect(screen.queryByRole('button', { name: 'Ver valores por dia' })).toBeNull()
  expect(screen.getByLabelText('Concluídas: quantidade não informada')).toBeTruthy()
})
