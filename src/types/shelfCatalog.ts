import type { MapSector, ShelfStatus } from './storeMap'

/** Modelo de apresentação demonstrativo; não define o contrato do backend. */
export type ShelfCatalogItem = {
  id: string
  sectorId: string
  sectorName: string
  location: string
  productCount: number
  productNames: string[]
  status: ShelfStatus
  stockoutCount: number
}

export type ShelfCatalog = {
  store: string
  unit: string
  updatedAt: string
  sectors: MapSector[]
  shelves: ShelfCatalogItem[]
}
