import { getStoreCatalog } from './storeCatalogService'
import { invalidApiData } from './apiData'
import type { CatalogProduct, ProductAvailability, ProductCatalog, ProductPlacement } from '../types/productCatalog'

export function productAvailability(product: CatalogProduct): ProductAvailability {
  if (!product.placements.length) return 'unlinked'
  if (product.placements.every(p => p.units === 0)) return 'zero'
  return product.placements.some(p => p.units === 0) ? 'partial' : 'stocked'
}

export async function getProductCatalog(signal?: AbortSignal): Promise<ProductCatalog> {
  const data = await getStoreCatalog(signal)
  const shelves = new Map(data.shelves.map(s => [s.id, s]))
  const aisles = new Map(data.aisles.map(a => [a.id, a]))
  const sectors = new Map(data.sectors.map(s => [s.id, s]))
  const placements = new Map<number, ProductPlacement[]>()
  for (const link of data.productShelves) {
    const shelf = shelves.get(link.shelfId)!
    const aisle = aisles.get(shelf.aisleId)!
    const own = placements.get(link.productId) ?? []
    own.push({ shelfId: String(shelf.id), units: link.productQuantity, location: `Corredor ${aisle.position}`, sectorName: sectors.get(aisle.sectorId)!.name })
    placements.set(link.productId, own)
  }
  const categories = new Map(data.products.map(p => [p.category.id, { id: String(p.category.id), name: p.category.category }]))
  return {
    updatedAt: new Date().toLocaleString('pt-BR'),
    categories: [...categories.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR') || Number(a.id) - Number(b.id)),
    products: [...data.products].sort((a, b) => a.id - b.id).map(p => {
      const own = (placements.get(p.id) ?? []).sort((a, b) => Number(a.shelfId) - Number(b.shelfId))
      const units = own.reduce((sum, item) => sum + item.units, 0)
      if (!Number.isSafeInteger(units)) invalidApiData()
      return { id: String(p.id), name: p.name, brand: p.brand, categoryId: String(p.category.id), price: p.price,
        shelfUnits: own.length ? units : null, placements: own }
    }),
  }
}
