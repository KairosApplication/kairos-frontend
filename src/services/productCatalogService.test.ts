import { beforeEach, expect, it, vi } from 'vitest'

let products: typeof import('./productCatalogService')
let shelves: typeof import('./shelfCatalogService')
beforeEach(async () => {
  vi.resetModules()
  products = await import('./productCatalogService')
  shelves = await import('./shelfCatalogService')
})

it('prioriza inatividade e calcula ruptura, estoque baixo e limite disponível', async () => {
  const product = (await products.getProductCatalog()).products[0]
  expect(products.productAvailability({ ...product, active: false, shelfUnits: 0 })).toBe('inactive')
  expect(products.productAvailability({ ...product, shelfUnits: 0 })).toBe('stockout')
  expect(products.productAvailability({ ...product, shelfUnits: product.minimumShelfUnits - 1 })).toBe('low')
  expect(products.productAvailability({ ...product, shelfUnits: product.minimumShelfUnits })).toBe('available')
})

it('retorna amostra coerente e cópias isoladas, sem fabricar o total do protótipo', async () => {
  const data = await products.getProductCatalog()
  expect(data.products).toHaveLength(12)
  expect(data.products.filter((product) => product.active)).toHaveLength(10)
  expect(data.products.filter((product) => products.productAvailability(product) === 'stockout')).toHaveLength(2)
  expect(data.products.filter((product) => products.productAvailability(product) === 'low')).toHaveLength(3)
  data.products.length = 0
  data.categories.length = 0
  expect((await products.getProductCatalog()).products).toHaveLength(12)
  expect((await products.getProductCatalog()).categories).toHaveLength(4)
})

it('acompanha o código renomeado de uma gôndola sem alterar o estoque do produto', async () => {
  await shelves.updateShelf('A12', { code: 'A98', sectorId: 'A', location: 'Entrada' })
  const data = await products.getProductCatalog()
  expect(data.shelfCodes.A12).toBe('A98')
  expect(data.products[0]).toMatchObject({ sourceShelfId: 'A12', shelfUnits: 0, warehouseUnits: 84, price: 9.49 })
})
