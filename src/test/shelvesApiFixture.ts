import type { AisleDto, ProductShelfDto, SectorDto, ShelfDto } from '../types/shelfApi'
import type { ProductDto } from '../types/storeCatalogApi'

export type ShelfApiFixture = { categories: ProductDto['category'][]; sectors: SectorDto[]; aisles: AisleDto[]; shelves: ShelfDto[]; products: ProductDto[]; links: ProductShelfDto[] }
export function makeShelfApiFixture(): ShelfApiFixture {
  return {
    categories: [{ id: 1, category: 'Bebidas' }, { id: 2, category: 'Mercearia' }, { id: 3, category: 'Higiene' }, { id: 4, category: 'Limpeza' }],
    sectors: [{ id: 1, name: 'Bebidas' }, { id: 2, name: 'Mercearia' }],
    aisles: [{ id: 11, sectorId: 1, sectorName: 'Bebidas', position: 1 }, { id: 12, sectorId: 1, sectorName: 'Bebidas', position: 2 }, { id: 21, sectorId: 2, sectorName: 'Mercearia', position: 3 }],
    shelves: [
      { id: 101, aisleId: 11, aislePosition: 1, maximumCapacity: 100 }, { id: 102, aisleId: 11, aislePosition: 1, maximumCapacity: 200 },
      { id: 103, aisleId: 12, aislePosition: 2, maximumCapacity: 100 }, { id: 104, aisleId: 21, aislePosition: 3, maximumCapacity: 100 },
      { id: 105, aisleId: 21, aislePosition: 3, maximumCapacity: 50 }, { id: 106, aisleId: 21, aislePosition: 3, maximumCapacity: 60 },
      { id: 107, aisleId: 12, aislePosition: 2, maximumCapacity: 70 }, { id: 108, aisleId: 21, aislePosition: 3, maximumCapacity: 80 },
    ],
    products: [
      { id: 1, name: 'Coca-Cola 2 L', brand: 'Coca-Cola', price: 9.49, category: { id: 1, category: 'Bebidas' } },
      { id: 2, name: 'Água mineral 500 ml', brand: 'Fonte Clara', price: 2.99, category: { id: 1, category: 'Bebidas' } },
      { id: 3, name: 'Arroz branco 5 kg', brand: 'Boa Safra', price: 24.9, category: { id: 2, category: 'Mercearia' } },
    ],
    links: [{ id: 1, shelfId: 101, productId: 1, productQuantity: 0 }, { id: 2, shelfId: 101, productId: 2, productQuantity: 4 }, { id: 3, shelfId: 102, productId: 2, productQuantity: 10 }, { id: 4, shelfId: 104, productId: 3, productQuantity: 20 }],
  }
}
export function addProductCatalogCases(db: ShelfApiFixture) {
  db.products.push(
    { id: 4, name: 'Escova dental', brand: 'Sorriso', price: 0, category: { id: 3, category: 'Higiene' } },
    { id: 5, name: 'Sabonete 90 g', brand: 'Puro', price: 2.49, category: { id: 3, category: 'Higiene' } },
    { id: 6, name: 'Suco de uva 1 L', brand: 'Vale', price: 8.99, category: { id: 1, category: 'Bebidas' } },
    { id: 7, name: 'Café tradicional 500 g', brand: 'Origem', price: 18.9, category: { id: 2, category: 'Mercearia' } },
  )
  db.links.push(
    { id: 5, shelfId: 105, productId: 5, productQuantity: 0 },
    { id: 6, shelfId: 106, productId: 5, productQuantity: 2 },
    { id: 7, shelfId: 107, productId: 6, productQuantity: 3 },
  )
}
// Simulador de HTTP exclusivo dos testes; nunca é importado pelos services de produção.
export function handleShelfFixture(db: ShelfApiFixture, method: string, path: string, body?: unknown): { status: number; json?: unknown } | null {
  if (method === 'GET' && path === '/categories/list') return { status: 200, json: db.categories }
  if ((method === 'POST' && path === '/products/company/registration') || (method === 'PATCH' && path.startsWith('/products/company/update/'))) {
    if (typeof body !== 'object' || !body || !('name' in body) || !('brand' in body) || !('price' in body) || !('categoryId' in body)) return { status: 400, json: {} }
    const category = db.categories.find(c => c.id === body.categoryId)
    if (!category || typeof body.name !== 'string' || !body.name.trim() || typeof body.brand !== 'string' || !body.brand.trim() || typeof body.price !== 'number' || body.price < 0) return { status: 400, json: {} }
    const id = Number(path.split('/').at(-1))
    if (method === 'PATCH' && !db.products.some(p => p.id === id)) return { status: 404, json: {} }
    if (db.products.some(p => p.name === body.name && (method === 'POST' || p.id !== id))) return { status: 409, json: {} }
    const product: ProductDto = { id: method === 'POST' ? Math.max(0, ...db.products.map(p => p.id)) + 1 : id, name: body.name, brand: body.brand, price: body.price, category }
    if (method === 'POST') db.products.push(product)
    else db.products = db.products.map(p => p.id === id ? product : p)
    return { status: method === 'POST' ? 201 : 200, json: product }
  }
  if (method === 'DELETE' && path.startsWith('/products/company/delete/')) {
    const id = Number(path.split('/').at(-1))
    if (db.links.some(l => l.productId === id)) return { status: 409, json: {} }
    if (!db.products.some(p => p.id === id)) return { status: 404, json: {} }
    db.products = db.products.filter(p => p.id !== id)
    return { status: 204 }
  }
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
