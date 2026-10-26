import { useEffect, useState } from 'react'
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
import { getProductCatalog, productAvailability } from '../../services/productCatalogService'
import type { CatalogProduct, ProductAvailability, ProductCatalog } from '../../types/productCatalog'
import './styles.css'

const labels: Record<ProductAvailability, string> = { available: 'Disponível', low: 'Baixo estoque', stockout: 'Ruptura', inactive: 'Inativo' }
const tones = { available: 'success', low: 'warning', stockout: 'danger', inactive: 'neutral' } as const
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
const pageSize = 5

export default function Products() {
  const [data, setData] = useState<ProductCatalog | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [categoryId, setCategoryId] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<CatalogProduct | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setFailed(false)
      try {
        const result = await getProductCatalog()
        if (active) setData(result)
      } catch {
        if (active) setFailed(true)
      }
    }
    void load()
    return () => { active = false }
  }, [attempt])

  const search = normalize(query)
  const filtered = data?.products.filter((product) => {
    const status = productAvailability(product)
    return (categoryId === 'all' || product.categoryId === categoryId)
      && (availability === 'all' || (availability === 'attention' ? status === 'low' || status === 'stockout' : status === availability))
      && (!search || [product.name, product.sku, product.barcode].some((value) => normalize(value).includes(search)))
  }) ?? []
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)
  const attentionCount = data?.products.filter((product) => ['low', 'stockout'].includes(productAvailability(product))).length ?? 0
  const categoryName = data?.categories.find((category) => category.id === categoryId)?.name ?? 'Todos os produtos'
  const columns: TableColumn<CatalogProduct>[] = [
    { key: 'name', header: 'Produto', render: (product) => product.name },
    { key: 'sku', header: 'SKU', render: (product) => product.sku },
    { key: 'price', header: 'Preço', render: (product) => currency.format(product.price) },
    { key: 'units', header: 'Gônd. / dep.', render: (product) => <span aria-label={`${product.shelfUnits} na gôndola, ${product.warehouseUnits} no depósito`}>{product.shelfUnits} / {product.warehouseUnits}</span> },
    { key: 'location', header: 'Local', render: (product) => data?.shelfCodes[product.sourceShelfId] ?? 'Sem vínculo real' },
    { key: 'status', header: 'Status', render: (product) => <Badge tone={tones[productAvailability(product)]}>{labels[productAvailability(product)]}</Badge> },
    { key: 'actions', header: 'Ações', render: (product) => <Button variant="ghost" className="products__details-button"
      aria-label={`Ver detalhes de ${product.name}`} title={`Ver detalhes de ${product.name}`} onClick={() => setSelected(product)}><Eye size={18} aria-hidden="true" /></Button> },
  ]

  function clearFilters() { setCategoryId('all'); setAvailability('all'); setQuery(''); setPage(1) }

  return <main className="products">
    <PageHeader title="Produtos" description="Gerencie o catálogo, os preços e a disponibilidade dos produtos." />
    {failed ? <Feedback kind="error" title="Não foi possível carregar os produtos." onRetry={() => setAttempt((value) => value + 1)} />
      : !data ? <Feedback kind="loading" title="Carregando produtos…" /> : <>
        <Card className="products__summary" aria-label="Resumo do catálogo demonstrativo"><dl>
          <div><dt>Produtos no catálogo</dt><dd>{data.products.length}</dd></div>
          <div><dt>Ativos</dt><dd>{data.products.filter((product) => product.active).length}</dd></div>
          <div><dt>Inativos</dt><dd>{data.products.filter((product) => !product.active).length}</dd></div>
          <div><dt>Estoque baixo</dt><dd>{data.products.filter((product) => productAvailability(product) === 'low').length}</dd></div>
          <div><dt>Em ruptura</dt><dd>{data.products.filter((product) => productAvailability(product) === 'stockout').length}</dd></div>
        </dl></Card>
        <div className="products__layout">
          <aside className="products__categories" aria-label="Categorias de produtos">
            <h2>Categorias</h2><nav aria-label="Filtrar por categoria">
              <button type="button" aria-pressed={categoryId === 'all'} onClick={() => { setCategoryId('all'); setPage(1) }}>Todos os produtos<small>{data.products.length} produtos</small></button>
              {data.categories.map((category) => <button key={category.id} type="button" aria-pressed={categoryId === category.id}
                onClick={() => { setCategoryId(category.id); setPage(1) }}>{category.name}<small>{data.products.filter((product) => product.categoryId === category.id).length} produtos</small></button>)}
            </nav>
            <div className="products__attention"><TriangleAlert size={20} aria-hidden="true" /><h3>Atenção ao estoque</h3>
              <p>{attentionCount} produtos precisam de acompanhamento.</p>
              <Button variant="ghost" onClick={() => { clearFilters(); setAvailability('attention') }}>Ver pendências<ArrowRight size={14} aria-hidden="true" /></Button>
            </div>
          </aside>
          <div className="products__content">
            <div className="products__filters">
              <TextField label="Buscar nome, SKU ou código de barras" type="search" placeholder="Buscar nome, SKU ou código de barras" icon={<Search size={18} />}
                value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
              <div className="products__select"><SelectField label="Disponibilidade" value={availability} onChange={(event) => { setAvailability(event.target.value); setPage(1) }}>
                <option value="all">Disponibilidade</option>
                {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                <option value="attention">Precisam de atenção</option>
              </SelectField><ChevronDown size={18} aria-hidden="true" /></div>
            </div>
            <Card title={categoryName} className="products__catalog">
              <DataTable caption="Catálogo de produtos — resultados filtrados" columns={columns} rows={rows} rowKey={(product) => product.id}
                emptyTitle="Nenhum produto encontrado" emptyDescription="Tente outro nome, SKU ou código de barras, ou ajuste os filtros." />
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
        <footer className="products__footer"><span>{data.store} · {data.unit}</span><span>Amostra demonstrativa · {data.products.length} produtos · {data.updatedAt}</span></footer>
        <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? 'Detalhes do produto'}
          description="Dados demonstrativos. Consulta sem alteração de estoque ou preço."
          actions={<Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button>}>
          {selected && <><dl className="products__details">
            <div><dt>SKU</dt><dd>{selected.sku}</dd></div><div><dt>Código de barras</dt><dd>{selected.barcode}</dd></div>
            <div><dt>Categoria</dt><dd>{data.categories.find((category) => category.id === selected.categoryId)?.name}</dd></div>
            <div><dt>Preço</dt><dd>{currency.format(selected.price)}</dd></div>
            <div><dt>Na gôndola</dt><dd>{selected.shelfUnits} un.</dd></div><div><dt>No depósito</dt><dd>{selected.warehouseUnits} un.</dd></div>
            <div><dt>Mínimo na gôndola</dt><dd>{selected.minimumShelfUnits} un.</dd></div>
            <div><dt>Situação</dt><dd>{labels[productAvailability(selected)]}</dd></div>
          </dl>{data.shelfCodes[selected.sourceShelfId] && <Link className="products__map-link" to={`/mapa?gondola=${encodeURIComponent(data.shelfCodes[selected.sourceShelfId])}`}>
            Ver gôndola {data.shelfCodes[selected.sourceShelfId]} no mapa<ArrowRight size={18} aria-hidden="true" /></Link>}</>}
        </Modal>
      </>}
  </main>
}
