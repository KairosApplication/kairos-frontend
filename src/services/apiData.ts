import { apiRequest, readApiJson } from './apiClient'

export class ApiHttpError extends Error {
  public status: number
  constructor(status: number) {
    super(status === 401 ? 'Sua sessão expirou. Entre novamente.'
      : status === 403 ? 'Você não tem permissão para esta operação.'
      : status === 404 ? 'O registro não está mais disponível. Atualize a consulta.'
      : status === 409 ? 'Há um conflito com os dados cadastrados. Atualize a consulta.'
      : 'Não foi possível concluir a solicitação à loja. Tente novamente.')
    this.name = 'ApiHttpError'
    this.status = status
  }
}
export function invalidApiData(): never { throw new Error('A loja retornou dados incompletos ou inválidos. Atualize a consulta.') }
export async function readApiList<T extends { id: number }>(path: `/${string}`, valid: (value: unknown) => value is T, signal?: AbortSignal): Promise<T[]> {
  const response = await apiRequest(path, { signal })
  if (response.status !== 200) throw new ApiHttpError(response.status)
  const data = await readApiJson(response)
  if (!Array.isArray(data) || !data.every(valid) || new Set(data.map(item => item.id)).size !== data.length) invalidApiData()
  return data
}
