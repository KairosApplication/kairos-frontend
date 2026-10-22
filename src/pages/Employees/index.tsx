import { useState, type SubmitEvent } from 'react'
import { ChevronDown, Clock3, Pencil, Plus, RefreshCw, Search, ShoppingCart, UserRound } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useDemoData from '../../hooks/useDemoData'
import useFormValidation from '../../hooks/useFormValidation'
import useStatusMessage from '../../hooks/useStatusMessage'
import StatusMessage from '../../components/StatusMessage'
import { getEmployeesView } from '../../services/employeesViewService'
import type { EmployeeView } from '../../types/employeesView'
import './styles.css'

const statuses = { active: 'Em atividade', off: 'Fora do turno', inactive: 'Inativo' }
const tones = { active: 'success', off: 'warning', inactive: 'danger' } as const
const initials = (name: string) => name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('')
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export default function Employees() {
  const { data, loading, error, retry } = useDemoData(getEmployeesView)
  const [created, setCreated] = useState<EmployeeView[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<EmployeeView | null>(null)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useStatusMessage()
  const { formRef, errors, validate, reject, clear, reset } = useFormValidation()
  const people = [...created, ...(data ?? [])]
  const filtered = people.filter((person) => normalize(`${person.name} ${person.email}`).includes(normalize(search)) && (role === 'all' || person.role === role) && (status === 'all' || person.status === status))
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 6)))
  const rows = filtered.slice((currentPage - 1) * 6, currentPage * 6)
  const active = people.filter((person) => person.status === 'active').length
  const stockers = people.filter((person) => person.role === 'Repositor')
  const salesTeam = people.filter((person) => person.role !== 'Repositor')

  function create(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate(event.currentTarget)) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    if (people.some((person) => person.email.toLowerCase() === email)) { reject({ email: 'Este e-mail já está na demonstração.' }); return }
    const newRole = String(form.get('role')) as EmployeeView['role']
    setCreated((previous) => [{ id: `demo-${previous.length + 1}`, name, email, role: newRole, shift: 'Manhã', status: 'off', location: 'Sem posto atribuído' }, ...previous])
    setCreating(false); setPage(1); setRole('all'); setStatus('all'); setSearch(''); reset()
    setMessage('Funcionário adicionado à demonstração. Nenhuma conta ou acesso real foi criado.')
  }

  return <VisualPage title="Funcionários" description="Gerencie os acessos e acompanhe a equipe da loja." className="employees"
    actions={<Button icon={<Plus />} onClick={() => { reset(); setCreating(true) }}>Novo funcionário</Button>}>
    <StatusMessage notice={message} />
    {error ? <Feedback kind="error" title="Não foi possível carregar a equipe." onRetry={retry} /> : loading ? <Feedback kind="loading" title="Carregando equipe…" /> : <div className="employees__layout">
      <Card tone="brand" className="employees__summary"><p className="employees__eyebrow">Equipe · Unidade Centro</p><strong className="employees__total">{active}</strong><p>pessoas em atividade</p><small>de {people.length} funcionários cadastrados</small>
        <div className="employees__progress" role="img" aria-label={`${active} de ${people.length} funcionários em atividade`}><span style={{ width: `${people.length ? active / people.length * 100 : 0}%` }} /></div>
        <h2>Cobertura por função</h2><p className="employees__coverage-label">Reposição</p><strong className="employees__coverage">{stockers.filter((person) => person.status === 'active').length} de {stockers.length}</strong><p className="employees__coverage-label">Vendas e caixas</p><strong className="employees__coverage">{salesTeam.filter((person) => person.status === 'active').length} de {salesTeam.length}</strong>
        <div className="employees__shift"><h3><Clock3 size={18} aria-hidden="true" />Turno da manhã</h3><p>Acompanhe a distribuição da equipe durante o dia.</p></div>
      </Card>
      <div className="employees__content"><div className="visual-toolbar"><TextField label="Buscar nome ou e-mail" type="search" placeholder="Buscar nome ou e-mail" icon={<Search size={18} />} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
        <div className="visual-filter-select"><SelectField label="Função" value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }}><option value="all">Todas as funções</option>{['Repositor', 'Caixa', 'Vendedor'].map((item) => <option key={item}>{item}</option>)}</SelectField><ChevronDown size={18} aria-hidden="true" /></div>
        <div className="visual-filter-select employees__status"><SelectField label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="all">Status</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField><ChevronDown size={18} aria-hidden="true" /></div>
      </div>
      <div className="employees__heading"><h2>Sua equipe</h2><p role="status">{rows.length} de {filtered.length} funcionários</p></div>
      <div className="employees__cards">{rows.map((person) => <Card className="employee-card" key={person.id}>
        <div className="employee-card__top"><span className="employee-card__avatar">{initials(person.name)}</span><span aria-hidden="true">{person.role === 'Repositor' ? <RefreshCw size={18} /> : person.role === 'Caixa' ? <ShoppingCart size={18} /> : <UserRound size={18} />}</span></div>
        <h3>{person.name}</h3><p>{person.role} · {person.shift}</p><Badge tone={tones[person.status]}>{statuses[person.status]}</Badge>
        <footer><small>{person.location}</small><div><Button variant="ghost" onClick={() => setSelected(person)} aria-label={`Ver perfil de ${person.name}`}>Ver perfil</Button><Button variant="ghost" onClick={() => setSelected(person)} aria-label={`Consultar cadastro de ${person.name}`}><Pencil size={16} aria-hidden="true" /></Button></div></footer>
      </Card>)}</div>
      {!rows.length && <Feedback kind="empty" title="Nenhum funcionário encontrado" description="Ajuste a busca, a função ou o status." />}
      <div className="employees__pagination"><span>Mostrando {filtered.length ? (currentPage - 1) * 6 + 1 : 0}–{Math.min(currentPage * 6, filtered.length)} de {filtered.length} pessoas</span><nav aria-label="Paginação da equipe"><Button variant="ghost" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button><span aria-current="page">{currentPage}</span><Button variant="ghost" disabled={currentPage * 6 >= filtered.length} onClick={() => setPage(currentPage + 1)}>Próxima →</Button></nav></div>
      </div>
    </div>}
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? 'Perfil do funcionário'} description="Cadastro fictício. Nenhuma permissão real é alterada." actions={<Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button>}>
      {selected && <dl className="visual-details"><div><dt>E-mail</dt><dd>{selected.email}</dd></div><div><dt>Função</dt><dd>{selected.role}</dd></div><div><dt>Turno</dt><dd>{selected.shift}</dd></div><div><dt>Status</dt><dd>{statuses[selected.status]}</dd></div><div><dt>Posto</dt><dd>{selected.location}</dd></div></dl>}
    </Modal>
    <Modal open={creating} onClose={() => setCreating(false)} title="Novo funcionário" description="Simulação temporária, sem criar usuário, senha ou acesso real." actions={<><Button variant="secondary" onClick={() => setCreating(false)}>Cancelar</Button><Button type="submit" form="employee-create">Adicionar à demonstração</Button></>}>
      <form id="employee-create" ref={formRef} onSubmit={create} noValidate className="visual-form"><p className="visual-note">Campos com * são obrigatórios.</p><TextField name="name" error={errors.name} label="Nome completo" required maxLength={80} onChange={() => clear('name')} /><TextField name="email" error={errors.email} label="E-mail" type="email" required maxLength={120} onChange={() => clear('email')} /><SelectField name="role" label="Função" defaultValue="Repositor">{['Repositor', 'Caixa', 'Vendedor'].map((item) => <option key={item}>{item}</option>)}</SelectField></form>
    </Modal>
  </VisualPage>
}
