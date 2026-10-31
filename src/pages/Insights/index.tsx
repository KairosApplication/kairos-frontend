import { useState } from 'react'
import { Link } from 'react-router'
import { Download } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import VisualPage from '../../components/VisualPage'
import useOperationalAnalytics from '../../hooks/useOperationalAnalytics'
import { exportOperations } from '../../services/operationalAnalyticsService'
import './styles.css'
export default function Insights() {
  const { data, error, reload, loadingHistory } = useOperationalAnalytics()
  const [message, setMessage] = useState(''); const [exportFailed, setExportFailed] = useState(false)
  const number = (value: number) => value.toLocaleString('pt-BR')
  const categories = data && data.categories.length > 4
    ? [...data.categories.slice(0, 3), { id: 'others', name: 'Outras categorias', count: data.categories.slice(3).reduce((sum, c) => sum + c.count, 0), zeroLinks: data.categories.slice(3).reduce((sum, c) => sum + c.zeroLinks, 0) }]
    : data?.categories ?? []
  const maxStockouts = Math.max(1, ...categories.map(c => c.zeroLinks))
  const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
  function download() { if (!data) return; try { exportOperations(data); setExportFailed(false); setMessage('Download da análise iniciado.') } catch { setExportFailed(true); setMessage('Não foi possível exportar a análise.') } }
  return <VisualPage title="Insights" description="Analise o catálogo e os registros disponíveis da operação." className="insights" footer="Indicadores calculados a partir da API"
    actions={<Button icon={<Download />} disabled={!data} onClick={download}>Exportar análise</Button>}>
    {message && <p role={exportFailed ? 'alert' : 'status'}>{message}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar a análise." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando análise…" /> : <div className="insights__grid">
      <Card tone="brand" className="insights__summary"><p>Últimos 7 dias</p><h2>Reposições<br />registradas.</h2><strong>{data.week ? number(data.week.length) : '—'}</strong><div><span className="insights__period">{date(data.days[0].date)} – {date(data.today)}</span></div>{loadingHistory && <p role="status">Carregando indicadores de reposição…</p>}{data.restockingError && <p className="insights__summary-note">Registros de reposição indisponíveis.</p>}</Card>
      <Card title="Distribuição do catálogo" description="Participação dos produtos por categoria" className="insights__categories"><div className="insights__shares" role="region" aria-label="Produtos por categoria">{categories.map((c, index) => <div key={c.id}><span>{c.name}</span><progress className={index === 1 ? 'insights__bar--warm' : undefined} aria-label={`${c.name}: ${c.count} produtos`} value={c.count} max={data.catalog.products.length || 1} /><strong>{Math.round(c.count / (data.catalog.products.length || 1) * 100)}%</strong></div>)}</div>{!categories.length && <p>Catálogo sem produtos.</p>}</Card>
      <Card title="Próximas ações" className="insights__moves"><ol><li><Link to="/mapa"><span aria-hidden="true">01</span><div><strong>Revisar gôndolas</strong><p>{number(data.zero.length)} vínculos sem saldo.</p></div></Link></li><li><Link to="/produtos"><span aria-hidden="true">02</span><div><strong>Consultar produtos</strong><p>{number(data.catalog.products.length)} produtos no catálogo.</p></div></Link></li><li><Link to="/reposicoes"><span aria-hidden="true">03</span><div><strong>Consultar reposições</strong><p>Conferir quantidades e avarias registradas.</p></div></Link></li></ol></Card>
      <Card className="insights__metrics"><dl><div><dt>Unidades nas gôndolas</dt><dd>{number(data.quantity)}</dd></div><div><dt>Vínculos com saldo</dt><dd>{number(data.availableLinks)}</dd></div><div><dt>Avarias nos últimos sete dias</dt><dd>{data.week ? number(data.week.reduce((sum, r) => sum + r.damagedQuantity, 0)) : '—'}</dd></div></dl></Card>
      <Card title="Onde estão as rupturas" description={`${number(data.zero.length)} vínculos sem saldo nas gôndolas · hoje`} className="insights__stockouts"><div className="insights__chart" role="region" aria-label="Vínculos sem saldo por categoria">{categories.map((c, index) => <div key={c.id}><div className="insights__column"><strong>{number(c.zeroLinks)}</strong><span aria-hidden="true" className={index === 0 ? 'insights__bar--warm' : undefined} style={{ height: `${c.zeroLinks / maxStockouts * 96}px` }} /></div><span>{c.name}</span></div>)}</div>{!categories.length && <p>Catálogo sem produtos.</p>}</Card>
    </div>}
  </VisualPage>
}
