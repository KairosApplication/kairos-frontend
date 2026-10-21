import { useState, type SubmitEvent } from 'react'
import { ChevronDown, Plus, Search, UserRound, UsersRound } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useDemoData from '../../hooks/useDemoData'
import useFormValidation from '../../hooks/useFormValidation'
import useStatusMessage from '../../hooks/useStatusMessage'
import StatusMessage from '../../components/StatusMessage'
import { getRestockingView } from '../../services/restockingViewService'
import type { RestockingTask } from '../../types/restockingView'
import './styles.css'

const columns = [{ id: 'pending', title: 'Pendentes', tone: 'warning' }, { id: 'active', title: 'Em andamento', tone: 'success' }, { id: 'done', title: 'Concluídas', tone: 'success' }] as const
const people = ['João Silva', 'Mariana Lima', 'Pedro Santos']

export default function Restocking() {
  const { data, loading, error, retry } = useDemoData(getRestockingView)
  const [created, setCreated] = useState<RestockingTask[]>([])
  const [search, setSearch] = useState('')
  const [responsible, setResponsible] = useState('all')
  const [day, setDay] = useState('today')
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<RestockingTask | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [message, setMessage] = useStatusMessage()
  const { formRef, errors, validate, clear, reset } = useFormValidation()
  const tasks = [...created, ...(data ?? [])]
  const normalized = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const filtered = tasks.filter((task) => day === 'today' && (responsible === 'all' || task.responsible === responsible)
    && `${task.shelf} ${task.product}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalized))

  function create(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate(event.currentTarget)) return
    const fields = new FormData(event.currentTarget)
    const product = String(fields.get('product') ?? '').trim()
    const shelf = String(fields.get('shelf') ?? '').trim().toUpperCase()
    const quantity = Number(fields.get('quantity'))
    if (!product || !shelf || !Number.isInteger(quantity) || quantity < 1) return
    setCreated((previous) => [{ id: `DEMO-${previous.length + 1}`, product, shelf, quantity, responsible: '', status: 'pending', urgent: false, time: 'Criada nesta demonstração' }, ...previous])
    setCreating(false); setDay('today'); setSearch(''); setResponsible('all')
    setMessage('Reposição adicionada à demonstração. Nenhuma tarefa foi enviada à loja.')
  }

  function taskCard(task: RestockingTask) {
    return <button type="button" className="restock-task" key={task.id} onClick={() => setSelected(task)} aria-label={`Ver reposição ${task.id}, gôndola ${task.shelf}`}>
      <span className="restock-task__top"><small>{task.id}</small><Badge tone={task.status === 'done' ? 'success' : task.urgent ? 'danger' : 'warning'}>{task.status === 'done' ? 'Concluída' : task.urgent ? 'Urgente' : 'Normal'}</Badge></span>
      <strong>Gôndola {task.shelf}</strong><span className="restock-task__product">{task.product} · {task.quantity} unidades</span>
      <span className="restock-task__person">{task.responsible ? <UserRound size={16} /> : <UsersRound size={16} />}{task.responsible || 'Sem responsável'}</span><small>{task.time}</small>
    </button>
  }

  return <VisualPage title="Central de Reposição" description="Da identificação à conclusão: acompanhe cada tarefa da equipe." className="restocking"
    actions={<Button icon={<Plus />} onClick={() => { reset(); setCreating(true) }}>Criar reposição</Button>}>
    <StatusMessage notice={message} />
    {error ? <Feedback kind="error" title="Não foi possível carregar as reposições." onRetry={retry} /> : loading ? <Feedback kind="loading" title="Carregando reposições…" /> : <>
      <div className="visual-toolbar restocking__toolbar"><TextField label="Buscar produto ou gôndola" placeholder="Buscar produto ou gôndola" icon={<Search size={18} />} type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="visual-filter-select"><SelectField label="Responsável" value={responsible} onChange={(event) => setResponsible(event.target.value)}><option value="all">Todos os responsáveis</option><option value="">Sem responsável</option>{people.map((person) => <option key={person}>{person}</option>)}</SelectField><ChevronDown size={18} aria-hidden="true" /></div>
        <div className="visual-filter-select restocking__date"><SelectField label="Data" value={day} onChange={(event) => setDay(event.target.value)}><option value="today">Hoje · 25 set</option><option value="yesterday">Ontem · 24 set</option></SelectField><ChevronDown size={18} aria-hidden="true" /></div>
        <Badge tone="success">Amostra · 14:32</Badge>
      </div>
      <div className="restocking__board">{columns.map((column) => {
        const entries = filtered.filter((task) => task.status === column.id)
        return <section className="restocking__column" key={column.id} aria-label={column.title}>
          <header><h2>{column.title}</h2><Badge tone={column.tone}>{entries.length}</Badge></header>
          <div className="restocking__tasks">{entries.slice(0, column.id === 'pending' ? 3 : 2).map(taskCard)}</div>
          {!entries.length && <p className="visual-note">Nenhuma reposição neste filtro.</p>}
          <Button variant="ghost" onClick={() => setExpanded(column.id)}>Ver todas as {entries.length} {column.title.toLowerCase()} →</Button>
        </section>
      })}</div>
    </>}
    <Modal open={creating} onClose={() => setCreating(false)} title="Criar reposição" description="Simulação temporária. Recarregar descarta as tarefas criadas."
      actions={<><Button variant="secondary" onClick={() => setCreating(false)}>Cancelar</Button><Button type="submit" form="restocking-create">Adicionar à demonstração</Button></>}>
      <form id="restocking-create" ref={formRef} onSubmit={create} noValidate className="visual-form"><p className="visual-note">Campos com * são obrigatórios.</p><TextField name="product" error={errors.product} label="Produto" required maxLength={80} onChange={() => clear('product')} /><TextField name="shelf" error={errors.shelf} label="Gôndola" required maxLength={12} onChange={() => clear('shelf')} /><TextField name="quantity" error={errors.quantity} label="Quantidade" type="number" min={1} max={9999} step={1} defaultValue={12} required onChange={() => clear('quantity')} /></form>
    </Modal>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`Reposição ${selected?.id ?? ''}`} description="Dados demonstrativos. Consulta sem alterar a operação da loja." actions={<Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button>}>
      {selected && <dl className="visual-details"><div><dt>Gôndola</dt><dd>{selected.shelf}</dd></div><div><dt>Produto</dt><dd>{selected.product}</dd></div><div><dt>Quantidade</dt><dd>{selected.quantity}</dd></div><div><dt>Responsável</dt><dd>{selected.responsible || 'Sem responsável'}</dd></div><div><dt>Situação</dt><dd>{columns.find((column) => column.id === selected.status)?.title}</dd></div></dl>}
    </Modal>
    <Modal open={Boolean(expanded)} onClose={() => setExpanded(null)} title={columns.find((column) => column.id === expanded)?.title ?? 'Reposições'} description="Amostra filtrada de reposições." actions={<Button variant="secondary" onClick={() => setExpanded(null)}>Fechar</Button>}>
      <ul className="restocking__all">{filtered.filter((task) => task.status === expanded).map((task) => <li key={task.id}><strong>{task.id} · {task.shelf}</strong><span>{task.product} · {task.quantity} un.</span></li>)}</ul>
      {!filtered.some((task) => task.status === expanded) && <p>Nenhuma reposição neste filtro.</p>}
    </Modal>
  </VisualPage>
}
