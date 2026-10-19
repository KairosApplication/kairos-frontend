import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Check, ChevronDown, Layers, Map, Package, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import DataTable, { type TableColumn } from '../../components/DataTable'
import Feedback from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import { createShelf, deleteShelf, getShelfCatalog, updateShelf } from '../../services/shelfCatalogService'
import type { ShelfCatalog, ShelfCatalogItem, ShelfInput } from '../../types/shelfCatalog'
import type { ShelfStatus } from '../../types/storeMap'
import ShelfForm from './ShelfForm'
import DeleteShelf from './DeleteShelf'
import './styles.css'

const labels: Record<ShelfStatus, string> = { stocked: 'Abastecida', low: 'Estoque baixo', stockout: 'Ruptura', empty: 'Sem produtos' }
const tones = { stocked: 'success', low: 'warning', stockout: 'danger', empty: 'neutral' } as const
const pageSize = 6
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
function shelfColumns(onEdit: (shelf: ShelfCatalogItem) => void, onDelete: (shelf: ShelfCatalogItem) => void): TableColumn<ShelfCatalogItem>[] { return [
  { key: 'id', header: 'Código', render: (shelf) => shelf.id },
  { key: 'sector', header: 'Setor', render: (shelf) => shelf.sectorName },
  { key: 'location', header: 'Localização', render: (shelf) => shelf.location },
  { key: 'products', header: 'Produtos', render: (shelf) => shelf.productCount },
  { key: 'status', header: 'Situação', render: (shelf) => <Badge tone={tones[shelf.status]}>{labels[shelf.status]}</Badge> },
  { key: 'actions', header: 'Ações', render: (shelf) => <div className="shelves__row-actions">
    <Link className="shelves__map-action" to={`/mapa?gondola=${encodeURIComponent(shelf.id)}`}
      aria-label={`Ver gôndola ${shelf.id} no mapa`} title={`Ver gôndola ${shelf.id} no mapa`}><Map size={16} aria-hidden="true" /></Link>
    <Button variant="ghost" aria-label={`Editar gôndola ${shelf.id}`} title={`Editar gôndola ${shelf.id}`} onClick={() => onEdit(shelf)}><Pencil size={16} aria-hidden="true" /></Button>
    <Button variant="ghost" aria-label={`Excluir gôndola ${shelf.id}`} title={`Excluir gôndola ${shelf.id}`} onClick={() => onDelete(shelf)}><Trash2 size={16} aria-hidden="true" /></Button>
  </div> },
] }

