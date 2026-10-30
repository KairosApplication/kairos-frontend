import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Lightbulb, Plus, Search, Send } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import * as service from '../../services/chatbotService'
import type { AssistantConversation, AssistantMessage } from '../../types/assistantView'
import AssistantMessageBubble from './AssistantMessageBubble'

export default function ConnectedAssistant() {
  const [conversations, setConversations] = useState<AssistantConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [selectionAttempt, setSelectionAttempt] = useState(0)
  const busyRef = useRef(false)
  const activeRequest = useRef<AbortController | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const selected = conversations.find((item) => item.id === selectedId)

  useEffect(() => {
    const controller = new AbortController()
    void service.listConversations(0, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setConversations(result.items); setHasNext(result.hasNext); setPage(0)
      setLoadingMessages(result.items.length > 0)
      setSelectedId(result.items[0]?.id ?? null); setLoadError(false); setLoading(false)
    }).catch(() => { if (!controller.signal.aborted) { setLoadError(true); setLoading(false) } })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    if (!selectedId) return
    const controller = new AbortController()
    void service.readConversation(selectedId, controller.signal).then((value) => {
      if (controller.signal.aborted) return
      setMessages(value.messages)
      setConversations((previous) => previous.map((item) => item.id === value.id ? { ...item, title: value.title } : item))
      setLoadingMessages(false)
    }).catch(() => { if (!controller.signal.aborted) { setError('Não foi possível abrir esta conversa. Selecione-a novamente para tentar.'); setLoadingMessages(false) } })
    return () => controller.abort()
  }, [selectedId, selectionAttempt])
  useEffect(() => () => activeRequest.current?.abort(), [])
  useEffect(() => { if (area.current) area.current.scrollTop = area.current.scrollHeight }, [messages, busy])

  function select(id: string) {
    setMessages([]); setLoadingMessages(true); setSelectedId(id); setDraft(''); setError('')
    setSelectionAttempt((value) => value + 1)
  }
  async function create() {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError('')
    const controller = new AbortController(); activeRequest.current = controller
    try {
      const value = await service.createConversation(controller.signal)
      if (controller.signal.aborted) return
      setConversations((previous) => [value, ...previous]); select(value.id)
    } catch { if (!controller.signal.aborted) setError('Não foi possível criar a conversa. Tente novamente.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  async function more() {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true)
    const controller = new AbortController(); activeRequest.current = controller
    try {
      const result = await service.listConversations(page + 1, controller.signal)
      if (controller.signal.aborted) return
      setConversations((previous) => [...previous, ...result.items.filter((item) => !previous.some((existing) => existing.id === item.id))])
      setHasNext(result.hasNext); setPage(page + 1)
    } catch { if (!controller.signal.aborted) setError('Não foi possível carregar mais conversas.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  async function send(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = draft.trim()
    if (!question || !selectedId || busyRef.current || loadingMessages) return
    busyRef.current = true; setBusy(true); setError('')
    const controller = new AbortController(); activeRequest.current = controller
    const user: AssistantMessage = { id: crypto.randomUUID(), role: 'user', text: question }
    setMessages((previous) => [...previous, user]); setDraft('')
    try {
      const answer = await service.sendMessage(question, selectedId, controller.signal)
      if (controller.signal.aborted) return
      setMessages((previous) => [...previous, answer])
      setConversations((previous) => previous.map((item) => item.id === selectedId && !messages.length ? { ...item, title: question.slice(0, 60) } : item))
    } catch (failure: unknown) {
      if (!controller.signal.aborted) {
        setMessages((previous) => previous.filter((item) => item.id !== user.id)); setDraft(question)
        setError(failure instanceof Error ? failure.message : 'Não foi possível enviar a pergunta.')
      }
    } finally { busyRef.current = false; setBusy(false) }
  }
  const filtered = conversations.filter((item) => item.title.toLowerCase().includes(search.trim().toLowerCase()))
  return <VisualPage title="KAIROS IA" description="Seu assistente para entender os dados e decidir os próximos passos." className="kairos-assistant"
    footer={<span>Conversas da sua conta</span>}
    actions={<Button icon={<Plus />} disabled={loading || loadError || busy} onClick={() => void create()}>Nova conversa</Button>}>
    {loadError ? <Feedback kind="error" title="Não foi possível carregar as conversas." onRetry={() => { setLoading(true); setLoadError(false); setAttempt((value) => value + 1) }} />
      : loading ? <Feedback kind="loading" title="Carregando conversas…" /> : <div className="kairos-assistant__layout">
        <Card title="Conversas" className="kairos-assistant__conversations">
          <TextField label="Buscar conversa" type="search" placeholder="Buscar conversa" icon={<Search size={18} />} value={search} onChange={(event) => setSearch(event.target.value)} />
          <nav aria-label="Conversas">{filtered.map((item) => <button key={item.id} type="button" disabled={busy} aria-pressed={selectedId === item.id} onClick={() => select(item.id)}><strong>{item.title}</strong><small>{item.when}</small></button>)}</nav>
          {!filtered.length && <p className="visual-note">Nenhuma conversa encontrada.</p>}
          {hasNext && <Button disabled={busy} onClick={() => void more()}>Mais conversas</Button>}
        </Card>
        <Card title={selected?.title ?? 'Nova conversa'} actions={<Badge tone="success">KAIROS IA</Badge>} className="kairos-assistant__chat">
          <div ref={area} className="kairos-assistant__messages" role="log" aria-label="Mensagens da conversa" aria-live="polite">
            {loadingMessages ? <p role="status">Carregando conversa…</p> : !messages.length && <div className="kairos-assistant__empty"><Lightbulb size={28} aria-hidden="true" /><h3>Como podemos cuidar da loja hoje?</h3><p>{selectedId ? 'Pergunte sobre vendas, estoque ou reposições.' : 'Crie uma conversa para começar.'}</p></div>}
            {messages.map((message) => <AssistantMessageBubble key={message.id} message={message} />)}
            {busy && <p role="status" className="visual-note">Processando solicitação…</p>}
          </div>
          <form className="kairos-assistant__composer" onSubmit={send}><TextField label="Mensagem para KAIROS IA" placeholder="Pergunte sobre vendas, estoque ou reposições…" value={draft} maxLength={10000} onChange={(event) => setDraft(event.target.value)} disabled={busy || loadingMessages || !selectedId} /><Button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || busy || loadingMessages || !selectedId} icon={<Send size={20} />} /></form>
          {error && <p role="alert" className="kairos-assistant__error">{error}</p>}
        </Card>
      </div>}
  </VisualPage>
}
