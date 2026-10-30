export type AnswerSource = 'pdf' | 'database' | 'memory'
export type AssistantMessage = { id: string; role: 'user' | 'assistant'; text: string; sources?: AnswerSource[]; items?: { title: string; detail: string }[]; action?: { label: string; path: string } }
export type AssistantConversation = { id: string; title: string; when: string; messages: AssistantMessage[] }
