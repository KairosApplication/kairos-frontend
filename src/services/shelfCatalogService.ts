import { apiRequest, isRecord } from './apiClient'
import { ApiHttpError } from './apiData'
import { getStoreCatalog } from './storeCatalogService'
import type { ProductShelfDto, ShelfDto } from '../types/shelfApi'
import type { ShelfCatalog, ShelfFieldErrors, ShelfInput } from '../types/shelfCatalog'

const positive = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
const shelfDto = (v: unknown): v is ShelfDto => isRecord(v) && positive(v.id) && positive(v.aisleId) && positive(v.aislePosition) && positive(v.maximumCapacity)

export async function getShelfCatalog(signal?: AbortSignal): Promise<ShelfCatalog> {
  const { sectors, aisles, shelves, products, productShelves: links } = await getStoreCatalog(signal)
  const sectorById = new Map(sectors.map(s => [s.id, s]))
  const aisleById = new Map(aisles.map(a => [a.id, a]))
  const productById = new Map(products.map(p => [p.id, p]))
  const ordered = [...shelves].sort((a, b) => a.id - b.id)
  const linksByShelf = new Map<number, ProductShelfDto[]>()
  for (const link of links) linksByShelf.set(link.shelfId, [...(linksByShelf.get(link.shelfId) ?? []), link])
  const rowByAisle = new Map<number, number>()
  return {
    updatedAt: new Date().toLocaleString('pt-BR'),
    sectors: sectors.map(s => ({ id: String(s.id), name: s.name })),
    aisles: [...aisles].sort((a, b) => a.position - b.position || a.id - b.id).map(a => ({ id: String(a.id), sectorId: String(a.sectorId), sectorName: sectorById.get(a.sectorId)!.name, position: a.position })),
    shelves: ordered.map(s => {
      const aisle = aisleById.get(s.aisleId)!
      const ownProducts = (linksByShelf.get(s.id) ?? []).map(l => ({ id: String(l.productId), name: productById.get(l.productId)!.name, shelfUnits: l.productQuantity }))
      const row = (rowByAisle.get(s.aisleId) ?? 0) + 1
      rowByAisle.set(s.aisleId, row)
      const stockoutCount = ownProducts.filter(p => p.shelfUnits === 0).length
      return { id: String(s.id), aisleId: String(aisle.id), sectorId: String(aisle.sectorId), sectorName: sectorById.get(aisle.sectorId)!.name,
        location: `Corredor ${aisle.position}`, maximumCapacity: s.maximumCapacity,
        mapRow: row,
        productCount: ownProducts.length, productNames: ownProducts.map(p => p.name), products: ownProducts,
        status: !ownProducts.length ? 'empty' : stockoutCount ? 'stockout' : 'stocked', stockoutCount }
    }),
  }
}

export class ShelfValidationError extends Error {
  public fields: ShelfFieldErrors
  constructor(fields: ShelfFieldErrors) { super('Confira os campos destacados.'); this.name = 'ShelfValidationError'; this.fields = fields }
}
export class ShelfMutationUncertainError extends Error {
  constructor(options?: ErrorOptions) {
    super('Não foi possível confirmar a operação. Atualize a listagem antes de tentar novamente.', options)
    this.name = 'ShelfMutationUncertainError'
  }
}
function values(input: ShelfInput) {
  const fields: ShelfFieldErrors = {}
  const aisleId = Number(input.aisleId)
  const maximumCapacity = Number(input.maximumCapacity)
  if (!/^\d+$/.test(input.aisleId) || !positive(aisleId)) fields.aisleId = 'Selecione um corredor válido.'
  if (!/^\d+$/.test(input.maximumCapacity.trim()) || !positive(maximumCapacity) || maximumCapacity > 2147483647) fields.maximumCapacity = 'Informe uma capacidade inteira entre 1 e 2147483647.'
  if (Object.keys(fields).length) throw new ShelfValidationError(fields)
  return { aisleId, maximumCapacity }
}
function numericId(id: string) {
  if (!/^\d+$/.test(id) || !positive(Number(id))) throw new Error('Identificador de gôndola inválido.')
  return encodeURIComponent(id)
}
async function mutate(path: `/${string}`, method: string, body?: unknown): Promise<string | null> {
  let response: Response
  try {
    response = await apiRequest(path, { method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) })
  } catch (cause) { throw new ShelfMutationUncertainError({ cause }) }
  if (response.status >= 500) throw new ShelfMutationUncertainError()
  if (response.status === 400) {
    let payload: unknown
    try { payload = await response.json() } catch { /* Erros sem JSON continuam sendo HTTP 400. */ }
    if (isRecord(payload) && isRecord(payload.validationErrors)) {
      const fields: ShelfFieldErrors = {}
      for (const field of ['aisleId', 'maximumCapacity'] as const) {
        if (typeof payload.validationErrors[field] === 'string') fields[field] = field === 'aisleId' ? 'Selecione um corredor válido.' : 'Informe uma capacidade inteira positiva.'
      }
      if (Object.keys(fields).length) throw new ShelfValidationError(fields)
    }
  }
  const expected = method === 'POST' ? 201 : method === 'DELETE' ? 204 : 200
  if (response.status !== expected) {
    if (response.ok) throw new ShelfMutationUncertainError()
    throw new ApiHttpError(response.status)
  }
  // O status confirma a escrita. A releitura é separada para não reenviar um POST já confirmado.
  if (method !== 'DELETE') {
    try { const payload: unknown = await response.json(); if (shelfDto(payload)) return String(payload.id) } catch { /* A escrita já está confirmada pelo status. */ }
  }
  return null
}
export async function createShelf(input: ShelfInput): Promise<string | null> { return mutate('/shelves/registration', 'POST', values(input)) }
export async function updateShelf(id: string, input: ShelfInput): Promise<string | null> { return mutate(`/shelves/update/${numericId(id)}`, 'PATCH', values(input)) }
export async function deleteShelf(id: string): Promise<string | null> { return mutate(`/shelves/delete/${numericId(id)}`, 'DELETE') }
