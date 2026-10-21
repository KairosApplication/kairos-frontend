import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight, ChevronDown, Search } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import { getStoreMap } from '../../services/storeMapService'
import type { MapShelf, ShelfStatus, StoreMapData } from '../../types/storeMap'
import './styles.css'

const statusLabels: Record<ShelfStatus, string> = { stocked: 'Abastecida', low: 'Estoque baixo', stockout: 'Reposição urgente', empty: 'Sem produtos' }
const statusTones = { stocked: 'success', low: 'warning', stockout: 'danger', empty: 'neutral' } as const
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()

function shelfLabel(shelf: MapShelf) {
  return shelf.status === 'stockout' ? `${shelf.stockoutCount} rupturas` : statusLabels[shelf.status]
}

export default function StoreMap() {
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<StoreMapData | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [sectorId, setSectorId] = useState('all')
  const [selectedId, setSelectedId] = useState(searchParams.get('gondola') ?? 'A12')
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setFailed(false)
      try {
        const result = await getStoreMap()
        if (active) setData(result)
      } catch {
        if (active) setFailed(true)
      }
    }
    void load()
    return () => { active = false }
  }, [attempt])

  const search = normalize(query)
  const visible = data?.shelves.filter((shelf) => (sectorId === 'all' || shelf.sectorId === sectorId)
    && (!search || normalize(shelf.id).includes(search) || shelf.restockingProducts.some((product) => normalize(product.name).includes(search)))) ?? []
  const selected = visible.find((shelf) => shelf.id === selectedId) ?? visible[0]
  const sector = data?.sectors.find((item) => item.id === selected?.sectorId)
  const visibleSectors = data?.sectors.filter((item) => sectorId === 'all' || item.id === sectorId) ?? []

  return <main className="store-map">
    <PageHeader title="Mapa da Loja" description="Acompanhe a situação das gôndolas e encontre prioridades por setor." />
    {failed ? <Feedback kind="error" title="Não foi possível carregar o mapa." onRetry={() => setAttempt((value) => value + 1)} />
      : !data ? <Feedback kind="loading" title="Carregando mapa da loja…" /> : <>
        <div className="store-map__filters">
          <TextField label="Buscar gôndola ou produto" type="search" placeholder="Buscar gôndola ou produto" icon={<Search size={18} />}
            value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="store-map__sector-filter">
            <SelectField label="Setor" value={sectorId} onChange={(event) => setSectorId(event.target.value)}>
              <option value="all">Todos os setores</option>
              {data.sectors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </SelectField>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
          <p className="store-map__result" role="status"><Badge tone="success">{visible.length} gôndolas{visible.length !== data.shelves.length ? ` de ${data.shelves.length}` : ''}</Badge></p>
        </div>
        {visible.length === 0 ? <Card>
          <Feedback kind="empty" title="Nenhuma gôndola encontrada" description="Tente outro código ou produto. A busca por produto usa a lista demonstrativa de reposição disponível." />
          <Button variant="secondary" onClick={() => { setQuery(''); setSectorId('all') }}>Limpar filtros</Button>
        </Card> : <div className="store-map__layout">
          <div>
            <Card title="Visão da loja" className="store-map__overview">
              <div className="store-map__floor">
                <p className="store-map__stockroom">Fundo da loja · Estoque</p>
                <div className="store-map__sectors" style={{ gridTemplateColumns: `repeat(${visibleSectors.length}, minmax(0, 1fr))` }}>
                  {visibleSectors.map((item) => <section className="store-map__sector" key={item.id} aria-label={`${item.name} · ${item.aisle}`}>
                    <h3>{item.name}</h3>
                    <div className="store-map__shelves" style={{ gridTemplateRows: `repeat(${Math.max(6, ...data.shelves.filter((shelf) => shelf.sectorId === item.id).map((shelf) => shelf.row))}, minmax(50px, auto))` }}>
                      {visible.filter((shelf) => shelf.sectorId === item.id).map((shelf) => <button key={shelf.id} type="button"
                        className={`store-map__shelf store-map__shelf--${shelf.status}`} style={{ gridRow: shelf.row }}
                        aria-pressed={selected?.id === shelf.id} aria-label={`Gôndola ${shelf.id}, ${shelfLabel(shelf)}`} title={`Gôndola ${shelf.id}`}
                        aria-controls="store-map-selection" onClick={() => setSelectedId(shelf.id)}>
                        <strong>{shelf.id}</strong><span>{shelfLabel(shelf)}</span>
                      </button>)}
                    </div>
                    <p className="store-map__aisle">{item.aisle}</p>
                  </section>)}
                </div>
                <div className="store-map__checkouts" aria-label="Caixas da loja">{['01', '02', '03', '04'].map((id) => <span key={id}>Caixa {id}</span>)}</div>
                <p className="store-map__entrance">Entrada / Saída <ArrowRight size={18} aria-hidden="true" /></p>
              </div>
            </Card>
            <ul className="store-map__legend" aria-label="Situação de todas as gôndolas da loja">
              {(['stocked', 'low', 'stockout', 'empty'] as const).filter((status) => status !== 'empty' || data.shelves.some((shelf) => shelf.status === 'empty')).map((status) => <li key={status}><Badge tone={statusTones[status]}>
                {data.shelves.filter((shelf) => shelf.status === status).length} {status === 'stocked' ? 'abastecidas' : status === 'low' ? 'com estoque baixo' : status === 'empty' ? 'sem produtos' : 'com rupturas'}
              </Badge></li>)}
            </ul>
          </div>
          {selected && <Card id="store-map-selection" className="store-map__selection" title={`Gôndola ${selected.id}`} description={`${selected.location} · ${sector?.name}`}>
            <Badge tone={statusTones[selected.status]}>{statusLabels[selected.status]}</Badge>
            <div className="store-map__summary" aria-live="polite" aria-atomic="true">
              <p><strong>Gôndola {selected.id}: {selected.stockoutCount > 0 ? `${selected.stockoutCount} produtos em ruptura` : statusLabels[selected.status]}</strong></p>
              <p>{selected.status === 'empty' ? 'Ainda sem análise de produtos' : 'Última análise às 14:27'}<br />Responsável: {selected.responsible}</p>
            </div>
            <div className="store-map__products"><h3>Produtos para repor</h3>
              {selected.restockingProducts.length ? <ul>{selected.restockingProducts.map((product) => <li key={product.id}>
                <strong>{product.name}</strong><p>Gôndola: {product.shelfUnits} un. · Depósito: {product.warehouseUnits} un.</p>
              </li>)}</ul> : <p>{selected.status === 'empty' ? 'Esta gôndola ainda não possui produtos vinculados.' : selected.status === 'stocked' ? 'Sem reposição indicada neste exemplo.' : 'A lista de produtos desta gôndola não está disponível na demonstração.'}</p>}
            </div>
            <div className="store-map__actions"><Link className="store-map__central" to="/reposicoes"><ArrowRight size={18} aria-hidden="true" />Ver central de reposição</Link>
              <Button variant="secondary" icon={<ArrowRight size={18} />} onClick={() => setDetailsOpen(true)}>Ver detalhes</Button></div>
          </Card>}
        </div>}
        <footer className="store-map__footer"><span>{data.store} · {data.unit}</span><span>Dados demonstrativos · {data.updatedAt}</span></footer>
        <Modal open={detailsOpen && Boolean(selected)} onClose={() => setDetailsOpen(false)} title={`Detalhes da gôndola ${selected?.id ?? ''}`}
          description="Dados demonstrativos. Nenhuma alteração é enviada ao banco."
          actions={<Button variant="secondary" onClick={() => setDetailsOpen(false)}>Fechar</Button>}>
          {selected && <dl className="store-map__details"><div><dt>Setor</dt><dd>{sector?.name}</dd></div><div><dt>Localização</dt><dd>{selected.location}</dd></div>
            <div><dt>Situação</dt><dd>{statusLabels[selected.status]}</dd></div><div><dt>Produtos em ruptura</dt><dd>{selected.stockoutCount}</dd></div>
            <div><dt>Responsável</dt><dd>{selected.responsible}</dd></div></dl>}
        </Modal>
      </>}
  </main>
}
