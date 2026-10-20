import type { AssistantConversation, AssistantMessage } from '../types/assistantView'

export const priorityReply: Omit<AssistantMessage, 'id'> = {
  role: 'assistant', text: 'Comece pela gôndola A12, no setor de Bebidas.',
  items: [{ title: 'Coca-Cola 2 L', detail: '0 na gôndola · 84 no depósito · Repor 12 unidades' }, { title: 'Água mineral 500 ml', detail: '0 na gôndola · 120 no depósito · Repor 24 unidades' }],
  action: { label: 'Ver central de reposição', path: '/reposicoes' },
}

export const assistantConversationsDemo: AssistantConversation[] = [
  { id: 'priority', title: 'Reposições prioritárias', when: 'Hoje · 14:30', messages: [{ id: 'u1', role: 'user', text: 'Quais reposições devo priorizar agora?' }, { ...priorityReply, id: 'a1' }] },
  { id: 'sales', title: 'Vendas da semana', when: 'Hoje · 09:15', messages: [{ id: 'u2', role: 'user', text: 'Como foram as vendas da semana?' }, { id: 'a2', role: 'assistant', text: 'No cenário demonstrativo, a receita da semana foi de R$ 313.760, com crescimento de 8,7%.', action: { label: 'Ver Insights', path: '/insights' } }] },
  { id: 'stock', title: 'Estoque de bebidas', when: 'Ontem · 16:42', messages: [{ id: 'u3', role: 'user', text: 'Como está o estoque de bebidas?' }, { ...priorityReply, id: 'a3' }] },
]
