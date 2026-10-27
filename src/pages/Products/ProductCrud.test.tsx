// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Products from './index'
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
  render(<TestSession><MemoryRouter><Products /></MemoryRouter></TestSession>)
  await screen.findByRole('region', { name: 'Resumo do catálogo da empresa' })
}
async function newProduct() {
  fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }))
  await waitFor(() => expect(screen.getByLabelText('Nome do produto *').hasAttribute('disabled')).toBe(false))
  fireEvent.change(screen.getByLabelText('Nome do produto *'), { target: { value: 'Produto novo' } })
  fireEvent.change(screen.getByLabelText('Marca *'), { target: { value: 'Marca nova' } })
  fireEvent.change(screen.getByLabelText('Categoria *'), { target: { value: '4' } })
  fireEvent.change(screen.getByLabelText('Preço (R$) *'), { target: { value: '12,34' } })
}
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }))
const writes = () => api.fetch.mock.calls.filter(([, options]) => ['POST', 'PATCH', 'DELETE'].includes(options?.method ?? ''))

it('creates the first product, edits it and deletes it after confirmation using real response IDs', async () => {
  api.db.products = []; api.db.links = []
  await setup(); await newProduct(); submit()
  await screen.findByRole('rowheader', { name: 'Produto novo' })
  expect(api.db.products[0]).toMatchObject({ id: 1, price: 12.34, category: { id: 4 } })
  fireEvent.click(screen.getByRole('button', { name: 'Editar produto 1' }))
  await screen.findByRole('option', { name: 'Limpeza' })
  fireEvent.change(screen.getByLabelText('Nome do produto *'), { target: { value: 'Produto editado' } })
  fireEvent.change(screen.getByLabelText('Preço (R$) *'), { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  await screen.findByRole('rowheader', { name: 'Produto editado' })
  expect(api.db.products[0].price).toBe(0)
  fireEvent.click(screen.getByRole('button', { name: 'Excluir produto 1' }))
  const dialog = screen.getByRole('dialog', { name: 'Excluir produto 1?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir produto' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(api.db.products).toEqual([])
  expect(writes()).toHaveLength(3)
}, 15000)

it('blocks deletion of linked products without sending DELETE', async () => {
  await setup(); fireEvent.click(screen.getByRole('button', { name: 'Excluir produto 1' }))
  const dialog = screen.getByRole('dialog', { name: 'Excluir produto 1?' })
  expect(within(dialog).getByRole('button', { name: 'Excluir produto' }).hasAttribute('disabled')).toBe(true)
  expect(dialog.textContent).toContain('Remova ou transfira')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  expect(writes()).toHaveLength(0)
})

it('associates validation errors and preserves the draft on duplicate name', async () => {
  await setup(); await newProduct()
  fireEvent.change(screen.getByLabelText('Preço (R$) *'), { target: { value: '1,234' } }); submit()
  await waitFor(() => expect(screen.getByLabelText('Preço (R$) *').getAttribute('aria-invalid')).toBe('true'))
  expect(writes()).toHaveLength(0)
  fireEvent.change(screen.getByLabelText('Preço (R$) *'), { target: { value: '1,23' } })
  fireEvent.change(screen.getByLabelText('Nome do produto *'), { target: { value: 'Coca-Cola 2 L' } }); submit()
  await screen.findByText('Já existe um produto com esse nome.')
  expect((screen.getByLabelText('Marca *') as HTMLInputElement).value).toBe('Marca nova')
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Nome do produto *')))
})

it('allows retrying categories without a mutation and disables saving without categories', async () => {
  let fail = true
  api.fetch.mockImplementation((input, options) => String(input).endsWith('/categories/list') && fail ? Promise.resolve(Response.json({}, { status: 503 })) : api.respond(input, options))
  await setup(); fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }))
  await screen.findByText('Não foi possível carregar as categorias.')
  expect(screen.getByRole('button', { name: 'Criar produto' }).hasAttribute('disabled')).toBe(true)
  fail = false; api.db.categories = []
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await screen.findByText('Nenhuma categoria disponível')
  expect(writes()).toHaveLength(0)
})

it('closes an uncertain mutation and reconciles through GET without repeating POST', async () => {
  let failed = false
  api.fetch.mockImplementation(async (input, options) => {
    const response = await api.respond(input, options)
    if (options?.method === 'POST' && !failed) { failed = true; throw new TypeError('lost response') }
    return response
  })
  await setup(); await newProduct(); submit()
  await screen.findByText('Não foi possível confirmar a operação. Atualize a listagem antes de tentar novamente.')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('button', { name: 'Novo produto' }).hasAttribute('disabled')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await screen.findByRole('rowheader', { name: 'Produto novo' })
  expect(writes()).toHaveLength(1)
})

it('keeps an acknowledged save confirmed even if reloading the catalog fails', async () => {
  let saved = false
  api.fetch.mockImplementation(async (input, options) => {
    if (saved && String(input).endsWith('/store-map')) return Response.json({}, { status: 503 })
    const response = await api.respond(input, options)
    if (options?.method === 'POST') saved = true
    return response
  })
  await setup(); await newProduct(); submit()
  await screen.findByText('Produto 4 criado com sucesso.')
  await screen.findByText('Não foi possível carregar os produtos.')
  expect(screen.queryByRole('dialog')).toBeNull()
  saved = false; fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await screen.findByRole('rowheader', { name: 'Produto novo' })
  expect(writes()).toHaveLength(1)
})
