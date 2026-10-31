import { useCallback, useRef, useState, type SubmitEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useApiData from '../../hooks/useApiData'
import useFormValidation from '../../hooks/useFormValidation'
import { ApiHttpError } from '../../services/apiData'
import { getRestockingCatalog, getRestockingOptions, RestockingUncertainError, writeRestocking, type RestockingRecord } from '../../services/restockingApiService'
import './styles.css'
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export default function Restocking() {
  const { data, error, reload, fail } = useApiData(getRestockingCatalog)
  const [query, setQuery] = useState('')
  const [responsible, setResponsible] = useState('all')
  const [date, setDate] = useState('')
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit' | 'delete'; record?: RestockingRecord } | null>(null)
  const editing = !!dialog && dialog.mode !== 'delete'
  const optionsLoader = useCallback((signal?: AbortSignal) => editing && data ? getRestockingOptions(data.catalog, signal) : Promise.resolve(null), [editing, data])
  const options = useApiData(optionsLoader)
  const [selected, setSelected] = useState<RestockingRecord | null>(null)
  const [expanded, setExpanded] = useState('')
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const createButton = useRef<HTMLButtonElement>(null)
  const { formRef, errors, validate, reject, reset, clear } = useFormValidation()
  const product = (id: number) => data?.catalog.products.find(p => p.id === id)?.name ?? `Produto ${id}`
  const person = (id: number) => options.data?.people.find(p => p.id === id)?.userName ?? `Funcionário ${id}`
  const records = data?.records.filter(r => (responsible === 'all' || String(r.employeeId) === responsible) && (!date || r.restockingDate.slice(0, 10) === date) && normalize(`${r.id} ${r.shelfId} ${product(r.productId)}`).includes(normalize(query))) ?? []
  const columns = [{ id: 'all', title: 'Registros', records }, { id: 'intact', title: 'Sem avarias', records: records.filter(r => r.damagedQuantity === 0) }, { id: 'damaged', title: 'Com avarias', records: records.filter(r => r.damagedQuantity > 0) }]
  function open(mode: NonNullable<typeof dialog>['mode'], record?: RestockingRecord) { reset(); setFailure(''); setSelected(null); setDialog({ mode, record }) }
  async function submit(event?: SubmitEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (pending.current || !dialog || !data) return
    let body: Omit<RestockingRecord, 'id' | 'restockingDate'> | undefined
    if (dialog.mode !== 'delete') {
      if (!event || !validate(event.currentTarget)) return
      const form = new FormData(event.currentTarget)
      body = { inventoryId: Number(form.get('inventoryId')), employeeId: Number(form.get('employeeId')), productId: Number(form.get('productId')), shelfId: Number(form.get('shelfId')), restockedQuantity: Number(form.get('restockedQuantity')), damagedQuantity: Number(form.get('damagedQuantity')) }
      if (body.damagedQuantity > body.restockedQuantity) { reject({ damagedQuantity: 'As avarias não podem superar a quantidade reposta.' }); return }
      if (!options.data?.inventories.some(i => i.id === body?.inventoryId) || !options.data.people.some(p => p.id === body?.employeeId) || !data.catalog.products.some(p => p.id === body?.productId) || !data.catalog.shelves.some(s => s.id === body?.shelfId)) { setFailure('Selecione os vínculos disponíveis nesta consulta.'); return }
    }
    pending.current = true; setBusy(true); setFailure(''); setMessage('')
    try {
      await writeRestocking(dialog.mode === 'create' ? 'POST' : dialog.mode === 'edit' ? 'PATCH' : 'DELETE', body, dialog.record?.id)
      setDialog(null); setSelected(null); setMessage('Registro de reposição atualizado.'); setDate(''); setResponsible('all'); setQuery('')
      await reload(); setTimeout(() => createButton.current?.focus(), 0)
    } catch (cause) {
      if (cause instanceof RestockingUncertainError || cause instanceof ApiHttpError && cause.status === 401) { setDialog(null); fail(cause) }
      else setFailure(cause instanceof Error ? cause.message : 'Não foi possível atualizar a reposição.')
    } finally { pending.current = false; setBusy(false) }
  }
  function taskCard(r: RestockingRecord) { return <button type="button" className="restock-task" key={r.id} onClick={() => { setExpanded(''); setSelected(r) }}><span className="restock-task__top"><small>REP-{r.id}</small><Badge tone={r.damagedQuantity ? 'warning' : 'success'}>{r.damagedQuantity ? 'Com avarias' : 'Sem avarias'}</Badge></span><strong>Gôndola {r.shelfId}</strong><span className="restock-task__product">{product(r.productId)} · {r.restockedQuantity} unidades</span><span className="restock-task__person">{person(r.employeeId)}</span><small>{r.restockingDate.replace('T', ' ').slice(0, 16)}</small></button> }
  const current = dialog?.record
  const canCreate = !!data?.catalog.products.length && !!data.catalog.shelves.length
  return <VisualPage title="Central de Reposição" description="Consulte e registre as reposições e avarias da operação." className="restocking" footer="Registros consultados na API"
    actions={<Button ref={createButton} icon={<Plus />} disabled={!data || !canCreate} onClick={() => open('create')}>Criar reposição</Button>}>
    {message && <p role="status">{message}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar as reposições." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando reposições…" /> : <>
      <div className="visual-toolbar restocking__toolbar"><TextField label="Buscar produto ou gôndola" type="search" value={query} icon={<Search />} onChange={e => setQuery(e.target.value)} />
        <SelectField label="Responsável" value={responsible} onChange={e => setResponsible(e.target.value)}><option value="all">Todos os responsáveis</option>{[...new Set(data.records.map(r => r.employeeId))].sort((a, b) => a - b).map(id => <option value={id} key={id}>{person(id)}</option>)}</SelectField>
        <TextField label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
      {!canCreate && <p className="visual-note">É necessário haver produto e gôndola disponíveis para criar um registro.</p>}
      <div className="restocking__board">{columns.map(column => <section className="restocking__column" key={column.id} aria-label={column.title}><header><h2>{column.title}</h2><Badge tone="neutral">{column.records.length}</Badge></header><div className="restocking__tasks">{column.records.slice(0, 3).map(taskCard)}</div>{!column.records.length && <p>Nenhum registro neste filtro.</p>}<Button variant="ghost" onClick={() => setExpanded(column.id)}>Ver todos: {column.title}</Button></section>)}</div>
    </>}
    <Modal open={!!selected} onClose={() => setSelected(null)} title={`Reposição ${selected?.id ?? ''}`} description="Quantidades registradas na API."
      actions={<><Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button><Button onClick={() => selected && open('edit', selected)}>Editar registro</Button><Button variant="danger" onClick={() => selected && open('delete', selected)}>Excluir registro</Button></>}>
      {selected && <dl className="visual-details"><div><dt>Produto</dt><dd>{product(selected.productId)}</dd></div><div><dt>Gôndola</dt><dd>{selected.shelfId}</dd></div><div><dt>Responsável</dt><dd>{person(selected.employeeId)}</dd></div><div><dt>Quantidade reposta</dt><dd>{selected.restockedQuantity}</dd></div><div><dt>Avarias</dt><dd>{selected.damagedQuantity}</dd></div><div><dt>Data</dt><dd>{selected.restockingDate.replace('T', ' ')}</dd></div></dl>}
    </Modal>
    <Modal open={!!expanded} onClose={() => setExpanded('')} title={columns.find(c => c.id === expanded)?.title ?? 'Registros'} actions={<Button onClick={() => setExpanded('')}>Fechar</Button>}><div className="restocking__tasks">{columns.find(c => c.id === expanded)?.records.map(taskCard)}</div></Modal>
    <Modal open={!!dialog} onClose={() => { if (!pending.current) setDialog(null) }} title={dialog?.mode === 'create' ? 'Criar reposição' : dialog?.mode === 'edit' ? 'Editar reposição' : 'Excluir reposição?'}
      actions={<><Button variant="secondary" disabled={busy} onClick={() => setDialog(null)}>Cancelar</Button>{dialog?.mode === 'delete' ? <Button variant="danger" loading={busy} onClick={() => void submit()}>Confirmar exclusão</Button> : <Button type="submit" form="restocking-api-form" loading={busy} disabled={!options.data}>Salvar reposição</Button>}</>}>
      {failure && <p role="alert">{failure}</p>}
      {editing && options.error && <Feedback kind="error" title="Não foi possível carregar equipe e depósitos." description={options.error.message} onRetry={() => void options.reload()} />}
      {editing && !options.data && !options.error && <Feedback kind="loading" title="Carregando equipe e depósitos…" />}
      {dialog?.mode === 'delete' ? <p>Excluir o registro {current?.id}? Esta operação não transfere produtos nem ajusta automaticamente o saldo nas gôndolas.</p> : dialog && data && options.data && <form key={`${dialog.mode}-${current?.id ?? 'new'}`} id="restocking-api-form" ref={formRef} className="visual-form" noValidate onSubmit={submit}>
        {([{ name: 'productId', label: 'Produto', values: data.catalog.products.map(p => ({ id: p.id, label: p.name })) }, { name: 'shelfId', label: 'Gôndola', values: data.catalog.shelves.map(s => ({ id: s.id, label: `Gôndola ${s.id}` })) }, { name: 'employeeId', label: 'Responsável', values: options.data.people.map(p => ({ id: p.id, label: p.userName })) }, { name: 'inventoryId', label: 'Depósito', values: options.data.inventories.map(i => ({ id: i.id, label: `${i.sectorName} · ID ${i.id}` })) }] as const).map(field => <SelectField key={field.name} name={field.name} label={field.label} required disabled={busy} defaultValue={current?.[field.name] ?? ''} error={errors[field.name]} onChange={() => clear(field.name)}><option value="">Selecione</option>{field.values.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</SelectField>)}
        <TextField name="restockedQuantity" label="Quantidade" type="number" min={1} max={2147483647} step={1} required defaultValue={current?.restockedQuantity ?? 1} disabled={busy} error={errors.restockedQuantity} onChange={() => clear('restockedQuantity')} />
        <TextField name="damagedQuantity" label="Avarias" type="number" min={0} max={2147483647} step={1} required defaultValue={current?.damagedQuantity ?? 0} disabled={busy} error={errors.damagedQuantity} onChange={() => clear('damagedQuantity')} />
      </form>}
    </Modal>
  </VisualPage>
}
