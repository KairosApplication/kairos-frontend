import type { PatchRequest } from './api'

export type SectorResponse = {
  id: number
  name: string
  type: string
}

export type SectorRequest = { name: string; type: string }
export type SectorUpdateRequest = PatchRequest<SectorRequest>

export type AisleResponse = {
  id: number
  sectorId: number
  sectorName: string
  position: number
}

export type AisleRequest = { sectorId: number; position: number }
export type AisleUpdateRequest = PatchRequest<AisleRequest>

/** Shelf is the API resource used for the manager's gondolas. */
export type ShelfResponse = {
  id: number
  aisleId: number
  aislePosition: number
  maximumCapacity: number
}

export type ShelfRequest = { aisleId: number; maximumCapacity: number }
export type ShelfUpdateRequest = PatchRequest<ShelfRequest>
