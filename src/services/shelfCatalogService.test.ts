import { beforeEach, expect, it, vi } from 'vitest'

let service: typeof import('./shelfCatalogService')
let map: typeof import('./storeMapService')
beforeEach(async () => {
  vi.resetModules()
  service = await import('./shelfCatalogService')
  map = await import('./storeMapService')
})

it('normaliza códigos, impede duplicatas e não aplica entrada inválida', async () => {
  await expect(service.createShelf({ code: ' a12 ', sectorId: 'A', location: 'Entrada' })).rejects.toMatchObject({ fields: { code: expect.any(String) } })
  await expect(service.createShelf({ code: '???', sectorId: 'Z', location: ' ' })).rejects.toMatchObject({ fields: {
    code: expect.any(String), sectorId: expect.any(String), location: expect.any(String),
  } })
  expect((await service.getShelfCatalog()).shelves).toHaveLength(24)
  const next = await service.createShelf({ code: ' a99 ', sectorId: 'A', location: ' Entrada ' })
  expect(next.shelves[0]).toMatchObject({ id: 'A99', location: 'Entrada', productCount: 0, status: 'empty' })
  const duplicate = { code: 'a99', sectorId: 'B', location: 'Outro corredor' }
  await expect(service.createShelf(duplicate)).rejects.toBeInstanceOf(service.ShelfValidationError)
  expect((await service.getShelfCatalog()).shelves).toHaveLength(25)
})

it('compartilha criação, edição e exclusão com o mapa sem sobrepor posições', async () => {
  await service.createShelf({ code: 'A99', sectorId: 'A', location: 'Entrada' })
  let data = await map.getStoreMap()
  expect(data.shelves.find((shelf) => shelf.id === 'A99')).toMatchObject({ row: 7, status: 'empty', location: 'Entrada' })
  await service.updateShelf('A99', { code: 'B99', sectorId: 'B', location: 'Fundo da loja' })
  data = await map.getStoreMap()
  expect(data.shelves.some((shelf) => shelf.id === 'A99')).toBe(false)
  expect(data.shelves.find((shelf) => shelf.id === 'B99')).toMatchObject({ sectorId: 'B', row: 7, location: 'Fundo da loja' })
  await service.deleteShelf('B99')
  expect((await map.getStoreMap()).shelves).toHaveLength(24)
  expect((await service.getShelfCatalog()).shelves).toHaveLength(24)
})

it('preserva produtos, rupturas e posição ao renomear e protege gôndolas ocupadas', async () => {
  await service.updateShelf('A12', { code: 'A98', sectorId: 'A', location: 'Entrada' })
  const shelf = (await map.getStoreMap()).shelves.find((item) => item.id === 'A98')
  expect(shelf).toMatchObject({ row: 2, status: 'stockout', stockoutCount: 2 })
  expect(shelf?.restockingProducts.map((product) => product.name)).toEqual(['Coca-Cola 2 L', 'Água mineral 500 ml'])
  await expect(service.deleteShelf('A98')).rejects.toThrow('Remova ou transfira os produtos')
  await expect(service.updateShelf('A98', { code: 'B11', sectorId: 'A', location: 'Entrada' })).rejects.toBeInstanceOf(service.ShelfValidationError)
  expect((await service.getShelfCatalog()).shelves).toHaveLength(24)
})

it('retorna cópias isoladas e trata registros removidos sem ressuscitá-los', async () => {
  const copy = await service.getShelfCatalog()
  copy.shelves.length = 0
  expect((await service.getShelfCatalog()).shelves).toHaveLength(24)
  await service.createShelf({ code: 'A99', sectorId: 'A', location: 'Entrada' })
  await service.deleteShelf('A99')
  await expect(service.deleteShelf('A99')).rejects.toThrow('não está mais disponível')
  await expect(service.updateShelf('A99', { code: 'A99', sectorId: 'A', location: 'Entrada' })).rejects.toThrow('não está mais disponível')
})
