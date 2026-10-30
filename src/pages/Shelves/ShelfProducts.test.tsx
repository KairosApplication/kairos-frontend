// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TestSession from '../../test/TestSession'
import { mockDialogs } from '../../test/dialog'
import { installShelfApiMock } from '../../test/shelfApiMock'
import ShelfProducts from './ShelfProducts'
mockDialogs()
let api: ReturnType<typeof installShelfApiMock>
beforeEach(() => {
  api = installShelfApiMock()
  api.fetch.mockImplementation(async (input, options) => {
    const path = new URL(String(input)).pathname
    const method = options?.method
    if (path.includes('/product-shelves/') && ['POST', 'PATCH', 'DELETE'].includes(method ?? '')) {
      const id = Number(path.split('/').at(-1))
      if (method === 'DELETE') { api.db.links = api.db.links.filter(l => l.id !== id); return new Response(null, { status: 204 }) }
      const body = JSON.parse(String(options?.body)) as { productId: number; shelfId: number; productQuantity: number }
      if (method === 'POST') api.db.links.push({ ...body, id: 9 })
      else api.db.links = api.db.links.map(l => l.id === id ? { ...body, id } : l)
      return Response.json({ id: method === 'POST' ? 9 : id }, { status: method === 'POST' ? 201 : 200 })
    }
    return api.respond(input, options)
  })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const writes = () => api.fetch.mock.calls.filter(([, options]) => ['POST', 'PATCH', 'DELETE'].includes(options?.method ?? ''))
async function setup() { render(<TestSession><ShelfProducts shelfId={101} onClose={vi.fn()} /></TestSession>); await screen.findByText('Coca-Cola 2 L', { selector: 'strong' }) }

it('creates, updates and removes a link using its server ID and refreshes quantities', async () => {
  await setup()
  fireEvent.change(screen.getByLabelText('Produto *'), { target: { value: '3' } })
  fireEvent.change(screen.getByLabelText('Quantidade na gôndola *'), { target: { value: '12' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar vínculo' }))
  await screen.findByText('12 unidades')
  fireEvent.click(screen.getByRole('button', { name: 'Editar quantidade de Arroz branco 5 kg' }))
  fireEvent.change(screen.getByLabelText('Quantidade na gôndola *'), { target: { value: '15' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar vínculo' }))
  await screen.findByText('15 unidades')
  fireEvent.click(screen.getByRole('button', { name: 'Remover vínculo 9' }))
  expect(writes()).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }))
  await waitFor(() => expect(screen.queryByText('Arroz branco 5 kg', { selector: 'strong' })).toBeNull())
  expect(writes()).toHaveLength(3)
})
it.each(['0', '-1', '1.5', '2147483648'])('rejects quantity %s without sending a write', async quantity => {
  await setup()
  fireEvent.change(screen.getByLabelText('Produto *'), { target: { value: '3' } })
  fireEvent.change(screen.getByLabelText('Quantidade na gôndola *'), { target: { value: quantity } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar vínculo' }))
  await screen.findByRole('alert')
  expect(writes()).toHaveLength(0)
})
it('blocks uncertain mutations until a fresh read, without repeating POST', async () => {
  api.fetch.mockImplementation(async (input, options) => { if (options?.method === 'POST') throw new TypeError('network'); return api.respond(input, options) })
  await setup()
  fireEvent.change(screen.getByLabelText('Produto *'), { target: { value: '3' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar vínculo' }))
  await screen.findByText('Não foi possível carregar os vínculos.')
  expect(screen.queryByRole('button', { name: 'Salvar vínculo' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await screen.findByRole('button', { name: 'Salvar vínculo' })
  expect(writes()).toHaveLength(1)
})
