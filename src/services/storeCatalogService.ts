import { isRecord } from './apiClient'
import { invalidApiData, parseApiList, readApiData } from './apiData'
import type { AisleDto, ProductShelfDto, SectorDto, ShelfDto } from '../types/shelfApi'
import type { ProductDto, StoreCatalogDto } from '../types/storeCatalogApi'

const positive = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
const quantity = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const sectorDto = (v: unknown): v is SectorDto => isRecord(v) && positive(v.id) && text(v.name)
const aisleDto = (v: unknown): v is AisleDto => isRecord(v) && positive(v.id) && positive(v.sectorId) && text(v.sectorName) && positive(v.position)
const shelfDto = (v: unknown): v is ShelfDto => isRecord(v) && positive(v.id) && positive(v.aisleId) && positive(v.aislePosition) && positive(v.maximumCapacity)
const productDto = (v: unknown): v is ProductDto => isRecord(v) && positive(v.id) && text(v.name) && text(v.brand)
  && typeof v.price === 'number' && Number.isFinite(v.price) && v.price >= 0 && v.price <= 9999999999.99
  && isRecord(v.category) && positive(v.category.id) && text(v.category.category)
const linkDto = (v: unknown): v is ProductShelfDto => isRecord(v) && positive(v.id) && positive(v.productId) && positive(v.shelfId) && quantity(v.productQuantity)

export async function getStoreCatalog(signal?: AbortSignal): Promise<StoreCatalogDto> {
  const payload = await readApiData('/store-map', signal)
  if (!isRecord(payload)) invalidApiData()
  const sectors = parseApiList(payload.sectors, sectorDto)
  const aisles = parseApiList(payload.aisles, aisleDto)
  const shelves = parseApiList(payload.shelves, shelfDto)
  const products = parseApiList(payload.products, productDto)
  const productShelves = parseApiList(payload.productShelves, linkDto)
  const sectorIds = new Set(sectors.map(s => s.id))
  const aisleById = new Map(aisles.map(a => [a.id, a]))
  const shelfIds = new Set(shelves.map(s => s.id))
  const productIds = new Set(products.map(p => p.id))
  if (aisles.some(a => !sectorIds.has(a.sectorId)) || shelves.some(s => !aisleById.has(s.aisleId) || aisleById.get(s.aisleId)?.position !== s.aislePosition)
    || productShelves.some(l => !shelfIds.has(l.shelfId) || !productIds.has(l.productId))
    || new Set(productShelves.map(l => `${l.shelfId}:${l.productId}`)).size !== productShelves.length) invalidApiData()
  const categories = new Map<number, string>()
  for (const product of products) {
    const previous = categories.get(product.category.id)
    if (previous !== undefined && previous !== product.category.category) invalidApiData()
    categories.set(product.category.id, product.category.category)
  }
  return { sectors, aisles, shelves, products, productShelves }
}
