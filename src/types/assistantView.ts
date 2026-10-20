export type AssistantMessage = { id: string; role: 'user' | 'assistant'; text: string; items?: { title: string; detail: string }[]; action?: { label: string; path: string } }
export type AssistantConversation = { id: string; title: string; when: string; messages: AssistantMessage[] }
