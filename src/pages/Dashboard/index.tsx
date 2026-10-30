import { useState } from 'react'
import { Link } from 'react-router'
import { Download } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import useApiData from '../../hooks/useApiData'
import { exportOperations, getOperationalAnalytics } from '../../services/operationalAnalyticsService'
import SalesChart from './SalesChart'
import './styles.css'
export default function Dashboard() {
  const { data, error, reload } = useApiData(getOperationalAnalytics)
  const [message, setMessage] = useState(''); const [exportFailed, setExportFailed] = useState(false)
  function download() { if (!data) return; try { exportOperations(data); setExportFailed(false); setMessage('Download do relatório iniciado.') } catch { setExportFailed(true); setMessage('Não foi possível exportar o relatório.') } }
  return <main className="dashboard"><PageHeader title="Dashboard" description="Acompanhe os dados disponíveis da operação da loja." actions={<Button icon={<Download />} disabled={!data} onClick={download}>Exportar relatório</Button>} />
    {message && <p role={exportFailed ? 'alert' : 'status'}>{message}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar o Dashboard." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando Dashboard…" /> : <>
      <div className="dashboard__grid"><Card tone="brand" className="dashboard-pulse"><p>Catálogo da loja · {data.today}</p><h2>{data.catalog.products.length} produtos</h2><p>{data.quantity} unidades registradas nas gôndolas</p><p>{data.catalog.shelves.length} gôndolas · {data.catalog.sectors.length} setores</p></Card>
        <Card title="A loja precisa de você" className="dashboard-attention"><dl><div><dt>Vínculos sem saldo</dt><dd>{data.zero.length}</dd></div><div><dt>Gôndolas sem produtos vinculados</dt><dd>{data.emptyShelves}</dd></div></dl><Link to="/mapa">Consultar mapa</Link></Card>
        <Card title="Reposições nos últimos sete dias" className="dashboard-sales">{data.restockingError ? <Feedback kind="error" title="Reposições indisponíveis." description={data.restockingError.message} onRetry={() => void reload()} /> : <SalesChart points={data.days} />}</Card>
        <Card title="Prioridades por saldo" className="dashboard-priorities"><ul>{data.zero.slice(0, 3).map(l => <li key={l.id}><Link to={`/mapa?gondola=${l.shelfId}`}>{data.catalog.products.find(p => p.id === l.productId)?.name} · Gôndola {l.shelfId}</Link></li>)}</ul>{!data.zero.length && <p>Nenhum vínculo com saldo zero nesta consulta.</p>}</Card>
        <Card title="Reposição registrada" className="dashboard-restocking"><p>{data.week ? `${data.week.length} registros nos últimos sete dias` : 'Registros indisponíveis.'}</p><Link to="/reposicoes">Consultar reposições</Link></Card>
        <Card title="Vendas" className="dashboard-opportunity"><p>Receita, ticket médio e evolução de vendas não estão disponíveis nesta consulta.</p><Link to="/vendas-clientes">Consultar clientes e compras</Link></Card>
      </div><footer className="dashboard__footer"><span>Catálogo e registros consultados na API</span><span>Período de reposição: {data.days[0].date} a {data.today}</span></footer>
    </>}
  </main>
}
