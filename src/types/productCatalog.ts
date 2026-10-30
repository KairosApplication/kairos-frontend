export type ProductAvailability = 'stocked' | 'partial' | 'zero' | 'unlinked'
export type ProductCategory = { id: string; name: string }
export type ProductPlacement = { shelfId: string; units: number; location: string; sectorName: string }
export type CatalogProduct = {
  id: string
  name: string
  brand: string
  categoryId: string
  price: number
  shelfUnits: number | null
  placements: ProductPlacement[]
}
export type ProductCatalog = { updatedAt: string; categories: ProductCategory[]; products: CatalogProduct[] }
export type ProductInput = { name: string; brand: string; categoryId: string; price: string }
export type ProductFieldErrors = Partial<Record<keyof ProductInput, string>>
