// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Shelves from './index'
import TestSession from '../../test/TestSession'
import { installShelfApiMock } from '../../test/shelfApiMock'

let api: ReturnType<typeof installShelfApiMock>
const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeEach(() => {
  api = installShelfApiMock()
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
async function setup() {
  render(<TestSession><MemoryRouter><Shelves /></MemoryRouter></TestSession>)
  await screen.findByRole('table')
}
function fill(capacity = '80', aisleId = '12') {
  fireEvent.change(screen.getByRole('combobox', { name: 'Corredor' }), { target: { value: aisleId } })
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Capacidade máxima' }), { target: { value: capacity } })
}
const posts = () => api.fetch.mock.calls.filter(([, init]) => init?.method === 'POST')

it('creates, edits and deletes through HTTP, preserving generated ID and restoring focus', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Nova gôndola' }))
  expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Corredor' }))
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  const row = await screen.findByRole('rowheader', { name: '109' })
  expect(within(row.closest('tr')!).getByText('Sem produtos')).toBeTruthy()
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Nova gôndola' })))
  fireEvent.click(screen.getByRole('button', { name: 'Editar gôndola 109' }))
  expect(screen.getByRole('textbox', { name: 'ID da gôndola' }).hasAttribute('readonly')).toBe(true)
  fill('200', '21')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  await screen.findByRole('rowheader', { name: '109' })
  expect(api.db.shelves.find(s => s.id === 109)).toMatchObject({ aisleId: 21, maximumCapacity: 200 })
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Nova gôndola' })))
  const trigger = screen.getByRole('button', { name: 'Excluir gôndola 109' })
  trigger.focus(); fireEvent.click(trigger)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(document.activeElement).toBe(trigger))
  fireEvent.click(trigger)
  fireEvent.click(screen.getByRole('button', { name: 'Excluir gôndola' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  await screen.findByRole('table')
  expect(api.db.shelves).toHaveLength(8)
  expect(screen.queryByRole('rowheader', { name: '109' })).toBeNull()
}, 15000)

it('keeps invalid fields and server validation inside the form with visible focus', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Nova gôndola' }))
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  expect(await screen.findByText('Informe uma capacidade inteira entre 1 e 2147483647.')).toBeTruthy()
  expect(posts()).toHaveLength(0)
  fill('80')
  api.fetch.mockImplementation(async (input, init) => init?.method === 'POST'
    ? Response.json({ validationErrors: { maximumCapacity: 'private server detail' } }, { status: 400 }) : api.respond(input, init))
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  expect(await screen.findByText('Informe uma capacidade inteira positiva.')).toBeTruthy()
  expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('80')
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('spinbutton')))
  expect(screen.getByRole('dialog')).toBeTruthy()
})

it('blocks deletion of known product links', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Excluir gôndola 101' }))
  expect(screen.getByRole('button', { name: 'Excluir gôndola' }).hasAttribute('disabled')).toBe(true)
  expect(api.fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
})

it('prevents double submission and closing while waiting for HTTP acknowledgement', async () => {
  await setup()
  let finish: (response: Response) => void = () => {}
  const pending = new Promise<Response>(resolve => { finish = resolve })
  api.fetch.mockImplementation(async (input, init) => init?.method === 'POST' ? pending : api.respond(input, init))
  fireEvent.click(screen.getByRole('button', { name: 'Nova gôndola' })); fill()
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  await waitFor(() => expect(posts()).toHaveLength(1))
  const dialog = screen.getByRole('dialog')
  fireEvent.submit(dialog.querySelector('form')!)
  fireEvent.keyDown(dialog, { key: 'Escape' })
  fireEvent.click(screen.getByRole('button', { name: 'Fechar janela' }))
  expect(screen.getByRole('dialog')).toBeTruthy()
  expect(posts()).toHaveLength(1)
  finish(new Response(null, { status: 409 }))
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('keeps confirmed success when refreshing fails, and retries only reads', async () => {
  await setup()
  let written = false
  api.fetch.mockImplementation(async (input, init) => {
    if (written && String(input).endsWith('/store-map')) return new Response(null, { status: 503 })
    const result = await api.respond(input, init)
    if (init?.method === 'POST') written = true
    return result
  })
  fireEvent.click(screen.getByRole('button', { name: 'Nova gôndola' })); fill()
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  expect(await screen.findByText('Gôndola 109 criada com sucesso.')).toBeTruthy()
  await screen.findByRole('alert')
  expect(screen.queryByRole('dialog')).toBeNull()
  api.fetch.mockImplementation(api.respond)
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await screen.findByRole('table')
  expect(posts()).toHaveLength(1)
  expect(api.db.shelves).toHaveLength(9)
})

it('requires a fresh read after a lost acknowledgement without creating a duplicate', async () => {
  await setup()
  api.fetch.mockImplementation(async (input, init) => {
    const response = await api.respond(input, init)
    if (init?.method === 'POST') throw new TypeError('Connection lost after commit')
    return response
  })
  fireEvent.click(screen.getByRole('button', { name: 'Nova gôndola' })); fill()
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  expect(await screen.findByText(/Não foi possível confirmar a operação/)).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('button', { name: 'Nova gôndola' }).hasAttribute('disabled')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await screen.findByRole('table')
  expect(posts()).toHaveLength(1)
  expect(api.db.shelves).toHaveLength(9)
})
