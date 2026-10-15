/** GET /api/v1/purchases/{id}/total; no purchase-list DTO is exposed yet. */
export type PurchaseTotalResponse = {
  purchaseId: number
  /** BigDecimal is serialized as a JSON number, in currency units. */
  total: number
}
