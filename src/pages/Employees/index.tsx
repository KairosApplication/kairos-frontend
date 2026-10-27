import { useRef, useState, type SubmitEvent } from 'react'
import { Plus, Search, UserRound } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useApiData from '../../hooks/useApiData'
import useFormValidation from '../../hooks/useFormValidation'
import { ApiHttpError } from '../../services/apiData'
import { EmployeeWriteUncertainError, getEmployees, writeEmployee, type ApiEmployee } from '../../services/employeesApiService'
import './styles.css'
const roles = { MANAGER: 'Gerente', STOCKER: 'Repositor', CASHIER: 'Caixa' }
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export default function Employees() {
  const { data, error, reload, fail } = useApiData(getEmployees)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<{ action: 'create' | 'edit' | 'delete' | 'details'; person?: ApiEmployee } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const pending = useRef(false)
  const createButton = useRef<HTMLButtonElement>(null)
  const { formRef, errors, validate, reject, reset, clear } = useFormValidation()
  const filtered = data?.filter(p => (role === 'all' || p.position === role) && normalize(`${p.id} ${p.userName}`).includes(normalize(query))) ?? []
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 6)))
  const rows = filtered.slice((currentPage - 1) * 6, currentPage * 6)
  function open(action: NonNullable<typeof dialog>['action'], person?: ApiEmployee) { reset(); setFailure(''); setDialog({ action, person }) }
  async function submit(event?: SubmitEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (pending.current || !dialog || !data) return
    let body: unknown
    if (dialog.action !== 'delete') {
      if (!event || !validate(event.currentTarget)) return
      const fields = new FormData(event.currentTarget)
      const position = String(fields.get('position'))
      if (!['CASHIER', 'STOCKER'].includes(position)) { reject({ position: 'Selecione uma função disponível.' }); return }
      if (dialog.action === 'create') {
        const name = String(fields.get('name')).trim().split(/\s+/)
        if (name.length < 2) { reject({ name: 'Informe nome e sobrenome.' }); return }
        const birthDate = String(fields.get('birthDate'))
        const today = new Date(); const localDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        if (birthDate > localDay) { reject({ birthDate: 'Informe uma data de nascimento válida.' }); return }
        body = { position, user: { name: name.shift(), lastName: name.join(' '), birthDate, email: String(fields.get('email')).trim(), cpf: String(fields.get('cpf')).replace(/\D/g, ''), password: String(fields.get('password')) } }
      } else body = { position }
    }
    pending.current = true; setBusy(true); setFailure(''); setMessage('')
    try {
      await writeEmployee(dialog.action === 'create' ? 'POST' : dialog.action === 'edit' ? 'PATCH' : 'DELETE', dialog.person?.id, body)
      setDialog(null); setMessage('Cadastro atualizado com sucesso.'); setPage(1); setQuery(''); setRole('all')
      await reload(); setTimeout(() => createButton.current?.focus(), 0)
    } catch (cause) {
      if (cause instanceof EmployeeWriteUncertainError || cause instanceof ApiHttpError && cause.status === 401) { setDialog(null); fail(cause) }
      else setFailure(cause instanceof Error ? cause.message : 'Não foi possível atualizar o cadastro.')
    } finally { pending.current = false; setBusy(false) }
  }
  const person = dialog?.person
  return <VisualPage title="Funcionários" description="Consulte e gerencie os cadastros disponibilizados pela API." className="employees" footer="Cadastros consultados na API"
    actions={<Button ref={createButton} icon={<Plus />} disabled={!data} onClick={() => open('create')}>Novo funcionário</Button>}>
    {message && <p role="status">{message}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar a equipe." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando equipe…" /> : <div className="employees__layout">
      <Card tone="brand" className="employees__summary"><p className="employees__eyebrow">Equipe cadastrada</p><strong className="employees__total">{data.length}</strong><p>funcionários retornados</p>
        <h2>Distribuição por função</h2>{Object.entries(roles).map(([key, label]) => <div key={key}><p>{label}</p><strong>{data.filter(p => p.position === key).length}</strong></div>)}
        <div className="employees__shift"><h3>Dados do cadastro</h3><p>Turno, presença e posto de trabalho não são informados nesta consulta.</p></div>
      </Card>
      <div className="employees__content"><div className="visual-toolbar"><TextField label="Buscar nome ou ID" type="search" icon={<Search size={18} />} value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} />
        <SelectField label="Função" value={role} onChange={e => { setRole(e.target.value); setPage(1) }}><option value="all">Todas as funções</option>{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField></div>
        <div className="employees__heading"><h2>Sua equipe</h2><p role="status">{filtered.length} funcionários encontrados</p></div>
        <div className="employees__cards">{rows.map(p => <Card className="employee-card" key={p.id}><div className="employee-card__top"><span className="employee-card__avatar">{p.userName.split(/\s+/).slice(0, 2).map(s => s[0]).join('')}</span><UserRound aria-hidden="true" /></div>
          <h3>{p.userName}</h3><p>{roles[p.position]}</p><small>ID {p.id}</small><footer><Button variant="ghost" onClick={() => open('details', p)}>Ver perfil de {p.userName}</Button>
            <Button variant="secondary" disabled={p.position === 'MANAGER'} onClick={() => open('edit', p)}>Editar função de {p.userName}</Button><Button variant="ghost" disabled={p.position === 'MANAGER'} onClick={() => open('delete', p)}>Excluir funcionário {p.id}</Button></footer></Card>)}</div>
        {!rows.length && <Feedback kind="empty" title="Nenhum funcionário encontrado" />}
        <nav className="employees__pagination" aria-label="Paginação da equipe"><Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button><span aria-current="page">{currentPage}</span><Button variant="secondary" disabled={currentPage * 6 >= filtered.length} onClick={() => setPage(currentPage + 1)}>Próxima →</Button></nav>
      </div></div>}
    <Modal open={!!dialog} onClose={() => { if (!pending.current) setDialog(null) }} title={dialog?.action === 'create' ? 'Novo funcionário' : dialog?.action === 'edit' ? 'Editar função' : dialog?.action === 'delete' ? 'Excluir funcionário?' : person?.userName ?? 'Funcionário'}
      actions={dialog?.action === 'details' ? <Button onClick={() => setDialog(null)}>Fechar</Button> : <><Button variant="secondary" disabled={busy} onClick={() => setDialog(null)}>Cancelar</Button>{dialog?.action === 'delete' ? <Button variant="danger" loading={busy} onClick={() => void submit()}>Confirmar exclusão</Button> : <Button type="submit" form="employee-api-form" loading={busy}>Salvar funcionário</Button>}</>}>
      {failure && <p role="alert">{failure}</p>}
      {dialog?.action === 'details' && person ? <dl className="visual-details"><div><dt>ID do funcionário</dt><dd>{person.id}</dd></div><div><dt>ID do usuário</dt><dd>{person.userId}</dd></div><div><dt>Função</dt><dd>{roles[person.position]}</dd></div></dl>
        : dialog?.action === 'delete' ? <p>Excluir o vínculo de funcionário de {person?.userName}? O cadastro de usuário não é excluído por esta operação. Outros vínculos podem impedir a exclusão.</p> : dialog && <form key={`${dialog.action}-${person?.id ?? 'new'}`} id="employee-api-form" ref={formRef} className="visual-form" onSubmit={submit} noValidate>
          {dialog.action === 'create' && <>{[['name', 'Nome completo', 'text'], ['email', 'E-mail', 'email'], ['cpf', 'CPF', 'text'], ['birthDate', 'Data de nascimento', 'date'], ['password', 'Senha inicial', 'password']].map(([name, label, type]) => <TextField key={name} name={name} label={label} type={type} required disabled={busy} autoComplete={name === 'password' ? 'new-password' : 'off'} error={errors[name]} onChange={() => clear(name)} />)}</>}
          <SelectField name="position" label="Função" required disabled={busy} defaultValue={person?.position ?? 'STOCKER'} error={errors.position} onChange={() => clear('position')}><option value="STOCKER">Repositor</option><option value="CASHIER">Caixa</option></SelectField>
        </form>}
    </Modal>
  </VisualPage>
}
