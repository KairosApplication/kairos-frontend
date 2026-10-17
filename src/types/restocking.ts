import type { LocalDateTimeString, PatchRequest } from './api'

/** A recorded restocking; the API does not expose a task/kanban status. */
export type RestockingResponse = {
  id: number
  inventoryId: number
  employeeId: number
  shelfId: number
  productId: number
  restockingDate: LocalDateTimeString
  restockedQuantity: number
  damagedQuantity: number
}

export type RestockingRequest = {
  inventoryId: number
  employeeId: number
  shelfId: number
  productId: number
  restockedQuantity: number
  /** The service defaults missing/null damagedQuantity to zero. */
  damagedQuantity?: number | null
}

export type RestockingUpdateRequest = PatchRequest<RestockingRequest>
