import { shelfCatalogDemo } from '../mocks/shelfCatalog'
import type { ShelfCatalog, ShelfCatalogItem, ShelfFieldErrors, ShelfInput } from '../types/shelfCatalog'

// Estado demonstrativo compartilhado pelas telas; recarregar restaura os exemplos.
let catalog: ShelfCatalog = structuredClone(shelfCatalogDemo)

export class ShelfValidationError extends Error {
  fields: ShelfFieldErrors
  constructor(fields: ShelfFieldErrors) {
    super('Confira os campos destacados.')
    this.name = 'ShelfValidationError'
    this.fields = fields
  }
}

function validate(input: ShelfInput, originalId?: string) {
  const normalized = { code: input.code.trim().toUpperCase(), sectorId: input.sectorId, location: input.location.trim() }
  const errors: ShelfFieldErrors = {}
  if (!/^[A-Z0-9][A-Z0-9-]{0,11}$/.test(normalized.code)) errors.code = 'Use de 1 a 12 letras, números ou hífen, começando por letra ou número.'
  else if (catalog.shelves.some((shelf) => shelf.id === normalized.code && shelf.id !== originalId)) errors.code = 'Já existe uma gôndola com esse código.'
  if (!catalog.sectors.some((sector) => sector.id === normalized.sectorId)) errors.sectorId = 'Selecione um setor válido.'
  if (!normalized.location || normalized.location.length > 80) errors.location = 'Informe uma localização de até 80 caracteres.'
  if (Object.keys(errors).length) throw new ShelfValidationError(errors)
  return normalized
}

function freeRow(sectorId: string, originalId?: string) {
  const occupied = new Set(catalog.shelves.filter((shelf) => shelf.sectorId === sectorId && shelf.id !== originalId).map((shelf) => shelf.mapRow))
  let row = 1
  while (occupied.has(row)) row++
  return row
}

/** Fonte temporária sem rede ou escrita no banco. Retorna cópias isoladas. */
export function getShelfCatalog(): Promise<ShelfCatalog> {
  return Promise.resolve(structuredClone(catalog))
}

export async function createShelf(input: ShelfInput): Promise<ShelfCatalog> {
  const values = validate(input)
  const sector = catalog.sectors.find((item) => item.id === values.sectorId)!
  const shelf: ShelfCatalogItem = {
    id: values.code, sectorId: sector.id, sectorName: sector.name, location: values.location,
    mapRow: freeRow(sector.id), productCount: 0, productNames: [], status: 'empty', stockoutCount: 0,
  }
  catalog = { ...catalog, shelves: [shelf, ...catalog.shelves] }
  return getShelfCatalog()
}

export async function updateShelf(originalId: string, input: ShelfInput): Promise<ShelfCatalog> {
  const previous = catalog.shelves.find((shelf) => shelf.id === originalId)
  if (!previous) throw new Error('A gôndola não está mais disponível. Atualize a página e tente novamente.')
  const values = validate(input, originalId)
  const sector = catalog.sectors.find((item) => item.id === values.sectorId)!
  const updated = { ...previous, id: values.code, sectorId: sector.id, sectorName: sector.name, location: values.location,
    mapRow: previous.sectorId === sector.id ? previous.mapRow : freeRow(sector.id, originalId) }
  catalog = { ...catalog, shelves: catalog.shelves.map((shelf) => shelf.id === originalId ? updated : shelf) }
  return getShelfCatalog()
}

export async function deleteShelf(id: string): Promise<ShelfCatalog> {
  const shelf = catalog.shelves.find((item) => item.id === id)
  if (!shelf) throw new Error('A gôndola não está mais disponível. Atualize a página e tente novamente.')
  if (shelf.productCount > 0) throw new Error('Remova ou transfira os produtos antes de excluir esta gôndola.')
  catalog = { ...catalog, shelves: catalog.shelves.filter((item) => item.id !== id) }
  return getShelfCatalog()
}