export default function Shelves() {
  const [data, setData] = useState<ShelfCatalog | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [sectorId, setSectorId] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState<{ shelf?: ShelfCatalogItem } | null>(null)
  const [deleting, setDeleting] = useState<ShelfCatalogItem | null>(null)
  const [message, setMessage] = useState('')
  const createButton = useRef<HTMLButtonElement>(null)
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const columns = shelfColumns(openEditor, openDelete)

  function cancelPendingFocus() {
    if (focusTimer.current !== null) clearTimeout(focusTimer.current)
    focusTimer.current = null
  }
  function openEditor(shelf?: ShelfCatalogItem) { cancelPendingFocus(); setEditor({ shelf }) }
  function openDelete(shelf: ShelfCatalogItem) { cancelPendingFocus(); setDeleting(shelf) }
  useEffect(() => () => {
    if (focusTimer.current !== null) clearTimeout(focusTimer.current)
  }, [])

  function restoreFocusAfterSave() {
    cancelPendingFocus()
    focusTimer.current = setTimeout(() => {
      focusTimer.current = null
      if (!document.querySelector('dialog[open]')) createButton.current?.focus()
    }, 0)
  }

  async function save(input: ShelfInput) {
    const next = editor?.shelf ? await updateShelf(editor.shelf.id, input) : await createShelf(input)
    setData(next)
    clearFilters()
    setMessage(`Gôndola ${input.code.trim().toUpperCase()} ${editor?.shelf ? 'atualizada' : 'criada'} na demonstração.`)
    setEditor(null)
    restoreFocusAfterSave()
  }

  async function remove() {
    if (!deleting) return
    const next = await deleteShelf(deleting.id)
    setData(next)
    setPage(currentPage)
    setMessage(`Gôndola ${deleting.id} excluída da demonstração.`)
    setDeleting(null)
    restoreFocusAfterSave()
  }

  useEffect(() => {
    let active = true
    async function load() {
      setFailed(false)
      try {
        const result = await getShelfCatalog()
        if (active) setData(result)
      } catch {
        if (active) setFailed(true)
      }
    }
    void load()
    return () => { active = false }
  }, [attempt])

  const search = normalize(query)
  const filtered = data?.shelves.filter((shelf) => (sectorId === 'all' || shelf.sectorId === sectorId)
    && (status === 'all' || shelf.status === status)
    && (!search || [shelf.id, shelf.sectorName, ...shelf.productNames].some((value) => normalize(value).includes(search)))) ?? []
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)

  function clearFilters() { setQuery(''); setSectorId('all'); setStatus('all'); setPage(1) }

  const stats = data ? [
    { title: 'Gôndolas cadastradas', value: data.shelves.length, detail: `Distribuídas em ${data.sectors.length} setores`, icon: <Layers />, tone: 'success' },
    { title: 'Com rupturas', value: data.shelves.filter((shelf) => shelf.status === 'stockout').length,
      detail: `${data.shelves.reduce((sum, shelf) => sum + shelf.stockoutCount, 0)} produtos sem exposição`, icon: <TriangleAlert />, tone: 'danger' },
    { title: 'Estoque baixo', value: data.shelves.filter((shelf) => shelf.status === 'low').length, detail: 'Reposição preventiva necessária', icon: <Package />, tone: 'warning' },
    { title: 'Abastecidas', value: data.shelves.filter((shelf) => shelf.status === 'stocked').length, detail: 'Disponibilidade dentro da meta', icon: <Check />, tone: 'success' },
  ] as const : []

  return <main className="shelves">
    <PageHeader title="Gestão de Gôndolas" description="Organize os espaços da loja e os produtos de cada gôndola."
      actions={<Button ref={createButton} icon={<Plus size={18} />} disabled={!data || failed} onClick={() => openEditor()}>Nova gôndola</Button>} />
    {message && <p className="shelves__success" role="status">{message}</p>}
    {failed ? <Feedback kind="error" title="Não foi possível carregar as gôndolas." onRetry={() => setAttempt((value) => value + 1)} />
      : !data ? <Feedback kind="loading" title="Carregando gôndolas…" /> : <>
        <div className="shelves__stats">{stats.map((stat) => <Card key={stat.title} className="shelves__stat" title={stat.title}
          actions={<span className={`shelves__stat-icon shelves__stat-icon--${stat.tone}`} aria-hidden="true">{stat.icon}</span>}>
          <p className="shelves__stat-value">{stat.value}</p><p className="shelves__stat-detail">{stat.detail}</p>
        </Card>)}</div>
        <div className="shelves__filters">
          <TextField label="Buscar por código, setor ou produto" type="search" placeholder="Buscar por código, setor ou produto" icon={<Search size={18} />}
            value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
          <div className="shelves__select"><SelectField label="Setor" value={sectorId} onChange={(event) => { setSectorId(event.target.value); setPage(1) }}>
            <option value="all">Todos os setores</option>{data.sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
          </SelectField><ChevronDown size={18} aria-hidden="true" /></div>
          <div className="shelves__select"><SelectField label="Situação" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
            <option value="all">Todos os status</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </SelectField><ChevronDown size={18} aria-hidden="true" /></div>
          <Link className="shelves__map-link" to="/mapa"><Map size={18} aria-hidden="true" />Ver mapa</Link>
        </div>
        <Card title="Gôndolas da loja" className="shelves__catalog">
          <DataTable caption="Gôndolas da loja — resultados filtrados" columns={columns} rows={rows} rowKey={(shelf) => shelf.id}
            emptyTitle="Nenhuma gôndola encontrada" emptyDescription="Tente outro código ou ajuste os filtros de setor e situação." />
          {!rows.length && <Button variant="secondary" onClick={clearFilters}>Limpar filtros</Button>}
          <div className="shelves__table-footer">
            <p role="status">{filtered.length ? `Exibindo ${start + 1}–${start + rows.length} de ${filtered.length} ${filtered.length === 1 ? 'gôndola' : 'gôndolas'}` : '0 gôndolas encontradas'}</p>
            {filtered.length > 0 && <nav className="shelves__pagination" aria-label="Paginação das gôndolas">
              <Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button>
              <span aria-current="page" aria-label={`Página ${currentPage} de ${pageCount}`}>{currentPage}</span>
              <Button variant="secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Próxima</Button>
            </nav>}
          </div>
        </Card>
        {editor && <ShelfForm shelf={editor.shelf} sectors={data.sectors} onClose={() => setEditor(null)} onSave={save} />}
        {deleting && <DeleteShelf shelf={deleting} onClose={() => setDeleting(null)} onDelete={remove} />}
        <p className="shelves__demo-note">Alterações demonstrativas compartilhadas com o mapa. Recarregar restaura os exemplos.</p>
        <footer className="shelves__footer"><span>{data.store} · {data.unit}</span><span>Dados demonstrativos · {data.updatedAt}</span></footer>
      </>}
  </main>
}
