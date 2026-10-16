import type { ShelfCatalog } from '../types/shelfCatalog'
import { storeMapDemo } from './storeMap'

// Primeira página e quantidades conforme a captura; demais quantidades ilustrativas.
const firstPage = ['A12', 'A11', 'B11', 'B21', 'C31', 'D11']
const productCounts: Record<string, number> = { A12: 18, A11: 24, B11: 32, B21: 28, C31: 16, D11: 22 }
const orderedIds = [...firstPage, ...storeMapDemo.shelves.map((shelf) => shelf.id).filter((id) => !firstPage.includes(id))]

export const shelfCatalogDemo: ShelfCatalog = {
  store: storeMapDemo.store,
  unit: storeMapDemo.unit,
  updatedAt: storeMapDemo.updatedAt,
  sectors: storeMapDemo.sectors,
  shelves: orderedIds.map((id) => {
    const shelf = storeMapDemo.shelves.find((item) => item.id === id)!
    const sector = storeMapDemo.sectors.find((item) => item.id === shelf.sectorId)!
    return {
      id, sectorId: sector.id, sectorName: sector.name, location: sector.aisle,
      productCount: productCounts[id] ?? 20,
      productNames: shelf.restockingProducts.map((product) => product.name),
      status: shelf.status, stockoutCount: shelf.stockoutCount,
    }
  }),
}
