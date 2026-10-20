import { useState } from 'react'
import { Link } from 'react-router'
import { Download } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import VisualPage from '../../components/VisualPage'
import useDemoData from '../../hooks/useDemoData'
import { downloadInsights, getInsightsView } from '../../services/insightsViewService'
import './styles.css'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const moves = [
  { title: 'Antecipe bebidas', description: 'Maior procura entre 17h e 20h.', path: '/produtos' },
  { title: 'Revise o mínimo de leite', description: 'Saída acima do estoque de segurança.', path: '/produtos' },
  { title: 'Reforce a equipe', description: 'Mais tempo de reposição após as 18h.', path: '/funcionarios' },
]

export default function Insights() {
  const { data, loading, error, retry } = useDemoData(getInsightsView)
  const [message, setMessage] = useState('')
  const [exportError, setExportError] = useState(false)
  function exportAnalysis() {
    if (!data) return
    try { downloadInsights(data); setExportError(false); setMessage('Download da análise demonstrativa iniciado.') }
    catch { setExportError(true); setMessage('Não foi possível preparar a análise. Tente novamente.') }
  }
  const stockouts = [...(data?.categories ?? [])].sort((first, second) => ['Bebidas', 'Mercearia', 'Limpeza', 'Higiene'].indexOf(first.name) - ['Bebidas', 'Mercearia', 'Limpeza', 'Higiene'].indexOf(second.name))

  return <VisualPage title="Insights" description="Transforme os dados da operação em próximas ações." className="insights"
    actions={<Button icon={<Download />} disabled={!data} onClick={exportAnalysis}>Exportar análise</Button>}>
    {message && <p role={exportError ? 'alert' : 'status'} className="visual-message">{message}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar a análise." onRetry={retry} /> : loading || !data ? <Feedback kind="loading" title="Carregando análise…" /> : <div className="insights__grid">
      <Card tone="brand" className="insights__summary"><p>Últimos 7 dias</p><h2>Uma semana<br />em crescimento.</h2><strong>{money.format(data.revenue)}</strong><div><Badge tone="warning">+ {decimal.format(data.growth)}%</Badge><span>vs. semana anterior</span></div></Card>
      <Card title="O que move suas vendas" description="Participação na receita por categoria" className="insights__categories">
        <div className="insights__shares" role="img" aria-label={`Participação na receita: ${data.categories.map((category) => `${category.name} ${category.share}%`).join(', ')}`}>
          {data.categories.map((category) => <div key={category.name}><span>{category.name}</span><span className="insights__track"><span className={category.name === 'Bebidas' ? 'insights__bar--warm' : ''} style={{ width: `${category.share / 40 * 100}%` }} /></span><strong>{category.share}%</strong></div>)}
        </div>
      </Card>
      <Card title="Próximos movimentos" description="Oportunidades para sua loja" className="insights__moves"><ol>{moves.map((move, index) => <li key={move.title}><Link to={move.path}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{move.title}</strong><p>{move.description}</p></div></Link></li>)}</ol></Card>
      <Card className="insights__metrics" aria-label="Indicadores operacionais"><dl>
        <div><dt>Taxa de ruptura</dt><dd>{decimal.format(data.stockoutRate)}%</dd></div><div><dt>Tempo de reposição</dt><dd>{data.restockingMinutes} min</dd></div><div><dt>Reposições concluídas</dt><dd>{data.completionRate}%</dd></div>
      </dl></Card>
      <Card title="Onde estão as rupturas" description={`${stockouts.reduce((total, category) => total + category.stockouts, 0)} produtos indisponíveis nas gôndolas · dia demonstrativo`} className="insights__stockouts">
        <div className="insights__chart" role="img" aria-label={`Produtos em ruptura por categoria: ${stockouts.map((category) => `${category.name} ${category.stockouts}`).join(', ')}`}>
          {stockouts.map((category) => <div key={category.name}><div className="insights__column"><strong>{category.stockouts}</strong><span className={category.name === 'Bebidas' ? 'insights__bar--warm' : ''} style={{ height: `${category.stockouts * 34}px` }} /></div><span>{category.name}</span></div>)}
        </div>
      </Card>
    </div>}
  </VisualPage>
}
