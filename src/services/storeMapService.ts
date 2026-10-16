import { storeMapDemo } from '../mocks/storeMap'
import type { StoreMapData } from '../types/storeMap'
import { getShelfCatalog } from './shelfCatalogService'

/** Fonte demonstrativa temporária, sem requisições ou alterações no banco. */
export async function getStoreMap(): Promise<StoreMapData> {
  const catalog = await getShelfCatalog()
  return {
    store: catalog.store, unit: catalog.unit, updatedAt: catalog.updatedAt, sectors: catalog.sectors,
    shelves: catalog.shelves.map((shelf) => {
      // Produtos e responsável vêm da origem demonstrativa, mesmo após renomear o código.
      const seed = storeMapDemo.shelves.find((item) => item.id === shelf.sourceId)
      return { id: shelf.id, sectorId: shelf.sectorId, row: shelf.mapRow, location: shelf.location,
        status: shelf.status, stockoutCount: shelf.stockoutCount,
        responsible: shelf.status === 'empty' ? 'Não atribuído' : seed?.responsible ?? 'João Silva',
        restockingProducts: shelf.status === 'empty' ? [] : structuredClone(seed?.restockingProducts ?? []),
      }
    }),
  }
}
