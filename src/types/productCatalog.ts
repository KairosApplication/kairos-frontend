/** Tipos de apresentação da demonstração, independentes do contrato da API. */
export type ProductAvailability = 'available' | 'low' | 'stockout' | 'inactive'
export type ProductCategory = { id: string; name: string }
export type CatalogProduct = {
  id: string
  name: string
  sku: string
  barcode: string
  categoryId: string
  price: number
  active: boolean
  shelfUnits: number
  warehouseUnits: number
  minimumShelfUnits: number
  sourceShelfId: string
}
export type ProductCatalog = {
  store: string
  unit: string
  updatedAt: string
  categories: ProductCategory[]
  products: CatalogProduct[]
  shelfCodes: Record<string, string>
}
