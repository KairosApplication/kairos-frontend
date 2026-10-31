import { isRecord } from './apiClient'
import { invalidApiData, parseApiList, readApiData } from './apiData'
export type ApiCustomer = { id: number; userId: number; userName: string }
export type Recommendation = { productId: number; productName: string; categoryId: number; categoryName: string }
const id = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim()
const get = readApiData
export async function getCustomers(signal?: AbortSignal) {
  return parseApiList(await get('/customers/list', signal), (v): v is ApiCustomer => isRecord(v) && id(v.id) && id(v.userId) && text(v.userName)).sort((a, b) => a.userName.localeCompare(b.userName, 'pt-BR') || a.id - b.id)
}
export async function getRecommendations(customerId: number, signal?: AbortSignal): Promise<Recommendation[]> {
  if (!id(customerId)) throw new Error('Cliente inválido.')
  const payload = await get(`/customers/${customerId}/recommendations?limit=10`, signal)
  if (!Array.isArray(payload) || !payload.every((v): v is Recommendation => isRecord(v) && id(v.productId) && text(v.productName) && id(v.categoryId) && text(v.categoryName)) || new Set(payload.map(v => v.productId)).size !== payload.length) invalidApiData()
  return payload
}
export async function getPurchaseTotal(purchaseId: number, signal?: AbortSignal): Promise<{ purchaseId: number; total: number }> {
  if (!id(purchaseId)) throw new Error('Informe um ID de compra válido.')
  const payload = await get(`/purchases/${purchaseId}/total`, signal)
  if (!isRecord(payload) || payload.purchaseId !== purchaseId || typeof payload.total !== 'number' || !Number.isFinite(payload.total) || payload.total < 0) invalidApiData()
  return { purchaseId, total: payload.total }
}
export function salesCsv(rows: string[][]) { return '\uFEFF' + rows.map(row => row.map(v => `"${(/^[\s]*[=+@-]/.test(v) ? "'" + v : v).replaceAll('"', '""')}"`).join(';')).join('\r\n') }
export function exportSalesCsv(rows: string[][], filename: string) {
  const url = URL.createObjectURL(new Blob([salesCsv(rows)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a)
  try { a.click() } finally { a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
}
