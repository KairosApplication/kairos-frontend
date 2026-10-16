import { shelfCatalogDemo } from '../mocks/shelfCatalog'
import type { ShelfCatalog } from '../types/shelfCatalog'

/** Fonte temporária sem rede, persistência ou escrita no banco. */
export function getShelfCatalog(): Promise<ShelfCatalog> {
  return Promise.resolve(structuredClone(shelfCatalogDemo))
}
