/** Status observável pelos vínculos e quantidades; não há limite mínimo na API. */
export type ShelfStatus = 'stocked' | 'stockout' | 'empty'
export type MapSector = { id: string; name: string }
export type MapAisle = { id: string; sectorId: string; sectorName: string; position: number }
export type MapProduct = { id: string; name: string; shelfUnits: number }
export type MapShelf = {
  id: string
  sectorId: string
  aisleId: string
  row: number
  location: string
  maximumCapacity: number
  status: ShelfStatus
  stockoutCount: number
  products: MapProduct[]
}
export type StoreMapData = {
  updatedAt: string
  sectors: MapSector[]
  aisles: MapAisle[]
  shelves: MapShelf[]
}
