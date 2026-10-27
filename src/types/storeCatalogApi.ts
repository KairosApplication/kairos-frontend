import type { AisleDto, ProductShelfDto, SectorDto, ShelfDto } from './shelfApi'

export type ProductDto = {
  id: number
  name: string
  brand: string
  price: number
  category: { id: number; category: string }
}
export type StoreCatalogDto = {
  sectors: SectorDto[]
  aisles: AisleDto[]
  shelves: ShelfDto[]
  products: ProductDto[]
  productShelves: ProductShelfDto[]
}
