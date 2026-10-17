import type { PatchRequest } from './api'
import type { UserRequest } from './user'

/** Position enum accepted in employee registration/update JSON. */
export type EmployeePosition = 'MANAGER' | 'STOCKER' | 'CASHIER'

/** EmployeeMapper uses Position.getValue(), which returns lowercase. */
export type EmployeePositionValue = 'manager' | 'stocker' | 'cashier'

export type EmployeeResponse = {
  id: number
  position: EmployeePositionValue
  userId: number
  userName: string
}

export type EmployeeRequest = {
  user: UserRequest
  position: EmployeePosition
}

// This PATCH requires position; it does not update the nested user.
export type EmployeeUpdateRequest = { position: EmployeePosition }

export type EmployeeAisleResponse = {
  id: number
  employeeId: number
  aisleId: number
}

export type EmployeeAisleRequest = { employeeId: number; aisleId: number }
export type EmployeeAisleUpdateRequest = PatchRequest<EmployeeAisleRequest>

export type ShelfEmployeeResponse = {
  id: number
  employeeId: number
  shelfId: number
}

export type ShelfEmployeeRequest = { employeeId: number; shelfId: number }
export type ShelfEmployeeUpdateRequest = PatchRequest<ShelfEmployeeRequest>
