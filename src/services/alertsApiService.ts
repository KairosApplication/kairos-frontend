import { apiRequest, isRecord, readApiJson } from './apiClient'
import { ApiHttpError, parseApiList } from './apiData'
import { getStoreCatalog } from './storeCatalogService'
export type ApiAlert = { id: number; shelfId: number; productId: number | null; description: string; status: 'OPEN' | 'RESOLVED' | 'CANCELLED'; stockoutDate: string | null }
const id = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
function valid(v: unknown): v is ApiAlert { return isRecord(v) && id(v.id) && id(v.shelfId) && (v.productId === null || id(v.productId)) && typeof v.description === 'string' && !!v.description.trim() && ['OPEN', 'RESOLVED', 'CANCELLED'].includes(String(v.status)) && (v.stockoutDate === null || typeof v.stockoutDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.stockoutDate)) }
export async function getAlerts(signal?: AbortSignal) {
  const [catalog, response] = await Promise.all([getStoreCatalog(signal), apiRequest('/alerts/list', { signal })])
  if (response.status !== 200) throw new ApiHttpError(response.status)
  const alerts = parseApiList(await readApiJson(response), valid)
  return alerts.filter(a => a.status === 'OPEN' && catalog.shelves.some(s => s.id === a.shelfId) && (a.productId === null || catalog.products.some(p => p.id === a.productId))).sort((a, b) => (b.stockoutDate ?? '').localeCompare(a.stockoutDate ?? '') || b.id - a.id)
}
