import { useRef, useState, type SubmitEvent } from 'react'
import { Lightbulb, Plus, Search, Send, ShieldCheck } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useDemoData from '../../hooks/useDemoData'
import { getAssistantView, getDemonstrativeReply } from '../../services/assistantViewService'
import type { AssistantConversation } from '../../types/assistantView'
import { chatbotConfigured } from '../../services/chatbotService'
import AssistantMessageBubble from './AssistantMessageBubble'
import ConnectedAssistant from './ConnectedAssistant'
import './styles.css'

export default function KairosAssistant() {
  return chatbotConfigured() ? <ConnectedAssistant /> : <DemonstrativeAssistant />
}

function DemonstrativeAssistant() {
  const { data, loading, error, retry } = useDemoData(getAssistantView)
  const [local, setLocal] = useState<AssistantConversation[] | null>(null)
  const [selectedId, setSelectedId] = useState('priority')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [sendError, setSendError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const messagesArea = useRef<HTMLDivElement>(null)
  const pendingRef = useRef(false)
  const sequence = useRef(0)
  const conversations = local ?? data ?? []
  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0]

  function newConversation() {
    const id = `demo-${++sequence.current}`
    setLocal([{ id, title: 'Nova conversa', when: 'Nesta demonstração', messages: [] }, ...conversations])
    setSelectedId(id); setDraft(''); setSearch(''); setSendError('')
    input.current?.focus()
  }
  async function send(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = draft.trim()
    if (!prompt || !selected || pendingRef.current) return
    pendingRef.current = true; setPending(true); setSendError('')
    const target = selected.id
    const id = `message-${++sequence.current}`
    setLocal((previous) => (previous ?? data ?? []).map((conversation) => conversation.id === target ? { ...conversation, title: conversation.messages.length ? conversation.title : prompt.slice(0, 40), messages: [...conversation.messages, { id, role: 'user', text: prompt }] } : conversation))
    setDraft('')
    try {
      const response = await getDemonstrativeReply(prompt)
      setLocal((previous) => (previous ?? []).map((conversation) => conversation.id === target ? { ...conversation, messages: [...conversation.messages, { ...response, id: `${id}-reply` }] } : conversation))
    } catch {
      setLocal((previous) => (previous ?? []).map((conversation) => conversation.id === target ? { ...conversation, messages: conversation.messages.filter((message) => message.id !== id) } : conversation))
      setDraft(prompt); setSendError('Não foi possível preparar a resposta demonstrativa. Tente novamente.')
    } finally {
      pendingRef.current = false; setPending(false); input.current?.focus()
      setTimeout(() => { if (messagesArea.current) messagesArea.current.scrollTop = messagesArea.current.scrollHeight }, 0)
    }
  }

  return <VisualPage title="KAIROS IA" description="Seu assistente para entender os dados e decidir os próximos passos." className="kairos-assistant"
    actions={<Button icon={<Plus />} disabled={!data} onClick={newConversation}>Nova conversa</Button>}>
    {error ? <Feedback kind="error" title="Não foi possível carregar as conversas." onRetry={retry} /> : loading ? <Feedback kind="loading" title="Carregando conversas…" /> : <div className="kairos-assistant__layout">
      <Card title="Conversas" className="kairos-assistant__conversations">
        <TextField label="Buscar conversa" type="search" placeholder="Buscar conversa" icon={<Search size={18} />} value={search} onChange={(event) => setSearch(event.target.value)} />
        <nav aria-label="Conversas demonstrativas">{conversations.filter((conversation) => conversation.title.toLowerCase().includes(search.trim().toLowerCase())).map((conversation) => <button key={conversation.id} type="button" aria-pressed={selected?.id === conversation.id} onClick={() => { setSelectedId(conversation.id); setSendError('') }}><strong>{conversation.title}</strong><small>{conversation.when}</small></button>)}</nav>
        {!conversations.some((conversation) => conversation.title.toLowerCase().includes(search.trim().toLowerCase())) && <p className="visual-note">Nenhuma conversa encontrada.</p>}
        <div className="kairos-assistant__context"><h3><ShieldCheck size={18} aria-hidden="true" />Contexto da loja</h3><p>Unidade Centro<br />Cenário demonstrativo · 14:32</p></div>
      </Card>
      <Card title={selected?.title ?? 'Nova conversa'} actions={<Badge tone="warning">KAIROS IA · Demo</Badge>} className="kairos-assistant__chat">
        <div ref={messagesArea} className="kairos-assistant__messages" role="log" aria-label="Mensagens da conversa" aria-live="polite">
          {!selected?.messages.length && <div className="kairos-assistant__empty"><Lightbulb size={28} aria-hidden="true" /><h3>Como podemos cuidar da loja hoje?</h3><p>Experimente perguntar sobre vendas, estoque ou reposições.</p></div>}
          {selected?.messages.map((message) => <AssistantMessageBubble key={message.id} message={message} demo />)}
          {pending && <p role="status" className="visual-note">Preparando resposta demonstrativa…</p>}
        </div>
        <form className="kairos-assistant__composer" onSubmit={send}><TextField ref={input} label="Mensagem para KAIROS IA" placeholder="Pergunte sobre vendas, estoque ou reposições…" value={draft} maxLength={1000} onChange={(event) => setDraft(event.target.value)} disabled={pending} /><Button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || pending} icon={<Send size={20} />} /></form>
        {sendError && <p role="alert" className="kairos-assistant__error">{sendError}</p>}
        <p className="kairos-assistant__notice">Demonstração com respostas predefinidas. Nenhuma mensagem é enviada a um serviço de IA.</p>
      </Card>
    </div>}
  </VisualPage>
}
