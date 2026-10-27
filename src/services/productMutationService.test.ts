import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { installShelfApiMock } from '../test/shelfApiMock'
import { createProduct, updateProduct, deleteProduct, getProductCategories, ProductMutationUncertainError, ProductValidationError } from './productMutationService'
import { ApiHttpError } from './apiData'

let api: ReturnType<typeof installShelfApiMock>
const valid = { name: ' Produto teste ', brand: ' Marca ', categoryId: '4', price: '12,34' }
beforeEach(() => { api = installShelfApiMock() })
afterEach(() => vi.unstubAllGlobals())
const writes = () => api.fetch.mock.calls.filter(([, options]) => ['POST', 'PATCH', 'DELETE'].includes(options?.method ?? ''))

it('loads categories even when the company has no products', async () => {
  api.db.products = []; api.db.links = []
  expect(await getProductCategories()).toContainEqual({ id: '4', name: 'Limpeza' })
})
it('sends normalized numeric data with CSRF only to company routes, never a company supplied by the client', async () => {
  const id = await createProduct(valid)
  expect(id).toBe('4')
  const [url, options] = writes()[0]
  expect(String(url)).toMatch(/\/products\/company\/registration$/)
  expect(JSON.parse(String(options?.body))).toEqual({ name: 'Produto teste', brand: 'Marca', categoryId: 4, price: 12.34 })
  expect(new Headers(options?.headers).get('X-CSRF-TOKEN')).toBe('fixture-csrf')
  await updateProduct(id!, { ...valid, price: '0' })
  expect(api.db.products.find(p => p.id === 4)?.price).toBe(0)
  await deleteProduct(id!)
  expect(api.db.products.some(p => p.id === 4)).toBe(false)
})
it.each(['', '-1', '1.234,56', '1e3', '2,999', '10000000000', 'Infinity'])('rejects invalid price %s before contacting the server', async price => {
  await expect(createProduct({ ...valid, price })).rejects.toBeInstanceOf(ProductValidationError)
  expect(api.fetch).not.toHaveBeenCalled()
})
it('accepts maximum precision and validates names, brands and category IDs', async () => {
  await createProduct({ ...valid, price: '9999999999,99' })
  expect(api.db.products.at(-1)?.price).toBe(9999999999.99)
  await expect(createProduct({ ...valid, name: ' ', brand: '', categoryId: '-1' })).rejects.toMatchObject({ fields: { name: expect.any(String), brand: expect.any(String), categoryId: expect.any(String) } })
})
it.each([400, 401, 403, 404, 409, 503])('handles HTTP %s without repeating or falling back to legacy mutations', async status => {
  api.fetch.mockImplementation(async (input, options) => options?.method === 'POST'
    ? Response.json(status === 400 ? { validationErrors: { price: 'invalid', unknown: 'ignore' } } : {}, { status }) : api.respond(input, options))
  await expect(createProduct(valid)).rejects.toBeInstanceOf(status === 400 || status === 409 ? ProductValidationError : status === 503 ? ProductMutationUncertainError : ApiHttpError)
  expect(writes()).toHaveLength(1)
  expect(String(writes()[0][0])).toMatch(/\/products\/company\/registration$/)
})
it('treats a lost response as uncertain and does not repeat the write', async () => {
  api.fetch.mockImplementation(async (input, options) => { if (options?.method === 'POST') throw new TypeError('network'); return api.respond(input, options) })
  await expect(createProduct(valid)).rejects.toBeInstanceOf(ProductMutationUncertainError)
  expect(writes()).toHaveLength(1)
})
it('trusts HTTP confirmation when the returned body is unreadable', async () => {
  api.fetch.mockImplementation(async (input, options) => options?.method === 'POST' ? new Response('invalid JSON', { status: 201 }) : api.respond(input, options))
  expect(await createProduct(valid)).toBeNull()
  expect(writes()).toHaveLength(1)
})
it('preserves deletion conflicts as conflicts and rejects invalid IDs locally', async () => {
  await expect(deleteProduct('1')).rejects.toMatchObject({ status: 409 })
  await expect(updateProduct('../1', valid)).rejects.toThrow('Identificador')
})
