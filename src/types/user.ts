import type { LocalDateString, PatchRequest } from './api'

export type UserResponse = {
  id: number
  name: string
  email: string
}

/** Input only. Never copy passwords into profile responses or persisted state. */
export type UserRequest = {
  name: string
  lastName: string
  birthDate: LocalDateString
  password: string
  email: string
  cpf: string
}

export type UserUpdateRequest = PatchRequest<Pick<UserRequest, 'email' | 'cpf'>>

/** Public registration creates a customer, not a manager. */
export type UserRegistrationRequest = UserRequest & { companyId: number }

export type CustomerResponse = {
  id: number
  userId: number
  userName: string
}

export type CustomerRequest = { userId: number; companyId: number }

export type RecommendedProductResponse = {
  productId: number
  productName: string
  categoryId: number
  categoryName: string
}
