import type { CsrfResponse } from '../types/auth'
import { clearApiReads } from './apiReadCache'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')
type ApiRequestOptions = Omit<RequestInit, 'credentials' | 'cache' | 'redirect'>

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function readApiJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new Error('A loja retornou uma resposta inesperada. Tente novamente mais tarde.')
  }
}

async function send(path: `/${string}`, options: ApiRequestOptions = {}): Promise<Response> {
  options.signal?.throwIfAborted()
  const timeout = AbortSignal.timeout(15000)
  try {
    return await fetch(`${apiBaseUrl}/api/v1${path}`, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
      signal: options.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout,
    })
  } catch (error: unknown) {
    if (options.signal?.aborted) throw error
    if (timeout.aborted || error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('A API da loja demorou mais de 15 segundos para responder. Aguarde antes de tentar novamente.', { cause: error })
    }
    throw new Error('Não foi possível conectar à loja. Verifique sua conexão e tente novamente.', { cause: error })
  }
}

export async function getCsrfToken(signal?: AbortSignal | null): Promise<CsrfResponse> {
  const response = await send('/auth/login', { signal })
  if (!response.ok) throw new Error('Não foi possível iniciar uma sessão segura. Tente novamente.')
  const data = await readApiJson(response)
  if (!isRecord(data) || data.headerName !== 'X-CSRF-TOKEN'
    || typeof data.token !== 'string' || !data.token.trim()) {
    throw new Error('A loja retornou uma resposta inesperada. Tente novamente mais tarde.')
  }
  return { headerName: data.headerName, token: data.token }
}

// JWT cookies and automatic renewal belong to the API. Never replay a failed write.
export async function apiRequest(path: `/${string}`, options: ApiRequestOptions = {}): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    clearApiReads()
    const csrf = await getCsrfToken(options.signal)
    headers.set(csrf.headerName, csrf.token)
  }
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return send(path, { ...options, method, headers })
  try { return await send(path, { ...options, method, headers }) } finally { clearApiReads() }
}
