import { apiRequest, isRecord } from './apiClient'
import { ApiHttpError, parseApiList, readApiData } from './apiData'
export type ApiEmployee = { id: number; userId: number; userName: string; position: 'MANAGER' | 'STOCKER' | 'CASHIER' }
type EmployeeDto = Omit<ApiEmployee, 'position'> & { position: string }
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
function valid(v: unknown): v is EmployeeDto { return isRecord(v) && positive(v.id) && positive(v.userId) && typeof v.userName === 'string' && !!v.userName.trim() && typeof v.position === 'string' && ['MANAGER', 'STOCKER', 'CASHIER'].includes(v.position.toUpperCase()) }
export async function getEmployees(signal?: AbortSignal) {
  return parseApiList(await readApiData('/employees/list', signal), valid).map(p => ({ ...p, position: p.position.toUpperCase() as ApiEmployee['position'] })).sort((a, b) => a.userName.localeCompare(b.userName, 'pt-BR') || a.id - b.id)
}
export class EmployeeWriteUncertainError extends Error { constructor() { super('Não foi possível confirmar a alteração. Consulte a equipe antes de tentar novamente.') } }
export async function writeEmployee(method: 'POST' | 'PATCH' | 'DELETE', id?: number, body?: unknown) {
  if (method !== 'POST' && !positive(id)) throw new Error('Funcionário inválido.')
  const path = method === 'POST' ? '/employees/registration' : `/employees/${method === 'PATCH' ? 'update' : 'delete'}/${id}` as const
  let response: Response
  try { response = await apiRequest(path, { method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }) }
  catch { throw new EmployeeWriteUncertainError() }
  const expected = method === 'POST' ? 201 : method === 'PATCH' ? 200 : 204
  if (response.status >= 500 || response.ok && response.status !== expected) throw new EmployeeWriteUncertainError()
  if (response.status !== expected) throw new ApiHttpError(response.status)
}
