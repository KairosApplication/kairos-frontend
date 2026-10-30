// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TestSession from '../../test/TestSession'
import { mockDialogs } from '../../test/dialog'
import { installShelfApiMock } from '../../test/shelfApiMock'
import { handleRestocking, makeRestockingFixture } from '../../test/restockingApiFixture'
import Restocking from './index'
mockDialogs()
let api: ReturnType<typeof installShelfApiMock>
let db: ReturnType<typeof makeRestockingFixture>
beforeEach(() => {
  api = installShelfApiMock(); db = makeRestockingFixture()
  api.fetch.mockImplementation(async (input, options) => {
    const path = new URL(String(input)).pathname.replace('/api/v1', '')
    const result = handleRestocking(db, options?.method ?? 'GET', path, options?.body ? JSON.parse(String(options.body)) : undefined)
    if (!result) return api.respond(input, options)
    return result.status === 204 ? new Response(null, { status: 204 }) : Response.json(result.json, { status: result.status })
  })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
async function setup() { render(<TestSession><Restocking /></TestSession>); await screen.findByRole('region', { name: 'Registros' }) }
function firstRecord() { return within(screen.getByRole('region', { name: 'Registros' })).getAllByRole('button')[0] }
it('shows real records, filters date and does not invent pending tasks', async () => {
  await setup()
  expect(api.fetch.mock.calls.some(([url]) => /\/(employees|inventories)\/list$/.test(String(url)))).toBe(false)
  expect(screen.queryByText('Pendentes')).toBeNull()
  fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-10-26' } })
  expect(within(screen.getByRole('region', { name: 'Registros' })).queryByText('REP-1')).toBeNull()
  expect(within(screen.getByRole('region', { name: 'Registros' })).getByText('REP-2')).toBeTruthy()
})
it('creates, edits and deletes records with numeric IDs and quantity validation', async () => {
  await setup(); fireEvent.click(screen.getByRole('button', { name: 'Criar reposição' }))
  await screen.findByLabelText('Produto *')
  for (const [label, value] of [['Produto *', '1'], ['Gôndola *', '101'], ['Responsável *', '1'], ['Depósito *', '1']]) fireEvent.change(screen.getByLabelText(label), { target: { value } })
  fireEvent.change(screen.getByLabelText('Avarias *'), { target: { value: '2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar reposição' }))
  expect(screen.getByLabelText('Avarias *').getAttribute('aria-invalid')).toBe('true')
  fireEvent.change(screen.getByLabelText('Quantidade *'), { target: { value: '12' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar reposição' }))
  await waitFor(() => expect(db.records).toHaveLength(3))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  fireEvent.click(firstRecord()); fireEvent.click(screen.getByRole('button', { name: 'Editar registro' }))
  await screen.findByLabelText('Quantidade *')
  fireEvent.change(screen.getByLabelText('Quantidade *'), { target: { value: '14' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar reposição' }))
  await waitFor(() => expect(db.records.find(r => r.id === 3)?.restockedQuantity).toBe(14))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  fireEvent.click(firstRecord()); fireEvent.click(screen.getByRole('button', { name: 'Excluir registro' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))
  await waitFor(() => expect(db.records).toHaveLength(2))
})
it('shows permissions without substituting demonstration data', async () => {
  api.fetch.mockResolvedValue(Response.json({}, { status: 403 }))
  render(<TestSession><Restocking /></TestSession>); await screen.findByRole('alert')
  expect(screen.queryByText('REP-1')).toBeNull()
})
