import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { installShelfApiMock } from '../test/shelfApiMock'
import { createShelf, deleteShelf, getShelfCatalog, ShelfMutationUncertainError, ShelfValidationError, updateShelf } from './shelfCatalogService'
import { getStoreMap } from './storeMapService'
import { ApiHttpError } from './apiData'

let api: ReturnType<typeof installShelfApiMock>
beforeEach(() => { api = installShelfApiMock() })
afterEach(() => { vi.unstubAllGlobals() })

it('joins the five real contracts, preserves IDs and distinguishes zero from missing product links', async () => {
  const catalog = await getShelfCatalog()
  expect(api.fetch).toHaveBeenCalledTimes(1)
  expect(String(api.fetch.mock.calls[0][0])).toMatch(/\/api\/v1\/store-map$/)
  expect(catalog.shelves).toHaveLength(8)
  expect(catalog.aisles.filter(a => a.sectorId === '1')).toHaveLength(2)
  expect(catalog.shelves[0]).toMatchObject({ id: '101', aisleId: '11', productCount: 2, status: 'stockout', stockoutCount: 1, maximumCapacity: 100 })
  expect(catalog.shelves[1]).toMatchObject({ id: '102', status: 'stocked', mapRow: 2 })
  expect(catalog.shelves[2]).toMatchObject({ id: '103', status: 'empty', mapRow: 1, location: 'Corredor 2' })
  expect(catalog.shelves[0].products[1]).toEqual({ id: '2', name: 'Água mineral 500 ml', shelfUnits: 4 })
  expect(catalog.shelves.reduce((sum, s) => sum + s.maximumCapacity, 0)).toBe(760)
})

it('sends only numeric aisle and capacity, then reads the same saved identity on the map', async () => {
  const id = await createShelf({ aisleId: '12', maximumCapacity: '80' })
  expect(id).toBe('109')
  const post = api.fetch.mock.calls.find(([, init]) => init?.method === 'POST')!
  expect(JSON.parse(String(post[1]?.body))).toEqual({ aisleId: 12, maximumCapacity: 80 })
  expect(new Headers(post[1]?.headers).get('X-CSRF-TOKEN')).toBe('fixture-csrf')
  await updateShelf(id!, { aisleId: '21', maximumCapacity: '90' })
  expect((await getStoreMap()).shelves.find(s => s.id === id)).toMatchObject({ aisleId: '21', location: 'Corredor 3', maximumCapacity: 90 })
  await deleteShelf(id!)
  expect((await getShelfCatalog()).shelves.some(s => s.id === id)).toBe(false)
})

it.each(['', '0', '-1', '1.5', '2147483648', '1e2'])('rejects invalid capacity %s before any request', async maximumCapacity => {
  await expect(createShelf({ aisleId: '11', maximumCapacity })).rejects.toBeInstanceOf(ShelfValidationError)
  expect(api.fetch).not.toHaveBeenCalled()
})

it.each(['A12', '../1', '0'])('rejects an invalid mutation ID %s', async id => {
  await expect(deleteShelf(id)).rejects.toThrow('Identificador')
  expect(api.fetch).not.toHaveBeenCalled()
})

it.each(['reference', 'duplicate', 'position', 'quantity', 'unsafe-id'])('rejects inconsistent API data (%s), without substituting mock data', async kind => {
  if (kind === 'reference') api.db.links[0].productId = 999
  if (kind === 'duplicate') api.db.shelves.push({ ...api.db.shelves[0] })
  if (kind === 'position') api.db.shelves[0].aislePosition = 99
  if (kind === 'quantity') api.db.links[0].productQuantity = -1
  if (kind === 'unsafe-id') api.db.shelves[0].id = Number.MAX_SAFE_INTEGER + 1
  await expect(getShelfCatalog()).rejects.toThrow()
})

it.each([401, 403, 409])('preserves HTTP %s instead of exposing server messages', async status => {
  api.fetch.mockImplementation(async (input, init) => init?.method === 'POST' ? Response.json({ message: 'private internals' }, { status }) : api.respond(input, init))
  await expect(createShelf({ aisleId: '11', maximumCapacity: '1' })).rejects.toMatchObject({ status })
  await expect(createShelf({ aisleId: '11', maximumCapacity: '1' })).rejects.not.toThrow('private internals')
})

it('maps Bean Validation fields to accessible form errors', async () => {
  api.fetch.mockImplementation(async (input, init) => init?.method === 'POST'
    ? Response.json({ validationErrors: { aisleId: 'server detail', maximumCapacity: 'server detail' } }, { status: 400 }) : api.respond(input, init))
  await expect(createShelf({ aisleId: '11', maximumCapacity: '1' })).rejects.toMatchObject({ fields: { aisleId: expect.any(String), maximumCapacity: expect.any(String) } })
})

it('accepts a confirmed 201 even when its body is malformed; never repeats the write', async () => {
  api.fetch.mockImplementation(async (input, init) => {
    const response = await api.respond(input, init)
    return init?.method === 'POST' ? new Response('invalid-json', { status: 201 }) : response
  })
  await expect(createShelf({ aisleId: '11', maximumCapacity: '1' })).resolves.toBeNull()
  expect(api.db.shelves).toHaveLength(9)
  expect(api.fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
})

it.each(['network', 'server'])('requires a fresh read after an uncertain %s response, without automatic replay', async kind => {
  api.fetch.mockImplementation(async (input, init) => {
    if (init?.method !== 'POST') return api.respond(input, init)
    if (kind === 'network') { await api.respond(input, init); throw new TypeError('Lost acknowledgement') }
    return new Response(null, { status: 503 })
  })
  await expect(createShelf({ aisleId: '11', maximumCapacity: '1' })).rejects.toBeInstanceOf(ShelfMutationUncertainError)
  expect(api.fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
  expect((await getShelfCatalog()).shelves).toHaveLength(kind === 'network' ? 9 : 8)
})

it('reports a resource authorization failure from any list', async () => {
  api.fetch.mockImplementation(async (input, init) => String(input).endsWith('/store-map') ? new Response(null, { status: 403 }) : api.respond(input, init))
  await expect(getShelfCatalog()).rejects.toBeInstanceOf(ApiHttpError)
})
