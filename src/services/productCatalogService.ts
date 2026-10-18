import { productCategoriesDemo, productsDemo } from '../mocks/productCatalog'
import type { CatalogProduct, ProductAvailability, ProductCatalog } from '../types/productCatalog'
import { getShelfCatalog } from './shelfCatalogService'

/** Regra ilustrativa para apresentação; a integração deverá usar o contrato confirmado. */
export function productAvailability(product: CatalogProduct): ProductAvailability {
  if (!product.active) return 'inactive'
  if (product.shelfUnits === 0) return 'stockout'
  return product.shelfUnits < product.minimumShelfUnits ? 'low' : 'available'
}

export async function getProductCatalog(): Promise<ProductCatalog> {
  const shelves = await getShelfCatalog()
  return {
    store: shelves.store, unit: shelves.unit, updatedAt: shelves.updatedAt,
    categories: structuredClone(productCategoriesDemo), products: structuredClone(productsDemo),
    shelfCodes: Object.fromEntries(shelves.shelves.filter((shelf) => shelf.sourceId).map((shelf) => [shelf.sourceId, shelf.id])),
  }
}
