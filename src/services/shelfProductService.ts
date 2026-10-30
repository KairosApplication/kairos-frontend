import { apiRequest } from './apiClient'
import { ApiHttpError } from './apiData'

export class ShelfProductUncertainError extends Error {
  constructor() { super('Não foi possível confirmar a alteração. Consulte os vínculos antes de tentar novamente.') }
}
export async function writeShelfProduct(method: 'POST' | 'PATCH' | 'DELETE', shelfId: number, productId: number, quantity: string, linkId?: number) {
  const positive = (v: number) => Number.isSafeInteger(v) && v > 0 && v <= 2147483647
  if (!positive(shelfId) || !positive(productId) || (method !== 'POST' && !positive(linkId ?? 0))) throw new Error('Selecione um vínculo válido.')
  const amount = Number(quantity)
  if (method !== 'DELETE' && (!/^\d+$/.test(quantity) || !positive(amount))) throw new Error('Informe uma quantidade inteira entre 1 e 2147483647.')
  const path = method === 'POST' ? '/product-shelves/registration' : `/product-shelves/${method === 'PATCH' ? 'update' : 'delete'}/${linkId}` as const
  let response: Response
  try { response = await apiRequest(path, { method, ...(method === 'DELETE' ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shelfId, productId, productQuantity: amount }) }) }) }
  catch { throw new ShelfProductUncertainError() }
  if (response.status >= 500 || response.ok && response.status !== (method === 'POST' ? 201 : method === 'PATCH' ? 200 : 204)) throw new ShelfProductUncertainError()
  if (!response.ok) throw new ApiHttpError(response.status)
}
