import type { MapProduct, MapSector, ShelfStatus, MapAisle } from './storeMap'

export type ShelfCatalogItem = {
  id: string
  sectorId: string
  sectorName: string
  aisleId: string
  location: string
  maximumCapacity: number
  mapRow: number
  productCount: number
  productNames: string[]
  products: MapProduct[]
  status: ShelfStatus
  stockoutCount: number
}
export type ShelfInput = { aisleId: string; maximumCapacity: string }
export type ShelfFieldErrors = Partial<Record<keyof ShelfInput, string>>
export type ShelfCatalog = {
  updatedAt: string
  sectors: MapSector[]
  aisles: MapAisle[]
  shelves: ShelfCatalogItem[]
}
