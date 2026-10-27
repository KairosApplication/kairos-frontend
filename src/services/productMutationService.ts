import { apiRequest, isRecord, readApiJson } from './apiClient'
import { ApiHttpError, parseApiList } from './apiData'
import type { ProductCategory, ProductFieldErrors, ProductInput } from '../types/productCatalog'

const positive = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
const categoryDto = (v: unknown): v is { id: number; category: string } => isRecord(v) && positive(v.id) && typeof v.category === 'string' && v.category.trim().length > 0
export async function getProductCategories(signal?: AbortSignal): Promise<ProductCategory[]> {
  const response = await apiRequest('/categories/list', { signal })
  if (response.status !== 200) throw new ApiHttpError(response.status)
  return parseApiList(await readApiJson(response), categoryDto)
    .map(c => ({ id: String(c.id), name: c.category }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR') || Number(a.id) - Number(b.id))
}

export class ProductValidationError extends Error {
  public fields: ProductFieldErrors
  constructor(fields: ProductFieldErrors) { super('Confira os campos destacados.'); this.name = 'ProductValidationError'; this.fields = fields }
}
export class ProductMutationUncertainError extends Error {
  constructor(options?: ErrorOptions) {
    super('Não foi possível confirmar a operação. Atualize a listagem antes de tentar novamente.', options)
    this.name = 'ProductMutationUncertainError'
  }
}
const messages = {
  name: 'Informe um nome de até 100 caracteres.', brand: 'Informe uma marca de até 255 caracteres.',
  categoryId: 'Selecione uma categoria válida.', price: 'Informe um preço entre 0 e 9999999999,99, com até duas casas decimais.',
} satisfies Record<keyof ProductInput, string>
function values(input: ProductInput) {
  const fields: ProductFieldErrors = {}
  const name = input.name.trim()
  const brand = input.brand.trim()
  const categoryId = Number(input.categoryId)
  const priceText = input.price.trim()
  const price = Number(priceText.replace(',', '.'))
  if (!name || name.length > 100) fields.name = messages.name
  if (!brand || brand.length > 255) fields.brand = messages.brand
  if (!/^\d+$/.test(input.categoryId) || !positive(categoryId)) fields.categoryId = messages.categoryId
  if (!/^\d{1,10}([.,]\d{1,2})?$/.test(priceText) || !Number.isFinite(price) || price < 0 || price > 9999999999.99) fields.price = messages.price
  if (Object.keys(fields).length) throw new ProductValidationError(fields)
  return { name, brand, categoryId, price }
}
function numericId(id: string) {
  if (!/^\d+$/.test(id) || !positive(Number(id))) throw new Error('Identificador de produto inválido.')
  return encodeURIComponent(id)
}
async function mutate(path: `/${string}`, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<string | null> {
  let response: Response
  try { response = await apiRequest(path, { method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }) }
  catch (cause) { throw new ProductMutationUncertainError({ cause }) }
  if (response.status >= 500) throw new ProductMutationUncertainError()
  if (response.status === 400) {
    let payload: unknown
    try { payload = await response.json() } catch { /* Preserve HTTP 400 if the server did not return JSON. */ }
    if (isRecord(payload) && isRecord(payload.validationErrors)) {
      const fields: ProductFieldErrors = {}
      for (const field of ['name', 'brand', 'categoryId', 'price'] as const) {
        if (typeof payload.validationErrors[field] === 'string') fields[field] = messages[field]
      }
      if (Object.keys(fields).length) throw new ProductValidationError(fields)
    }
  }
  if (response.status === 409 && method !== 'DELETE') throw new ProductValidationError({ name: 'Já existe um produto com esse nome.' })
  const expected = method === 'POST' ? 201 : method === 'DELETE' ? 204 : 200
  if (response.status !== expected) {
    if (response.ok) throw new ProductMutationUncertainError()
    throw new ApiHttpError(response.status)
  }
  // HTTP confirms the write. An unreadable body must not cause a repeated registration.
  if (method !== 'DELETE') {
    try { const payload: unknown = await response.json(); if (isRecord(payload) && positive(payload.id)) return String(payload.id) } catch { /* Already acknowledged by the HTTP status. */ }
  }
  return null
}
export async function createProduct(input: ProductInput) { return mutate('/products/registration', 'POST', values(input)) }
export async function updateProduct(id: string, input: ProductInput) { return mutate(`/products/update/${numericId(id)}`, 'PATCH', values(input)) }
export async function deleteProduct(id: string) { return mutate(`/products/delete/${numericId(id)}`, 'DELETE') }
