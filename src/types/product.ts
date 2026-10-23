import type { PatchRequest } from './api'

export type CategoryResponse = {
  id: number
  category: string
}

export type CategoryRequest = { category: string }

// This PATCH requires category; it is not a partial CategoryRequest.
export type CategoryUpdateRequest = CategoryRequest

export type ProductResponse = {
  id: number
  brand: string
  /** BigDecimal is serialized as a JSON number, in currency units. */
  price: number
  name: string
  category: CategoryResponse
}

export type ProductRequest = {
  categoryId: number
  brand: string
  price: number
  name: string
}

export type ProductUpdateRequest = PatchRequest<ProductRequest>
