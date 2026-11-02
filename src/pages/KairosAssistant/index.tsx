import { useCallback, useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Plus, Send } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useApiData from '../../hooks/useApiData'
import { useAuth } from '../../hooks/useAuth'
import { ApiHttpError } from '../../services/apiData'
import { ChatUncertainError, chatErrorMessage, createConversation, getConversation, getConversations, sendChatMessage } from '../../services/assistantApiService'
import AssistantMessageBubble from './AssistantMessageBubble'
import './styles.css'
function Conversation({ id, onBusy }: { id: string; onBusy: (busy: boolean) => void }) {
  const loader = useCallback((signal?: AbortSignal) => getConversation(id, signal), [id])
  const { data, error, reload } = useApiData(loader, { keepData: true })
  const { refreshSession } = useAuth()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [needsSync, setNeedsSync] = useState(false)
  const pending = useRef(false)
  const request = useRef<AbortController | null>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function send(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || needsSync || !data || !draft.trim()) return
    pending.current = true; setBusy(true); onBusy(true); setFailure(''); setNotice('')
    const controller = new AbortController(); request.current = controller
    try {
      const reply = await sendChatMessage(id, draft, controller.signal)
      if (controller.signal.aborted) return
      setDraft('')
      if (reply.blocked || !reply.approved) setNotice(reply.answer)
      const history = await reload()
      if (!history) {
        setNeedsSync(true)
        if (reply.approved && !reply.blocked) setNotice('A mensagem foi processada, mas não foi possível atualizar o histórico. Atualize a conversa para continuar.')
      }
      setTimeout(() => input.current?.focus(), 0)
    } catch (cause) {
      if (controller.signal.aborted) return
      setFailure(chatErrorMessage(cause))
      if (cause instanceof ChatUncertainError) setNeedsSync(true)
      if (cause instanceof ApiHttpError && cause.status === 401) void refreshSession()
    } finally { pending.current = false; if (!controller.signal.aborted) { setBusy(false); onBusy(false) } }
  }
  async function synchronize() {
    if (pending.current) return
    pending.current = true; setBusy(true); onBusy(true)
    try {
      if (await reload()) {
        setNeedsSync(false); setFailure(''); setNotice('Histórico atualizado. Confira as mensagens antes de reenviar a pergunta.')
        setTimeout(() => input.current?.focus(), 0)
      }
    } finally { pending.current = false; setBusy(false); onBusy(false) }
  }
  return <Card title={`Conversa ${id.slice(-6)}`} className="kairos-assistant__chat">
    {!data ? error ? <Feedback kind="error" title="Não foi possível carregar a conversa." description={chatErrorMessage(error)} onRetry={() => void synchronize()} /> : <Feedback kind="loading" title="Carregando conversa…" /> : <>
      <div role="log" aria-label="Mensagens da conversa" aria-live="polite" aria-relevant="additions text" className="kairos-assistant__messages">
        {!data.messages.length && <p>Como podemos cuidar da loja hoje?</p>}
        {data.messages.filter(m => ['USER', 'AI', 'ASSISTANT'].includes(m.sender.toUpperCase())).map((m, i) => <AssistantMessageBubble key={`${i}-${m.sender}`} message={{ id: `${i}-${m.sender}`, role: m.sender.toUpperCase() === 'USER' ? 'user' : 'assistant', text: m.content, sources: m.sources }} />)}
      </div>
      {busy && <p role="status">Aguardando resposta da KAIROS IA…</p>}
      <form className="kairos-assistant__composer" onSubmit={send}><TextField ref={input} label="Mensagem para KAIROS IA" maxLength={10000} value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} /><Button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || busy || needsSync} icon={<Send />} /></form>
    </>}
    {(failure || data && error) && <p role="alert">{failure || chatErrorMessage(error)}</p>}
    {(needsSync || data && error) && <Button variant="secondary" disabled={busy} onClick={() => void synchronize()}>Atualizar histórico</Button>}
    {notice && <p role="status">{notice}</p>}
    <p className="kairos-assistant__notice">Revise as respostas antes de tomar decisões. A IA pode cometer erros.</p>
  </Card>
}
export default function KairosAssistant() {
  const [page, setPage] = useState(0)
  const loader = useCallback((signal?: AbortSignal) => getConversations(page, signal), [page])
  const { data, error, reload, fail } = useApiData(loader, { keepData: true })
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [needsSync, setNeedsSync] = useState(false)
  const pending = useRef(false)
  const createRequest = useRef<AbortController | null>(null)
  useEffect(() => () => createRequest.current?.abort(), [])
  async function create() {
    if (pending.current || chatBusy || needsSync || !data) return
    pending.current = true; setBusy(true); setFailure('')
    const controller = new AbortController(); createRequest.current = controller
    try { const id = await createConversation(controller.signal); if (!controller.signal.aborted) { setSelected(id); await reload() } }
    catch (cause) {
      if (!controller.signal.aborted) {
        setFailure(chatErrorMessage(cause))
        if (cause instanceof ChatUncertainError) setNeedsSync(true)
        if (cause instanceof ApiHttpError && cause.status === 401) fail(cause)
      }
    }
    finally { pending.current = false; if (!controller.signal.aborted) setBusy(false) }
  }
  async function synchronize() {
    if (pending.current || chatBusy) return
    pending.current = true; setBusy(true)
    try { if (await reload()) { setNeedsSync(false); setFailure('') } }
    finally { pending.current = false; setBusy(false) }
  }
  const id = selected ?? data?.items[0]?.id
  return <VisualPage title="KAIROS IA" description="Seu assistente para entender os dados e decidir os próximos passos." className="kairos-assistant" footer="Conversas do usuário autenticado"
    actions={<Button icon={<Plus />} loading={busy} disabled={!data || chatBusy || needsSync} onClick={() => void create()}>Nova conversa</Button>}>
    {(failure || data && error) && <p role="alert">{failure || chatErrorMessage(error)}</p>}
    {(needsSync || data && error) && <Button variant="secondary" disabled={busy || chatBusy} onClick={() => void synchronize()}>Atualizar conversas</Button>}
    {!data ? error ? <Feedback kind="error" title="Não foi possível carregar as conversas." description={chatErrorMessage(error)} onRetry={() => void synchronize()} /> : <Feedback kind="loading" title="Carregando conversas…" /> : <div className="kairos-assistant__layout">
      <Card title="Conversas" className="kairos-assistant__conversations"><TextField label="Buscar conversa por ID" type="search" value={search} disabled={busy || chatBusy} onChange={e => setSearch(e.target.value)} /><nav aria-label="Conversas">{data.items.filter(c => c.id.toLowerCase().includes(search.trim().toLowerCase())).map(c => <button type="button" key={c.id} aria-pressed={id === c.id} disabled={busy || chatBusy} onClick={() => setSelected(c.id)}><strong>Conversa {c.id.slice(-6)}</strong><small>{c.status}</small></button>)}</nav>
        {!data.items.length && <p>Nenhuma conversa encontrada.</p>}
        <div><Button variant="secondary" disabled={page === 0 || busy || chatBusy} onClick={() => { setSelected(null); setPage(page - 1) }}>Anterior</Button><Button variant="secondary" disabled={!data.hasNext || busy || chatBusy} onClick={() => { setSelected(null); setPage(page + 1) }}>Próxima</Button></div>
      </Card>{id ? <Conversation key={id} id={id} onBusy={setChatBusy} /> : <Card title="Comece uma conversa"><p>Crie uma conversa para enviar sua mensagem.</p></Card>}
    </div>}
  </VisualPage>
}
