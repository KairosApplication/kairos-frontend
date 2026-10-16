/** Modelo de apresentação do mapa; não representa um contrato da API. */
export type ShelfStatus = 'stocked' | 'low' | 'stockout'

export type MapSector = { id: string; name: string; aisle: string }

export type MapProduct = {
  id: string
  name: string
  shelfUnits: number
  warehouseUnits: number
}

export type MapShelf = {
  id: string
  sectorId: string
  row: number
  status: ShelfStatus
  stockoutCount: number
  responsible: string
  restockingProducts: MapProduct[]
}

export type StoreMapData = {
  store: string
  unit: string
  updatedAt: string
  sectors: MapSector[]
  shelves: MapShelf[]
}
