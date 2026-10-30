import { Link } from 'react-router'
import { ArrowRight, Lightbulb } from 'lucide-react'
import type { AnswerSource, AssistantMessage } from '../../types/assistantView'
import { publicSources } from '../../services/assistantSources'

const labels: Record<AnswerSource, string> = { pdf: 'Documento PDF', database: 'Banco de dados', memory: 'Memória' }

export default function AssistantMessageBubble({ message, demo = false }: { message: AssistantMessage; demo?: boolean }) {
  const sources = !demo && message.role === 'assistant' ? publicSources(message.sources) : []
  return <article className={`kairos-message kairos-message--${message.role}`} aria-label={message.role === 'user' ? 'Sua mensagem' : demo ? 'Resposta demonstrativa' : 'Resposta do assistente'}>
    {message.role === 'assistant' && <h3><Lightbulb size={20} aria-hidden="true" />KAIROS IA</h3>}
    <p>{message.text}</p>
    {message.items && <><p className="kairos-message__intro">Há 2 produtos em ruptura e unidades disponíveis no depósito.<br />Prioridades do cenário demonstrativo das 14:27:</p><ol>{message.items.map((item) => <li key={item.title}><strong>{item.title}</strong><small>{item.detail}</small></li>)}</ol></>}
    {message.action && <Link className="kairos-message__action" to={message.action.path}><ArrowRight size={18} aria-hidden="true" />{message.action.label}</Link>}
    {sources.length > 0 && <div className="kairos-message__sources" aria-label="Fontes consultadas"><span>Fontes consultadas:</span><ul>{sources.map((source) => <li key={source}>{labels[source]}</li>)}</ul></div>}
  </article>
}
