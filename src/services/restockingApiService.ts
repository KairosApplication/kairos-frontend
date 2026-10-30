import { apiRequest, isRecord } from './apiClient'
import { ApiHttpError, parseApiList, readApiData } from './apiData'
import { getStoreCatalog } from './storeCatalogService'
import type { StoreCatalogDto } from '../types/storeCatalogApi'
export type RestockingRecord = { id: number; inventoryId: number; employeeId: number; shelfId: number; productId: number; restockingDate: string; restockedQuantity: number; damagedQuantity: number }
type Person = { id: number; userName: string; position: string }
type Inventory = { id: number; sectorId: number; sectorName: string }
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= 2147483647
const id = (v: unknown): v is number => integer(v) && v > 0
function record(v: unknown): v is RestockingRecord { return isRecord(v) && id(v.id) && id(v.inventoryId) && id(v.employeeId) && id(v.shelfId) && id(v.productId) && typeof v.restockingDate === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v.restockingDate) && Number.isFinite(Date.parse(v.restockingDate)) && id(v.restockedQuantity) && integer(v.damagedQuantity) && v.damagedQuantity <= v.restockedQuantity }
async function list<T extends { id: number }>(path: `/${string}`, guard: (v: unknown) => v is T, signal?: AbortSignal) {
  return parseApiList(await readApiData(path, signal), guard)
}
export async function getRestockingCatalog(signal?: AbortSignal) {
  const [catalog, records] = await Promise.all([
    getStoreCatalog(signal), list('/restockings/list', record, signal),
  ])
  return { catalog, records: records.sort((a, b) => b.restockingDate.localeCompare(a.restockingDate) || b.id - a.id) }
}
export async function getRestockingOptions(catalog: StoreCatalogDto, signal?: AbortSignal) {
  const [people, inventories] = await Promise.all([
    list<Person>('/employees/list', (v): v is Person => isRecord(v) && id(v.id) && typeof v.userName === 'string' && !!v.userName.trim() && typeof v.position === 'string' && ['MANAGER', 'STOCKER', 'CASHIER'].includes(v.position.toUpperCase()), signal),
    list<Inventory>('/inventories/list', (v): v is Inventory => isRecord(v) && id(v.id) && id(v.sectorId) && typeof v.sectorName === 'string' && !!v.sectorName.trim(), signal),
  ])
  return { people: people.filter(p => ['STOCKER', 'MANAGER'].includes(p.position.toUpperCase())), inventories: inventories.filter(i => catalog.sectors.some(s => s.id === i.sectorId)) }
}
export class RestockingUncertainError extends Error { constructor() { super('Não foi possível confirmar a alteração. Consulte as reposições antes de tentar novamente.') } }
export async function writeRestocking(method: 'POST' | 'PATCH' | 'DELETE', body?: Omit<RestockingRecord, 'id' | 'restockingDate'>, recordId?: number) {
  if (method !== 'POST' && !id(recordId)) throw new Error('Registro inválido.')
  if (method !== 'DELETE' && (!body || ![body.employeeId, body.inventoryId, body.productId, body.shelfId, body.restockedQuantity].every(id) || !integer(body.damagedQuantity) || body.damagedQuantity > body.restockedQuantity)) throw new Error('Confira os vínculos e as quantidades da reposição.')
  const path = method === 'POST' ? '/restockings/registration' : `/restockings/${method === 'PATCH' ? 'update' : 'delete'}/${recordId}` as const
  let response: Response
  try { response = await apiRequest(path, { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) }) } catch { throw new RestockingUncertainError() }
  const expected = method === 'POST' ? 201 : method === 'PATCH' ? 200 : 204
  if (response.status >= 500 || response.ok && response.status !== expected) throw new RestockingUncertainError()
  if (response.status !== expected) throw new ApiHttpError(response.status)
}
