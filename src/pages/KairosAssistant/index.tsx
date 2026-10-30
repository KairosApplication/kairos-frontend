import { useCallback, useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Lightbulb, Plus, Send } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useApiData from '../../hooks/useApiData'
import { useAuth } from '../../hooks/useAuth'
import { ApiHttpError } from '../../services/apiData'
import { ChatUncertainError, createConversation, getConversation, getConversations, sendChatMessage } from '../../services/assistantApiService'
import './styles.css'
function Conversation({ id, onBusy }: { id: string; onBusy: (busy: boolean) => void }) {
  const loader = useCallback((signal?: AbortSignal) => getConversation(id, signal), [id])
  const { data, error, reload, fail } = useApiData(loader)
  const { refreshSession } = useAuth()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const pending = useRef(false)
  const request = useRef<AbortController | null>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function send(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || !data || !draft.trim()) return
    pending.current = true; setBusy(true); onBusy(true); setFailure(''); setNotice('')
    const controller = new AbortController(); request.current = controller
    try {
      const reply = await sendChatMessage(id, draft, controller.signal)
      if (controller.signal.aborted) return
      setDraft('')
      if (reply.blocked || !reply.approved) setNotice(reply.answer)
      await reload(); setTimeout(() => input.current?.focus(), 0)
    } catch (cause) {
      if (controller.signal.aborted) return
      if (cause instanceof ChatUncertainError) { setNotice('Confira o histórico antes de reenviar sua mensagem.'); fail(cause) }
      else { setFailure(cause instanceof Error ? cause.message : 'Não foi possível enviar a mensagem.'); if (cause instanceof ApiHttpError && cause.status === 401) void refreshSession() }
    } finally { pending.current = false; if (!controller.signal.aborted) { setBusy(false); onBusy(false) } }
  }
  return <Card title={`Conversa ${id.slice(-6)}`} className="kairos-assistant__chat">
    {error ? <Feedback kind="error" title="Não foi possível carregar a conversa." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando conversa…" /> : <>
      <div role="log" aria-label="Mensagens da conversa" aria-live="polite" aria-relevant="additions text" className="kairos-assistant__messages">
        {!data.messages.length && <p>Como podemos cuidar da loja hoje?</p>}
        {data.messages.filter(m => ['USER', 'AI', 'ASSISTANT'].includes(m.sender.toUpperCase())).map((m, i) => <article key={`${i}-${m.sender}`} className={`kairos-message kairos-message--${m.sender.toUpperCase() === 'USER' ? 'user' : 'assistant'}`} aria-label={m.sender.toUpperCase() === 'USER' ? 'Sua mensagem' : 'Resposta da KAIROS IA'}>{m.sender.toUpperCase() !== 'USER' && <h3><Lightbulb size={20} aria-hidden="true" />KAIROS IA</h3>}<p>{m.content}</p></article>)}
      </div>
      {busy && <p role="status">Aguardando resposta da KAIROS IA…</p>}
      <form className="kairos-assistant__composer" onSubmit={send}><TextField ref={input} label="Mensagem para KAIROS IA" maxLength={10000} value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} /><Button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || busy} icon={<Send />} /></form>
    </>}
    {failure && <p role="alert">{failure}</p>}{notice && <p role="status">{notice}</p>}
    <p className="kairos-assistant__notice">Revise as respostas antes de tomar decisões. A IA pode cometer erros.</p>
  </Card>
}
export default function KairosAssistant() {
  const [page, setPage] = useState(0)
  const loader = useCallback((signal?: AbortSignal) => getConversations(page, signal), [page])
  const { data, error, reload, fail } = useApiData(loader)
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const pending = useRef(false)
  const createRequest = useRef<AbortController | null>(null)
  useEffect(() => () => createRequest.current?.abort(), [])
  async function create() {
    if (pending.current || chatBusy || !data) return
    pending.current = true; setBusy(true); setFailure('')
    const controller = new AbortController(); createRequest.current = controller
    try { const id = await createConversation(controller.signal); if (!controller.signal.aborted) { setSelected(id); await reload() } }
    catch (cause) { if (!controller.signal.aborted) { if (cause instanceof ChatUncertainError || cause instanceof ApiHttpError && cause.status === 401) fail(cause); else setFailure(cause instanceof Error ? cause.message : 'Não foi possível criar a conversa.') } }
    finally { pending.current = false; if (!controller.signal.aborted) setBusy(false) }
  }
  const id = selected ?? data?.items[0]?.id
  return <VisualPage title="KAIROS IA" description="Seu assistente para entender os dados e decidir os próximos passos." className="kairos-assistant" footer="Conversas do usuário autenticado"
    actions={<Button icon={<Plus />} loading={busy} disabled={!data || chatBusy} onClick={() => void create()}>Nova conversa</Button>}>
    {failure && <p role="alert">{failure}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar as conversas." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando conversas…" /> : <div className="kairos-assistant__layout">
      <Card title="Conversas" className="kairos-assistant__conversations"><TextField label="Buscar conversa por ID" type="search" value={search} disabled={busy || chatBusy} onChange={e => setSearch(e.target.value)} /><nav aria-label="Conversas">{data.items.filter(c => c.id.toLowerCase().includes(search.trim().toLowerCase())).map(c => <button type="button" key={c.id} aria-pressed={id === c.id} disabled={busy || chatBusy} onClick={() => setSelected(c.id)}><strong>Conversa {c.id.slice(-6)}</strong><small>{c.status}</small></button>)}</nav>
        {!data.items.length && <p>Nenhuma conversa encontrada.</p>}
        <div><Button variant="secondary" disabled={page === 0 || busy || chatBusy} onClick={() => { setSelected(null); setPage(page - 1) }}>Anterior</Button><Button variant="secondary" disabled={!data.hasNext || busy || chatBusy} onClick={() => { setSelected(null); setPage(page + 1) }}>Próxima</Button></div>
      </Card>{id ? <Conversation key={id} id={id} onBusy={setChatBusy} /> : <Card title="Comece uma conversa"><p>Crie uma conversa para enviar sua mensagem.</p></Card>}
    </div>}
  </VisualPage>
}
