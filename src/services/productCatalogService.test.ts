import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { installShelfApiMock } from '../test/shelfApiMock'
import { addProductCatalogCases } from '../test/shelvesApiFixture'
import { getProductCatalog, productAvailability } from './productCatalogService'
import { ApiHttpError } from './apiData'

let api: ReturnType<typeof installShelfApiMock>
beforeEach(() => { api = installShelfApiMock(); addProductCatalogCases(api.db) })
afterEach(() => { vi.unstubAllGlobals() })

it('loads the real company contract in one request and joins all placements without inventing identifiers', async () => {
  const catalog = await getProductCatalog()
  expect(api.fetch).toHaveBeenCalledTimes(1)
  expect(String(api.fetch.mock.calls[0][0])).toMatch(/\/api\/v1\/store-map$/)
  expect(catalog.products).toHaveLength(7)
  expect(catalog.categories).toHaveLength(3)
  expect(catalog.products.find(p => p.id === '2')).toMatchObject({ brand: 'Fonte Clara', price: 2.99, shelfUnits: 14,
    placements: [{ shelfId: '101', units: 4 }, { shelfId: '102', units: 10 }] })
  expect(catalog.products[0]).not.toHaveProperty('sku')
  expect(catalog.products[0]).not.toHaveProperty('warehouseUnits')
})

it('distinguishes positive, mixed, zero and unknown quantities; accepts a zero price', async () => {
  const { products } = await getProductCatalog()
  expect(products.map(p => [p.id, productAvailability(p)])).toEqual([
    ['1', 'zero'], ['2', 'stocked'], ['3', 'stocked'], ['4', 'unlinked'], ['5', 'partial'], ['6', 'stocked'], ['7', 'unlinked'],
  ])
  expect(products.find(p => p.id === '4')).toMatchObject({ price: 0, shelfUnits: null, placements: [] })
  expect(products.find(p => p.id === '5')).toMatchObject({ shelfUnits: 2 })
})

it.each(['category', 'brand', 'price', 'duplicate-category', 'broken-link'])('rejects invalid %s instead of showing demonstration data', async field => {
  if (field === 'category') api.db.products[0].category.id = 0
  if (field === 'brand') api.db.products[0].brand = ' '
  if (field === 'price') api.db.products[0].price = -1
  if (field === 'duplicate-category') api.db.products[1].category.category = 'Different category with the same ID'
  if (field === 'broken-link') api.db.links[0].shelfId = 999
  await expect(getProductCatalog()).rejects.toThrow()
})

it.each([401, 403, 503])('preserves HTTP %s and never falls back to a global list', async status => {
  api.fetch.mockResolvedValueOnce(new Response(null, { status }))
  await expect(getProductCatalog()).rejects.toBeInstanceOf(ApiHttpError)
  expect(api.fetch).toHaveBeenCalledTimes(1)
})

it('returns empty collections for an empty company', async () => {
  api.db.products = []; api.db.links = []; api.db.shelves = []; api.db.aisles = []; api.db.sectors = []
  expect(await getProductCatalog()).toMatchObject({ products: [], categories: [] })
})

it('propagates cancellation before starting a request', async () => {
  const controller = new AbortController(); controller.abort()
  await expect(getProductCatalog(controller.signal)).rejects.toThrow()
  expect(api.fetch).not.toHaveBeenCalled()
})
