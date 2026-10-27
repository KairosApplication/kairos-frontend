/** Campos dos DTOs do catálogo por empresa retornado por GET /api/v1/store-map. */
export type SectorDto = { id: number; name: string }
export type AisleDto = { id: number; sectorId: number; sectorName: string; position: number }
// aislePosition é a posição DO CORREDOR no mapper do backend, não da gôndola.
export type ShelfDto = { id: number; aisleId: number; aislePosition: number; maximumCapacity: number }
export type ProductShelfDto = { id: number; productId: number; shelfId: number; productQuantity: number }
