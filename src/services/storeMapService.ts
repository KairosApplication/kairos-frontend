import type { StoreMapData } from '../types/storeMap'
import { getShelfCatalog } from './shelfCatalogService'
export async function getStoreMap(signal?: AbortSignal): Promise<StoreMapData> {
  const catalog = await getShelfCatalog(signal)
  return { updatedAt: catalog.updatedAt, sectors: catalog.sectors, aisles: catalog.aisles,
    shelves: catalog.shelves.map(s => ({ id: s.id, sectorId: s.sectorId, aisleId: s.aisleId, row: s.mapRow,
      location: s.location, maximumCapacity: s.maximumCapacity, status: s.status, stockoutCount: s.stockoutCount, products: s.products })) }
}
