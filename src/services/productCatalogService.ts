import { productCategoriesDemo, productsDemo } from '../mocks/productCatalog'
import type { CatalogProduct, ProductAvailability, ProductCatalog } from '../types/productCatalog'

/** Regra ilustrativa para apresentação; a integração deverá usar o contrato confirmado. */
export function productAvailability(product: CatalogProduct): ProductAvailability {
  if (!product.active) return 'inactive'
  if (product.shelfUnits === 0) return 'stockout'
  return product.shelfUnits < product.minimumShelfUnits ? 'low' : 'available'
}

export async function getProductCatalog(): Promise<ProductCatalog> {
  return {
    store: 'Catálogo demonstrativo', unit: 'Sem vínculo com o mapa real', updatedAt: '25 set 2026, 14:32',
    categories: structuredClone(productCategoriesDemo), products: structuredClone(productsDemo),
    shelfCodes: {},
  }
}
