import type { AisleDto, ProductShelfDto, ProductSummaryDto, SectorDto, ShelfDto } from '../types/shelfApi'

export type ShelfApiFixture = { sectors: SectorDto[]; aisles: AisleDto[]; shelves: ShelfDto[]; products: ProductSummaryDto[]; links: ProductShelfDto[] }
export function makeShelfApiFixture(): ShelfApiFixture {
  return {
    sectors: [{ id: 1, name: 'Bebidas' }, { id: 2, name: 'Mercearia' }],
    aisles: [{ id: 11, sectorId: 1, sectorName: 'Bebidas', position: 1 }, { id: 12, sectorId: 1, sectorName: 'Bebidas', position: 2 }, { id: 21, sectorId: 2, sectorName: 'Mercearia', position: 3 }],
    shelves: [
      { id: 101, aisleId: 11, aislePosition: 1, maximumCapacity: 100 }, { id: 102, aisleId: 11, aislePosition: 1, maximumCapacity: 200 },
      { id: 103, aisleId: 12, aislePosition: 2, maximumCapacity: 100 }, { id: 104, aisleId: 21, aislePosition: 3, maximumCapacity: 100 },
      { id: 105, aisleId: 21, aislePosition: 3, maximumCapacity: 50 }, { id: 106, aisleId: 21, aislePosition: 3, maximumCapacity: 60 },
      { id: 107, aisleId: 12, aislePosition: 2, maximumCapacity: 70 }, { id: 108, aisleId: 21, aislePosition: 3, maximumCapacity: 80 },
    ],
    products: [{ id: 1, name: 'Coca-Cola 2 L' }, { id: 2, name: 'Água mineral 500 ml' }, { id: 3, name: 'Arroz branco 5 kg' }],
    links: [{ id: 1, shelfId: 101, productId: 1, productQuantity: 0 }, { id: 2, shelfId: 101, productId: 2, productQuantity: 4 }, { id: 3, shelfId: 102, productId: 2, productQuantity: 10 }, { id: 4, shelfId: 104, productId: 3, productQuantity: 20 }],
  }
}
// Simulador de HTTP exclusivo dos testes; nunca é importado pelos services de produção.
export function handleShelfFixture(db: ShelfApiFixture, method: string, path: string, body?: unknown): { status: number; json?: unknown } | null {
  if (method === 'GET' && path === '/store-map') return { status: 200, json: { sectors: db.sectors, aisles: db.aisles, shelves: db.shelves, products: db.products, productShelves: db.links } }
  const lists: Record<string, unknown> = { '/sectors/list': db.sectors, '/aisles/list': db.aisles, '/shelves/list': db.shelves, '/products/list': db.products, '/product-shelves/list': db.links }
  if (method === 'GET' && path in lists) return { status: 200, json: lists[path] }
  const id = Number(path.split('/').at(-1))
  if (method === 'DELETE' && path.startsWith('/shelves/delete/')) {
    if (db.links.some(l => l.shelfId === id)) return { status: 409, json: {} }
    if (!db.shelves.some(s => s.id === id)) return { status: 404, json: {} }
    db.shelves = db.shelves.filter(s => s.id !== id)
    return { status: 204 }
  }
  if ((method === 'POST' && path === '/shelves/registration') || (method === 'PATCH' && path.startsWith('/shelves/update/'))) {
    if (typeof body !== 'object' || body === null || !('aisleId' in body) || !('maximumCapacity' in body)) return { status: 400, json: {} }
    const aisle = db.aisles.find(a => a.id === body.aisleId)
    if (!aisle || typeof body.maximumCapacity !== 'number' || !Number.isInteger(body.maximumCapacity) || body.maximumCapacity <= 0) return { status: 400, json: { validationErrors: { maximumCapacity: 'Invalid value' } } }
    const previous = db.shelves.find(s => s.id === id)
    if (method === 'PATCH' && !previous) return { status: 404, json: {} }
    const shelf = { id: method === 'POST' ? Math.max(0, ...db.shelves.map(s => s.id)) + 1 : id, aisleId: aisle.id, aislePosition: aisle.position, maximumCapacity: body.maximumCapacity }
    if (method === 'POST') db.shelves.push(shelf)
    else db.shelves = db.shelves.map(s => s.id === id ? shelf : s)
    return { status: method === 'POST' ? 201 : 200, json: shelf }
  }
  return null
}
