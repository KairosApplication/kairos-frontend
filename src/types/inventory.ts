import type { PatchRequest } from './api'

export type InventoryResponse = {
  id: number
  sectorId: number
  sectorName: string
}

export type InventoryRequest = { sectorId: number }
export type InventoryUpdateRequest = PatchRequest<InventoryRequest>

export type ProductShelfResponse = {
  id: number
  productId: number
  shelfId: number
  productQuantity: number
}

export type ProductShelfRequest = {
  productId: number
  shelfId: number
  productQuantity: number
}

export type ProductShelfUpdateRequest = PatchRequest<ProductShelfRequest>
