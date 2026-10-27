import { useState } from 'react'
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
import useApiData from '../../hooks/useApiData'
import { getStoreMap } from '../../services/storeMapService'
import type { MapShelf, ShelfStatus } from '../../types/storeMap'
import './styles.css'
import '../../styles/accessible-names.css'

const labels: Record<ShelfStatus, string> = { stocked: 'Com saldo', stockout: 'Com saldo zero', empty: 'Sem produtos' }
const tones = { stocked: 'success', stockout: 'danger', empty: 'neutral' } as const
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
function shelfLabel(shelf: MapShelf) { return shelf.status === 'stockout' ? `${shelf.stockoutCount} sem saldo` : labels[shelf.status] }

export default function StoreMap() {
  const [params] = useSearchParams()
  const requestedId = params.get('gondola')
  const { data, error, reload } = useApiData(getStoreMap)
  const [query, setQuery] = useState('')
  const [sectorId, setSectorId] = useState('all')
  const [choice, setChoice] = useState<{ route: string | null; id: string } | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const search = normalize(query)
  const visible = data?.shelves.filter(s => (sectorId === 'all' || s.sectorId === sectorId)
    && (!search || [s.id, s.location, ...s.products.map(p => p.name)].some(text => normalize(text).includes(search)))) ?? []
  const chosen = choice?.route === requestedId ? choice.id : requestedId
  const missingRequested = Boolean(requestedId && choice?.route !== requestedId && data && !data.shelves.some(s => s.id === requestedId))
  const selected = visible.find(s => s.id === chosen) ?? (missingRequested ? undefined : visible[0])
  const sector = data?.sectors.find(s => s.id === selected?.sectorId)
  const aisles = data?.aisles.filter(a => (sectorId === 'all' || a.sectorId === sectorId) && visible.some(s => s.aisleId === a.id)) ?? []

  return <main className="store-map">
    <PageHeader title="Mapa da Loja" description="Consulte as gôndolas e os saldos cadastrados por corredor." />
    {error ? <Feedback kind="error" title="Não foi possível carregar o mapa." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando mapa da loja…" /> : <>
      <div className="store-map__filters">
        <TextField label="Buscar gôndola ou produto" type="search" placeholder="Buscar ID ou produto" icon={<Search size={18} />} value={query} onChange={event => setQuery(event.target.value)} />
        <div className="store-map__sector-filter"><SelectField label="Setor" value={sectorId} onChange={event => setSectorId(event.target.value)}><option value="all">Todos os setores</option>{data.sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</SelectField><ChevronDown size={18} aria-hidden="true" /></div>
        <p className="store-map__result" role="status"><Badge tone="success">{visible.length} gôndolas{visible.length !== data.shelves.length ? ` de ${data.shelves.length}` : ''}</Badge></p>
      </div>
      <p className="store-map__note">Mapa esquemático por corredor, em ordem de ID. A posição física das gôndolas, caixas e acessos não está disponível.</p>
      {!visible.length ? <Card><Feedback kind="empty" title="Nenhuma gôndola encontrada" description="Consulte os cadastros ou ajuste a busca e o setor." /><Button variant="secondary" onClick={() => { setQuery(''); setSectorId('all') }}>Limpar filtros</Button><Link to="/gondolas">Gerenciar gôndolas</Link></Card> : <div className="store-map__layout">
        <div><Card title="Visão da loja" className="store-map__overview">
          <div className="store-map__floor"><p className="store-map__stockroom">Organização por corredor</p>
            <div className="store-map__scroll" role="region" aria-label="Corredores da loja — rolagem horizontal" tabIndex={0}>
              <div className="store-map__sectors" style={{ gridTemplateColumns: `repeat(${aisles.length}, minmax(120px, 1fr))` }}>
                {aisles.map(a => <section className="store-map__sector" key={a.id} aria-label={`${a.sectorName} · Corredor ${a.position} · ID ${a.id}`}>
                  <h3>{a.sectorName}</h3>
                  <div className="store-map__shelves" style={{ gridTemplateRows: `repeat(${Math.max(6, visible.filter(s => s.aisleId === a.id).length)}, minmax(50px, auto))` }}>
                    {visible.filter(s => s.aisleId === a.id).map(s => <button key={s.id} type="button" className={`store-map__shelf store-map__shelf--${s.status}`}
                      aria-pressed={selected?.id === s.id} title={`Gôndola ${s.id}`} aria-controls="store-map-selection" onClick={() => setChoice({ route: requestedId, id: s.id })}>
                      <span className="a11y-hidden-label">Gôndola</span>{' '}<strong>{s.id}</strong>{' '}<span>{shelfLabel(s)}</span>
                    </button>)}
                  </div><p className="store-map__aisle">Corredor {a.position} · ID {a.id}</p>
                </section>)}
              </div>
            </div>
          </div>
        </Card><ul className="store-map__legend" aria-label="Situação de todas as gôndolas da loja">{(['stocked', 'stockout', 'empty'] as const).map(status => <li key={status}><Badge tone={tones[status]}>{data.shelves.filter(s => s.status === status).length} {status === 'stocked' ? 'com saldo' : status === 'stockout' ? 'com saldo zero' : 'sem produtos'}</Badge></li>)}</ul></div>
        {selected ? <Card id="store-map-selection" className="store-map__selection" title={`Gôndola ${selected.id}`} description={`${selected.location} · ${sector?.name}`}>
          <Badge tone={tones[selected.status]}>{labels[selected.status]}</Badge>
          <div className="store-map__summary" aria-live="polite" aria-atomic="true"><p><strong>Gôndola {selected.id}: {selected.stockoutCount ? `${selected.stockoutCount} produtos sem saldo` : labels[selected.status]}</strong></p><p>Capacidade máxima: {selected.maximumCapacity}<br />Responsável não disponível nesta consulta.</p></div>
          <div className="store-map__products"><h3>Produtos vinculados</h3>{selected.products.length ? <ul>{selected.products.map(p => <li key={p.id}><strong>{p.name}</strong><p>Gôndola: {p.shelfUnits} un.</p></li>)}</ul> : <p>Esta gôndola não possui produtos vinculados.</p>}<p>Saldo do depósito e estoque mínimo não disponíveis nesta consulta.</p></div>
          <div className="store-map__actions"><Link className="store-map__central" to="/gondolas"><ArrowRight size={18} aria-hidden="true" />Gerenciar gôndolas</Link><Button variant="secondary" icon={<ArrowRight size={18} />} onClick={() => setDetailsOpen(true)}>Ver detalhes</Button></div>
        </Card> : <Card id="store-map-selection"><Feedback kind="empty" title="Gôndola solicitada não encontrada" description="A identificação da URL não corresponde a uma gôndola cadastrada. Selecione uma das gôndolas do mapa." /></Card>}
      </div>}
      <footer className="store-map__footer"><span>Cadastro de gôndolas</span><span>Consulta realizada em {data.updatedAt}</span></footer>
      <Modal open={detailsOpen && Boolean(selected)} onClose={() => setDetailsOpen(false)} title={`Detalhes da gôndola ${selected?.id ?? ''}`} description="Informações cadastradas na loja." actions={<Button variant="secondary" onClick={() => setDetailsOpen(false)}>Fechar</Button>}>
        {selected && <dl className="store-map__details"><div><dt>Setor</dt><dd>{sector?.name}</dd></div><div><dt>Localização</dt><dd>{selected.location}</dd></div><div><dt>Capacidade máxima</dt><dd>{selected.maximumCapacity}</dd></div><div><dt>Situação</dt><dd>{labels[selected.status]}</dd></div><div><dt>Produtos sem saldo</dt><dd>{selected.stockoutCount}</dd></div></dl>}
      </Modal>
    </>}
  </main>
}
