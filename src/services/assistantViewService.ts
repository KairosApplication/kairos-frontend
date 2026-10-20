import { assistantConversationsDemo, priorityReply } from '../mocks/assistantView'
import type { AssistantConversation, AssistantMessage } from '../types/assistantView'
export function getAssistantView(): Promise<AssistantConversation[]> { return Promise.resolve(structuredClone(assistantConversationsDemo)) }

/** Resposta determinística local: nenhum modelo ou serviço de IA é consultado. */
export function getDemonstrativeReply(prompt: string): Promise<Omit<AssistantMessage, 'id'>> {
  const text = prompt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/venda|receita|semana/.test(text)) return Promise.resolve({ role: 'assistant', text: 'No cenário demonstrativo, a receita da semana foi de R$ 313.760, com crescimento de 8,7%. Mercearia representa 38% da receita.', action: { label: 'Ver Insights', path: '/insights' } })
  if (/repos|estoque|bebida|gondola/.test(text)) return Promise.resolve(structuredClone(priorityReply))
  return Promise.resolve({ role: 'assistant', text: 'Esta é uma conversa de demonstração com respostas predefinidas. Você pode experimentar perguntas sobre vendas, estoque ou reposições. Nenhuma análise nova dos dados da loja foi realizada.' })
}
