import type { AnswerSource, AssistantConversation, AssistantMessage } from '../types/assistantView'
import { getCsrfToken, isRecord, readApiJson } from './apiClient'

export function chatbotConfigured(): boolean {
  return Boolean(import.meta.env.VITE_CHATBOT_API_URL?.trim())
}

export function publicSources(value: unknown): AnswerSource[] {
  if (!Array.isArray(value)) return []
  return (['pdf', 'database', 'memory'] as const).filter((source) => value.includes(source))
}

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const base = import.meta.env.VITE_CHATBOT_API_URL?.trim().replace(/\/+$/, '')
  if (!base) throw new Error('O serviço do chatbot ainda não foi configurado.')
  const csrf = await getCsrfToken(options.signal)
  const headers = new Headers(options.headers)
  headers.set(csrf.headerName, csrf.token)
  let response: Response
  try {
    response = await fetch(`${base}/api/v1/me/chat${path}`, {
      ...options, headers, credentials: 'include', cache: 'no-store', redirect: 'error',
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(180000)]) : AbortSignal.timeout(180000),
    })
  } catch {
    throw new Error('Não foi possível conectar ao assistente. Tente novamente.')
  }
  if (response.status === 401) throw new Error('Sua sessão expirou. Entre novamente no Kairos.')
  if (response.status === 403) throw new Error('Seu perfil não permite acessar estes dados.')
  if (response.status === 409) throw new Error('Esta conversa está sendo atualizada. Aguarde e tente novamente.')
  if (!response.ok) throw new Error('O assistente está indisponível no momento. Tente novamente.')
  return readApiJson(response)
}

function conversation(value: unknown): AssistantConversation {
  if (!isRecord(value) || typeof value.id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(value.id)) {
    throw new Error('O assistente retornou uma conversa inválida.')
  }
  const messages: AssistantMessage[] = []
  if (Array.isArray(value.messages)) for (const item of value.messages) {
    if (!isRecord(item) || (item.sender !== 'USER' && item.sender !== 'AI') || typeof item.content !== 'string') continue
    messages.push({ id: `${value.id}-${messages.length}`, role: item.sender === 'AI' ? 'assistant' : 'user',
      text: item.content, sources: item.sender === 'AI' ? publicSources(item.sources) : [] })
  }
  const date = typeof value.createdAt === 'string' ? new Date(value.createdAt) : null
  return { id: value.id, title: messages.find((item) => item.role === 'user')?.text.slice(0, 60) || 'Conversa',
    when: date && Number.isFinite(date.getTime()) ? date.toLocaleDateString('pt-BR') : 'Conversa salva', messages }
}

export async function listConversations(page = 0, signal?: AbortSignal) {
  const value = await request(`/conversations?page=${page}&size=20`, { signal })
  if (!isRecord(value) || !Array.isArray(value.items) || typeof value.hasNext !== 'boolean') {
    throw new Error('O assistente retornou uma lista inválida.')
  }
  return { items: value.items.map(conversation), hasNext: value.hasNext }
}

export async function createConversation(signal?: AbortSignal): Promise<AssistantConversation> {
  return conversation(await request('/conversations', { method: 'POST', signal }))
}

export async function readConversation(id: string, signal?: AbortSignal): Promise<AssistantConversation> {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) throw new Error('Conversa inválida.')
  return conversation(await request(`/conversations/${id}`, { signal }))
}

export async function sendMessage(question: string, conversationId: string, signal?: AbortSignal): Promise<AssistantMessage> {
  const value = await request('/messages', { method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, conversationId }) })
  if (!isRecord(value) || typeof value.answer !== 'string' || value.conversationId !== conversationId
      || typeof value.approved !== 'boolean' || typeof value.blocked !== 'boolean') {
    throw new Error('O assistente retornou uma resposta inválida.')
  }
  return { id: crypto.randomUUID(), role: 'assistant', text: value.answer,
    sources: value.approved && !value.blocked ? publicSources(value.sources) : [] }
}
