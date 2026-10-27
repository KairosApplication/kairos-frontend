import { apiRequest, getCsrfToken, isRecord, readApiJson } from './apiClient'
import { ApiHttpError, invalidApiData } from './apiData'
export type ChatConversation = { id: string; status: string; createdAt?: string | null; updatedAt?: string | null }
export type ChatMessage = { sender: string; content: string; timestamp?: string | null }
export type ChatHistory = { id: string; status: string; summary?: string | null; messages: ChatMessage[] }
const objectId = (v: unknown): v is string => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v)
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim()
export class ChatUncertainError extends Error { constructor() { super('Não foi possível confirmar a operação. Atualize a conversa antes de tentar novamente.') } }
function origin() {
  const url = new URL(import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000')
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('Configure uma origem válida para o serviço de IA.')
  return url.origin
}
async function request(path: string, method: 'GET' | 'POST', body?: unknown, signal?: AbortSignal) {
  const base = origin()
  const session = await apiRequest('/auth/me', { signal })
  if (session.status !== 200) throw new ApiHttpError(session.status)
  const csrf = await getCsrfToken(signal)
  let response: Response
  try { response = await fetch(`${base}/api/v1/me/chat${path}`, { method, credentials: 'include', cache: 'no-store', redirect: 'error', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(method === 'POST' ? 120000 : 15000)]) : AbortSignal.timeout(method === 'POST' ? 120000 : 15000), headers: { [csrf.headerName]: csrf.token, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }) }
  catch (cause) { if (signal?.aborted) throw cause; if (method === 'POST') throw new ChatUncertainError(); throw new Error('Não foi possível conectar ao serviço de IA.', { cause }) }
  const expected = method === 'GET' ? 200 : path === '/conversations' ? 201 : 200
  if (response.status >= 500 && method === 'POST' || response.ok && response.status !== expected) throw new ChatUncertainError()
  if (response.status !== expected) throw new ApiHttpError(response.status)
  try { return await readApiJson(response) } catch (cause) { if (method === 'POST') throw new ChatUncertainError(); throw cause }
}
export async function getConversations(page: number, signal?: AbortSignal) {
  if (!Number.isInteger(page) || page < 0 || page > 10000) throw new Error('Página inválida.')
  const value = await request(`/conversations?page=${page}&size=20`, 'GET', undefined, signal)
  if (!isRecord(value) || value.page !== page || value.size !== 20 || typeof value.hasNext !== 'boolean' || !Array.isArray(value.items) || !value.items.every((v): v is ChatConversation => isRecord(v) && objectId(v.id) && text(v.status)) || new Set(value.items.map(v => v.id)).size !== value.items.length) invalidApiData()
  return { items: value.items, hasNext: value.hasNext }
}
export async function getConversation(id: string, signal?: AbortSignal): Promise<ChatHistory> {
  if (!objectId(id)) throw new Error('Conversa inválida.')
  const value = await request(`/conversations/${id}`, 'GET', undefined, signal)
  if (!isRecord(value) || value.id !== id || !text(value.status) || !Array.isArray(value.messages) || !value.messages.every((v): v is ChatMessage => isRecord(v) && text(v.sender) && typeof v.content === 'string')) invalidApiData()
  return { id, status: value.status, messages: value.messages }
}
export async function createConversation(signal?: AbortSignal): Promise<string> {
  const value = await request('/conversations', 'POST', undefined, signal)
  if (!isRecord(value) || !objectId(value.id)) throw new ChatUncertainError()
  return value.id
}
export async function sendChatMessage(conversationId: string, question: string, signal?: AbortSignal) {
  if (!objectId(conversationId) || !question.trim() || question.length > 10000) throw new Error('Informe uma mensagem de até 10000 caracteres.')
  const value = await request('/messages', 'POST', { question: question.trim(), conversationId }, signal)
  if (!isRecord(value) || value.conversationId !== conversationId || !objectId(value.executionId) || !text(value.answer) || typeof value.blocked !== 'boolean' || typeof value.approved !== 'boolean') throw new ChatUncertainError()
  return { answer: value.answer, blocked: value.blocked, approved: value.approved }
}
