import type { MapSector, ShelfStatus } from './storeMap'

/** Modelo de apresentação demonstrativo; não define o contrato do backend. */
export type ShelfCatalogItem = {
  id: string
  sourceId?: string
  sectorId: string
  sectorName: string
  location: string
  mapRow: number
  productCount: number
  productNames: string[]
  status: ShelfStatus
  stockoutCount: number
}

export type ShelfInput = { code: string; sectorId: string; location: string }
export type ShelfFieldErrors = Partial<Record<keyof ShelfInput, string>>

export type ShelfCatalog = {
  store: string
  unit: string
  updatedAt: string
  sectors: MapSector[]
  shelves: ShelfCatalogItem[]
}
