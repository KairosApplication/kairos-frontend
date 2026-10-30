export const chatId = '000000000000000000000001'
export function makeChatFixture() { return { conversations: [{ id: chatId, status: 'ACTIVE', messages: [{ sender: 'AI', content: 'Como posso ajudar na operação?' }] as { sender: string; content: string }[] }] } }
export function handleChat(db: ReturnType<typeof makeChatFixture>, method: string, pathname: string, body?: unknown): { status: number; json?: unknown } | null {
  const path = pathname.replace('/api/v1/me/chat', '')
  if (!pathname.startsWith('/api/v1/me/chat')) return null
  if (method === 'GET' && path === '/conversations') return { status: 200, json: { items: db.conversations.map(c => ({ id: c.id, status: c.status })), page: 0, size: 20, hasNext: false } }
  if (method === 'POST' && path === '/conversations') { const c = { id: String(db.conversations.length + 1).padStart(24, '0'), status: 'ACTIVE', messages: [] }; db.conversations.push(c); return { status: 201, json: { id: c.id, status: c.status } } }
  if (method === 'GET' && path.startsWith('/conversations/')) { const c = db.conversations.find(c => c.id === path.split('/').at(-1)); return c ? { status: 200, json: c } : { status: 404, json: {} } }
  if (method === 'POST' && path === '/messages') {
    const data = body as { question: string; conversationId: string }
    const c = db.conversations.find(c => c.id === data.conversationId)
    if (!c) return { status: 404, json: {} }
    c.messages.push({ sender: 'USER', content: data.question }, { sender: 'AI', content: 'Resposta recebida do serviço de IA.' })
    return { status: 200, json: { answer: 'Resposta recebida do serviço de IA.', conversationId: c.id, executionId: '000000000000000000000099', blocked: false, approved: true } }
  }
  return null
}
