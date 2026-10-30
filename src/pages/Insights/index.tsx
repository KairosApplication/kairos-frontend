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
  function download() { if (!data) return; try { exportOperations(data); setExportFailed(false); setMessage('Download da análise iniciado.') } catch { setExportFailed(true); setMessage('Não foi possível exportar a análise.') } }
  return <VisualPage title="Insights" description="Analise o catálogo e os registros disponíveis da operação." className="insights" footer="Indicadores calculados a partir da API"
    actions={<Button icon={<Download />} disabled={!data} onClick={download}>Exportar análise</Button>}>
    {message && <p role={exportFailed ? 'alert' : 'status'}>{message}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar a análise." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando análise…" /> : <div className="insights__grid">
      <Card tone="brand" className="insights__summary"><p>Últimos sete dias</p><h2>Reposições registradas</h2><strong>{data.week?.length ?? '—'}</strong><p>{data.days[0].date} a {data.today}</p>{loadingHistory && <p role="status">Carregando indicadores de reposição…</p>}{data.restockingError && <p>Registros de reposição indisponíveis.</p>}</Card>
      <Card title="Distribuição do catálogo" description="Quantidade de produtos por categoria." className="insights__categories"><div className="insights__shares" role="region" aria-label="Produtos por categoria" tabIndex={0}>{data.categories.map(c => <div key={c.id}><span>{c.name}</span><progress aria-label={`${c.name}: ${c.count} produtos`} value={c.count} max={data.catalog.products.length || 1} /><strong>{number(c.count)}</strong></div>)}</div>{!data.categories.length && <p>Catálogo sem produtos.</p>}</Card>
      <Card title="Próximas ações" className="insights__moves"><ol><li><Link to="/mapa"><span aria-hidden="true">01</span><div><strong>Revisar gôndolas</strong><p>{number(data.zero.length)} vínculos sem saldo.</p></div></Link></li><li><Link to="/produtos"><span aria-hidden="true">02</span><div><strong>Consultar produtos</strong><p>{number(data.catalog.products.length)} produtos no catálogo.</p></div></Link></li><li><Link to="/reposicoes"><span aria-hidden="true">03</span><div><strong>Consultar reposições</strong><p>Conferir quantidades e avarias registradas.</p></div></Link></li></ol></Card>
      <Card className="insights__metrics"><dl><div><dt>Unidades nas gôndolas</dt><dd>{number(data.quantity)}</dd></div><div><dt>Vínculos com saldo</dt><dd>{number(data.availableLinks)}</dd></div><div><dt>Avarias nos últimos sete dias</dt><dd>{data.week ? number(data.week.reduce((sum, r) => sum + r.damagedQuantity, 0)) : '—'}</dd></div></dl></Card>
      <Card title="Vínculos sem saldo por categoria" className="insights__stockouts"><div className="insights__shares" role="region" aria-label="Vínculos sem saldo por categoria" tabIndex={0}>{data.categories.map(c => <div key={c.id}><span>{c.name}</span><progress aria-label={`${c.name}: ${c.zeroLinks} vínculos sem saldo`} value={c.zeroLinks} max={data.zero.length || 1} /><strong>{number(c.zeroLinks)}</strong></div>)}</div>{!data.categories.length && <p>Catálogo sem produtos.</p>}<p className="insights__note">Receita, tempo médio de reposição e previsão de demanda não estão disponíveis nesta consulta.</p></Card>
    </div>}
  </VisualPage>
}
