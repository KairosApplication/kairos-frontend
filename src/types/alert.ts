import type { LocalDateString, LocalDateTimeString, PatchRequest } from './api'

export type AlertStatus = 'OPEN' | 'RESOLVED' | 'CANCELLED'

export type AlertResponse = {
  id: number
  stockoutDate: LocalDateString | null
  employeeId: number | null
  shelfId: number
  productId: number | null
  description: string
  status: AlertStatus
  resolutionDate: LocalDateTimeString | null
}

export type AlertRequest = {
  stockoutDate?: LocalDateString | null
  employeeId?: number | null
  shelfId: number
  productId?: number | null
  description: string
  status: AlertStatus
  resolutionDate?: LocalDateTimeString | null
}

export type AlertUpdateRequest = PatchRequest<AlertRequest>
