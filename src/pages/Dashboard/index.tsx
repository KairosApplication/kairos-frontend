import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChartColumn, Download, Lightbulb } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import useApiData from '../../hooks/useApiData'
import { getStoreCatalog } from '../../services/storeCatalogService'
import { operationDay } from '../../services/operationalAnalyticsService'
import { exportSalesCsv } from '../../services/salesApiService'
import './styles.css'
export default function Dashboard() {
  const { data, error, reload } = useApiData(getStoreCatalog)
  const [message, setMessage] = useState(''); const [exportFailed, setExportFailed] = useState(false)
  const today = operationDay()
  const date = new Date(`${today}T12:00:00Z`)
  const zero = data?.productShelves.filter(link => link.productQuantity === 0) ?? []
  const stockoutProducts = new Set(zero.map(link => link.productId)).size
  const stockoutShelves = [...new Set(zero.map(link => link.shelfId))]
  const productsOnShelf = (shelfId: number) => new Set(zero.filter(link => link.shelfId === shelfId).map(link => link.productId)).size
  function download() { if (!data) return; try { exportSalesCsv([['Indicador', 'Valor'], ['Data', today], ['Receita de hoje', 'Não informado'], ['Vendas de hoje', 'Não informado'], ['Ticket médio', 'Não informado'], ['Reposições pendentes', 'Não informado'], ['Reposições em andamento', 'Não informado'], ['Reposições concluídas', 'Não informado'], ['Produtos em ruptura', String(stockoutProducts)], ['Gôndolas com ruptura', String(stockoutShelves.length)]], 'kairos-dashboard.csv'); setExportFailed(false); setMessage('Download do relatório iniciado.') } catch { setExportFailed(true); setMessage('Não foi possível exportar o relatório.') } }
  return <main className="dashboard"><PageHeader title="Dashboard" description="Veja o que está acontecendo na sua loja hoje." actions={<Button icon={<Download />} disabled={!data} onClick={download}>Exportar relatório</Button>} />
    {message && <p role={exportFailed ? 'alert' : 'status'}>{message}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar o Dashboard." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando Dashboard…" /> : <>
      <div className="dashboard__grid">
        <Card tone="brand" className="dashboard-pulse"><div className="dashboard-pulse__heading"><h2>Pulso da loja · hoje</h2><Badge tone="warning">{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(date)}</Badge></div><div className="dashboard-pulse__body"><div><p className="dashboard-pulse__revenue" aria-label="Receita de hoje não informada">R$ —</p><p className="dashboard-pulse__detail">Vendas — · Ticket médio —</p></div><ChartColumn size={48} strokeWidth={1} aria-hidden="true" /></div><p className="dashboard-pulse__growth">Dados de vendas indisponíveis.</p></Card>
        <Card title="A loja precisa de você" className="dashboard-attention"><ul><li><Link to="/reposicoes"><strong aria-label="Quantidade de reposições pendentes não informada">—</strong><span>reposições pendentes<small>Status das tarefas indisponível.</small></span></Link></li><li><Link to="/mapa"><strong>{stockoutProducts.toLocaleString('pt-BR')}</strong><span>produtos em ruptura<small>{stockoutShelves.length} {stockoutShelves.length === 1 ? 'gôndola precisa' : 'gôndolas precisam'} de atenção</small></span></Link></li></ul></Card>
        <Card title="Ritmo das vendas" description="Receita dos últimos 7 dias" className="dashboard-sales"><div className="dashboard-sales__unavailable"><ChartColumn size={40} strokeWidth={1} aria-hidden="true" /><p>Histórico de vendas indisponível.</p></div></Card>
        <Card title="Prioridades do turno" description="Comece pelo que tem mais impacto" className="dashboard-priorities"><ol>{stockoutShelves.slice(0, 3).map((shelfId, index) => <li key={shelfId}><Link to={`/mapa?gondola=${shelfId}`}><Badge tone={index === 0 ? 'danger' : index === 1 ? 'warning' : 'success'}>{String(index + 1).padStart(2, '0')}</Badge><span>Gôndola {shelfId}<small>{productsOnShelf(shelfId)} {productsOnShelf(shelfId) === 1 ? 'produto sem exposição' : 'produtos sem exposição'}</small></span></Link></li>)}</ol>{!zero.length && <p>Nenhuma ruptura identificada nas gôndolas.</p>}</Card>
        <Card title="Reposição em movimento" actions={<span className="dashboard-restocking__total">Status indisponíveis</span>} className="dashboard-restocking"><div className="dashboard-restocking__bar dashboard-restocking__bar--unknown" aria-hidden="true" /><ul>{['Pendentes', 'Em andamento', 'Concluídas'].map(label => <li key={label}><Link to="/reposicoes"><strong aria-label={`${label}: quantidade não informada`}>—</strong><span>{label}</span></Link></li>)}</ul></Card>
        <Card tone="warm" className="dashboard-opportunity"><div className="dashboard-opportunity__heading"><Lightbulb aria-hidden="true" /><h2>Antes do horário de pico</h2></div><p>Confira os produtos em ruptura e planeje as reposições da loja.</p><Link className="dashboard__text-link" to="/insights">Explorar oportunidades<ArrowRight size={18} aria-hidden="true" /></Link></Card>
      </div><footer className="dashboard__footer"><span>Indicadores da loja</span><span>Consulta de {new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date)}</span></footer>
    </>}
  </main>
}
