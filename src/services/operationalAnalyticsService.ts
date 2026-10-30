import { isRecord } from './apiClient'
import { ApiHttpError, invalidApiData, parseApiList, readApiData } from './apiData'
import { getStoreCatalog } from './storeCatalogService'
import type { StoreCatalogDto } from '../types/storeCatalogApi'
export type ReplenishmentMetric = { id: number; restockingDate: string; restockedQuantity: number; damagedQuantity: number }
export type DailyOperation = { date: string; label: string; value: number }
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
function valid(v: unknown): v is ReplenishmentMetric { return isRecord(v) && integer(v.id) && v.id > 0 && typeof v.restockingDate === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v.restockingDate) && Number.isFinite(Date.parse(v.restockingDate)) && integer(v.restockedQuantity) && integer(v.damagedQuantity) && v.damagedQuantity <= v.restockedQuantity }
export function operationDay(now = new Date()) { const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now); return ['year', 'month', 'day'].map(k => parts.find(p => p.type === k)?.value).join('-') }
export function summarizeOperations(catalog: StoreCatalogDto, records: ReplenishmentMetric[] | null, today = operationDay()) {
  const days: DailyOperation[] = Array.from({ length: 7 }, (_, index) => { const date = new Date(`${today}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 6 + index); const key = date.toISOString().slice(0, 10); return { date: key, label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(date), value: records?.filter(r => r.restockingDate.slice(0, 10) === key).reduce((sum, r) => sum + r.restockedQuantity - r.damagedQuantity, 0) ?? 0 } })
  const week = records?.filter(r => r.restockingDate.slice(0, 10) >= days[0].date && r.restockingDate.slice(0, 10) <= today) ?? null
  const zero = catalog.productShelves.filter(l => l.productQuantity === 0)
  const quantity = catalog.productShelves.reduce((sum, l) => sum + l.productQuantity, 0)
  if (!integer(quantity) || days.some(d => !integer(d.value))) invalidApiData()
  const categories = [...new Map(catalog.products.map(p => [p.category.id, p.category.category])).entries()].map(([id, name]) => ({ id, name, count: catalog.products.filter(p => p.category.id === id).length, zeroLinks: zero.filter(l => catalog.products.find(p => p.id === l.productId)?.category.id === id).length })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'))
  return { catalog, days, week, zero, quantity, categories, today, emptyShelves: catalog.shelves.filter(s => !catalog.productShelves.some(l => l.shelfId === s.id)).length, availableLinks: catalog.productShelves.filter(l => l.productQuantity > 0).length }
}
export async function getOperationalHistory(signal?: AbortSignal) {
  try { return { records: parseApiList(await readApiData('/restockings/list', signal), valid), error: null } }
  catch (cause) { if (signal?.aborted || cause instanceof ApiHttpError && cause.status === 401) throw cause; return { records: null, error: cause instanceof Error ? cause : new Error('Reposições indisponíveis.') } }
}
export async function getOperationalAnalytics(signal?: AbortSignal) { const [catalog, history] = await Promise.all([getStoreCatalog(signal), getOperationalHistory(signal)]); return { ...summarizeOperations(catalog, history.records), restockingError: history.error } }
export function exportOperations(data: Awaited<ReturnType<typeof getOperationalAnalytics>>) {
  const rows = [['Indicador', 'Valor'], ['Data da consulta', data.today], ['Produtos no catálogo', String(data.catalog.products.length)], ['Gôndolas', String(data.catalog.shelves.length)], ['Unidades nas gôndolas', String(data.quantity)], ['Vínculos sem saldo', String(data.zero.length)], ['Registros nos últimos 7 dias', data.week ? String(data.week.length) : 'Não informado'], ['Data', 'Unidades registradas sem avarias'], ...data.days.map(d => [d.date, data.week ? String(d.value) : 'Não informado'])]
  const csv = '\uFEFF' + rows.map(row => row.map(v => `"${v.replaceAll('"', '""')}"`).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'kairos-operacao.csv'; document.body.append(a)
  try { a.click() } finally { a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
}
