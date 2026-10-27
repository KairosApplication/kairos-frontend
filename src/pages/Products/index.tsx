import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChevronDown, Eye, Search, TriangleAlert } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import DataTable, { type TableColumn } from '../../components/DataTable'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import useApiData from '../../hooks/useApiData'
import { getProductCatalog, productAvailability } from '../../services/productCatalogService'
import type { CatalogProduct, ProductAvailability } from '../../types/productCatalog'
import './styles.css'

const labels: Record<ProductAvailability, string> = { stocked: 'Com saldo', partial: 'Saldo parcial', zero: 'Sem saldo', unlinked: 'Sem gôndola' }
const tones = { stocked: 'success', partial: 'warning', zero: 'danger', unlinked: 'neutral' } as const
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
const pageSize = 5
const units = (product: CatalogProduct) => product.shelfUnits === null ? 'Não informado' : `${product.shelfUnits} un.`

export default function Products() {
  const { data, error, reload } = useApiData(getProductCatalog)
  const [categoryId, setCategoryId] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = data?.products.find(product => product.id === selectedId)
  const search = normalize(query)
  const filtered = data?.products.filter(product => {
    const status = productAvailability(product)
    return (categoryId === 'all' || product.categoryId === categoryId)
      && (availability === 'all' || (availability === 'attention' ? status === 'partial' || status === 'zero' : status === availability))
      && (!search || [product.name, product.id, product.brand].some(value => normalize(value).includes(search)))
  }) ?? []
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)
  const attentionCount = data?.products.filter(product => ['zero', 'partial'].includes(productAvailability(product))).length ?? 0
  const categoryName = data?.categories.find(category => category.id === categoryId)?.name ?? 'Todos os produtos'
  const columns: TableColumn<CatalogProduct>[] = [
    { key: 'name', header: 'Produto', render: product => product.name },
    { key: 'id', header: 'ID', render: product => product.id },
    { key: 'brand', header: 'Marca', render: product => product.brand },
    { key: 'price', header: 'Preço', render: product => currency.format(product.price) },
    { key: 'units', header: 'Nas gôndolas', render: units },
    { key: 'location', header: 'Local', render: product => product.placements.length === 1 ? `Gôndola ${product.placements[0].shelfId}` : product.placements.length ? `${product.placements.length} gôndolas` : 'Sem gôndola' },
    { key: 'status', header: 'Saldo', render: product => <Badge tone={tones[productAvailability(product)]}>{labels[productAvailability(product)]}</Badge> },
    { key: 'actions', header: 'Ações', render: product => <Button variant="ghost" className="products__details-button"
      aria-label={`Ver detalhes de ${product.name}`} title={`Ver detalhes de ${product.name}`} onClick={() => setSelectedId(product.id)}><Eye size={18} aria-hidden="true" /></Button> },
  ]
  function clearFilters() { setCategoryId('all'); setAvailability('all'); setQuery(''); setPage(1) }

  return <main className="products">
    <PageHeader title="Produtos" description="Consulte o catálogo, os preços e os saldos das gôndolas da sua empresa." />
    {error ? <Feedback kind="error" title="Não foi possível carregar os produtos." description={error.message} onRetry={() => void reload()} />
      : !data ? <Feedback kind="loading" title="Carregando produtos…" /> : <>
        <Card className="products__summary" aria-label="Resumo do catálogo da empresa"><dl>
          <div><dt>Produtos no catálogo</dt><dd>{data.products.length}</dd></div>
          <div><dt>Com saldo</dt><dd>{data.products.filter(p => productAvailability(p) === 'stocked').length}</dd></div>
          <div><dt>Sem gôndola</dt><dd>{data.products.filter(p => productAvailability(p) === 'unlinked').length}</dd></div>
          <div><dt>Saldo parcial</dt><dd>{data.products.filter(p => productAvailability(p) === 'partial').length}</dd></div>
          <div><dt>Sem saldo</dt><dd>{data.products.filter(p => productAvailability(p) === 'zero').length}</dd></div>
        </dl></Card>
        <div className="products__layout">
          <aside className="products__categories" aria-label="Categorias de produtos">
            <h2>Categorias</h2><nav aria-label="Filtrar por categoria">
              <button type="button" aria-pressed={categoryId === 'all'} onClick={() => { setCategoryId('all'); setPage(1) }}>Todos os produtos<small>{data.products.length} produtos</small></button>
              {data.categories.map(category => <button key={category.id} type="button" aria-pressed={categoryId === category.id}
                onClick={() => { setCategoryId(category.id); setPage(1) }}>{category.name}<small>{data.products.filter(p => p.categoryId === category.id).length} produtos</small></button>)}
            </nav>
            <div className="products__attention"><TriangleAlert size={20} aria-hidden="true" /><h3>Atenção ao saldo</h3>
              <p>{attentionCount} produtos com saldo zero em alguma gôndola.</p>
              <Button variant="ghost" onClick={() => { clearFilters(); setAvailability('attention') }}>Ver pendências<ArrowRight size={14} aria-hidden="true" /></Button>
            </div>
          </aside>
          <div className="products__content">
            <div className="products__filters">
              <TextField label="Buscar nome, ID ou marca" type="search" placeholder="Buscar nome, ID ou marca" icon={<Search size={18} />}
                value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} />
              <div className="products__select"><SelectField label="Saldo nas gôndolas" value={availability} onChange={event => { setAvailability(event.target.value); setPage(1) }}>
                <option value="all">Todos os saldos</option>
                {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                <option value="attention">Com gôndola sem saldo</option>
              </SelectField><ChevronDown size={18} aria-hidden="true" /></div>
            </div>
            <Card title={categoryName} className="products__catalog">
              <DataTable caption="Catálogo de produtos — resultados filtrados" columns={columns} rows={rows} rowKey={product => product.id}
                emptyTitle="Nenhum produto encontrado" emptyDescription="Tente outro nome, ID ou marca, ou ajuste os filtros." />
              {!rows.length && <Button variant="secondary" onClick={clearFilters}>Limpar filtros</Button>}
              <div className="products__table-footer"><p role="status">{filtered.length ? `Exibindo ${start + 1}–${start + rows.length} de ${filtered.length} ${filtered.length === 1 ? 'produto' : 'produtos'}` : '0 produtos encontrados'}</p>
                {filtered.length > 0 && <nav className="products__pagination" aria-label="Paginação dos produtos">
                  <Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button>
                  <span aria-current="page" aria-label={`Página ${currentPage} de ${pageCount}`}>{currentPage}</span>
                  <Button variant="secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Próxima</Button>
                </nav>}
              </div>
            </Card>
          </div>
        </div>
        <p className="products__data-note">Com saldo: todos os vínculos positivos. Saldo parcial: há gôndolas com e sem saldo. Sem saldo: todos os vínculos zerados. Sem gôndola: nenhum vínculo, saldo não informado.</p>
        <p className="products__data-note">SKU, código de barras, estoque no depósito, estoque mínimo e situação ativo/inativo não são fornecidos nesta consulta. Saldo positivo não representa uma meta de abastecimento.</p>
        <footer className="products__footer"><span>Catálogo da empresa autenticada</span><span>Consulta realizada em {data.updatedAt}</span></footer>
        <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected?.name ?? 'Detalhes do produto'}
          description="Dados cadastrados na empresa. Consulta sem alteração de estoque ou preço."
          actions={<Button variant="secondary" onClick={() => setSelectedId(null)}>Fechar</Button>}>
          {selected && <><dl className="products__details">
            <div><dt>ID</dt><dd>{selected.id}</dd></div><div><dt>Marca</dt><dd>{selected.brand}</dd></div>
            <div><dt>Categoria</dt><dd>{data.categories.find(category => category.id === selected.categoryId)?.name}</dd></div>
            <div><dt>Preço</dt><dd>{currency.format(selected.price)}</dd></div>
            <div><dt>Total nas gôndolas</dt><dd>{units(selected)}</dd></div>
            <div><dt>Saldo</dt><dd>{labels[productAvailability(selected)]}</dd></div>
          </dl><h3>Gôndolas vinculadas</h3>
            {selected.placements.length ? <ul className="products__placements">{selected.placements.map(placement => <li key={placement.shelfId}>
              <Link className="products__map-link" aria-label={`Ver gôndola ${placement.shelfId} no mapa`} to={`/mapa?gondola=${encodeURIComponent(placement.shelfId)}`}>
                Gôndola {placement.shelfId}<ArrowRight size={18} aria-hidden="true" /></Link>
              <p>{placement.sectorName} · {placement.location} · {placement.units} un.</p>
            </li>)}</ul> : <p>Este produto não possui vínculos com gôndolas. O saldo não está informado.</p>}
            <p className="products__data-note">Depósito, estoque mínimo, SKU, código de barras e ativo/inativo não disponíveis nesta consulta.</p>
          </>}
        </Modal>
      </>}
  </main>
}
