// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import Alerts from './Alerts'
import TestSession from '../../test/TestSession'
import { installShelfApiMock } from '../../test/shelfApiMock'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('shows open alerts linked to the catalog and links the correct shelf', async () => {
  const api = installShelfApiMock()
  api.fetch.mockImplementation((input, options) => String(input).endsWith('/alerts/list') ? Promise.resolve(Response.json([
    { id: 1, shelfId: 101, productId: 1, description: 'Produto sem saldo', status: 'OPEN', stockoutDate: '2026-10-27' },
    { id: 2, shelfId: 999, productId: 1, description: 'Fora do catálogo', status: 'OPEN', stockoutDate: null },
    { id: 3, shelfId: 101, productId: 1, description: 'Já resolvido', status: 'RESOLVED', stockoutDate: null },
  ])) : api.respond(input, options))
  const onNavigate = vi.fn()
  render(<TestSession><MemoryRouter><Alerts onNavigate={onNavigate} /></MemoryRouter></TestSession>)
  const link = await screen.findByRole('link', { name: /Produto sem saldo/ })
  expect(link.getAttribute('href')).toBe('/mapa?gondola=101')
  expect(screen.queryByText('Fora do catálogo')).toBeNull()
  expect(screen.queryByText('Já resolvido')).toBeNull()
  fireEvent.click(link); expect(onNavigate).toHaveBeenCalledTimes(1)
})
it('does not replace a failed alert request with static notifications', async () => {
  const api = installShelfApiMock()
  api.fetch.mockImplementation((input, options) => String(input).endsWith('/alerts/list') ? Promise.resolve(Response.json({}, { status: 503 })) : api.respond(input, options))
  render(<TestSession><MemoryRouter><Alerts onNavigate={vi.fn()} /></MemoryRouter></TestSession>)
  await screen.findByRole('alert')
  expect(screen.queryByRole('link')).toBeNull()
})
