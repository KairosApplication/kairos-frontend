import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChartColumn, Download, Lightbulb } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import SalesChart from './SalesChart'
import { currency, dashboardDemo as data, decimal, wholeCurrency } from './demo'
import { downloadDashboardReport } from './report'
import './styles.css'

export default function Dashboard() {
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false)
  const [exportMessage, setExportMessage] = useState('')
  const [exportFailed, setExportFailed] = useState(false)
  const [pending, active] = data.restocking
  const taskCount = data.restocking.reduce((total, item) => total + item.count, 0)

  function exportReport() {
    try {
      downloadDashboardReport(data)
      setExportFailed(false)
      setExportMessage('Download do relatório demonstrativo iniciado.')
    } catch {
      setExportFailed(true)
      setExportMessage('Não foi possível preparar o relatório. Tente novamente.')
    }
  }

  return <main className="dashboard">
    <PageHeader title="Dashboard" description="Veja o que está acontecendo na sua loja hoje."
      actions={<Button icon={<Download />} onClick={exportReport}>Exportar relatório</Button>} />
    {exportMessage && <p className={`dashboard__export-message${exportFailed ? ' dashboard__export-message--error' : ''}`} role={exportFailed ? 'alert' : 'status'}>{exportMessage}</p>}

    <div className="dashboard__grid">
      <Card tone="brand" className="dashboard-pulse" aria-labelledby="dashboard-pulse-title">
        <div className="dashboard-pulse__heading"><h2 id="dashboard-pulse-title">Pulso da loja · hoje</h2><Badge tone="warning"><time dateTime={data.date}>{data.dateLabel}</time></Badge></div>
        <div className="dashboard-pulse__body"><div><p className="dashboard-pulse__revenue">{wholeCurrency.format(data.revenue)}</p>
          <p className="dashboard-pulse__detail">{data.salesCount} vendas · Ticket médio {currency.format(data.averageTicket)}</p></div>
          <ChartColumn size={48} strokeWidth={1.2} aria-hidden="true" /></div>
        <p className="dashboard-pulse__growth">+{decimal.format(data.dailyGrowth)}% em relação a ontem</p>
      </Card>

      <Card title="A loja precisa de você" className="dashboard-attention">
        <ul>
          <li><Link to="/reposicoes"><strong>{pending.count}</strong><span>reposições pendentes<small>{active.count} já estão em andamento</small></span></Link></li>
          <li><Link to="/produtos"><strong>{data.stockouts}</strong><span>produtos em ruptura<small>{data.shelvesNeedingAttention} gôndolas precisam de atenção</small></span></Link></li>
        </ul>
      </Card>

      <Card title="Ritmo das vendas" description="Receita dos últimos 7 dias" actions={<Badge tone="success">+{decimal.format(data.weeklyGrowth)}%</Badge>} className="dashboard-sales">
        <SalesChart points={data.sales} />
      </Card>

      <Card title="Prioridades do turno" description="Comece pelo que tem mais impacto" className="dashboard-priorities">
        <ol>
          <li><Link to="/mapa"><Badge tone="danger">01</Badge><span>Gôndola A12<small>2 produtos sem exposição</small></span></Link></li>
          <li><Link to="/reposicoes"><Badge tone="warning">02</Badge><span>Definir responsáveis<small>{data.pendingAssignments} tarefas aguardando atribuição</small></span></Link></li>
          <li><Link to="/produtos"><Badge tone="success">03</Badge><span>Leite integral 1 L<small>Estoque para aproximadamente 1 dia</small></span></Link></li>
        </ol>
      </Card>

      <Card title="Reposição em movimento" actions={<span className="dashboard-restocking__total">{taskCount} tarefas hoje</span>} className="dashboard-restocking">
        <div className="dashboard-restocking__bar" role="img" aria-label={`${taskCount} tarefas: ${data.restocking.map((item) => `${item.count} ${item.label.toLocaleLowerCase('pt-BR')}`).join(', ')}`}>
          {data.restocking.map((item) => <span key={item.key} aria-hidden="true" className={`dashboard-restocking__segment--${item.key}`} style={{ flexGrow: item.count }} />)}
        </div>
        <ul>{data.restocking.map((item) => <li key={item.key}><Link to="/reposicoes"><strong>{item.count}</strong><span>{item.label}</span></Link></li>)}</ul>
      </Card>

      <Card tone="warm" className="dashboard-opportunity" aria-labelledby="dashboard-opportunity-title">
        <div className="dashboard-opportunity__heading"><Lightbulb size={22} aria-hidden="true" /><h2 id="dashboard-opportunity-title">Antes do horário de pico</h2></div>
        <p>Bebidas ganham procura às sextas.<br />Confira o estoque antes das 17h.</p>
        <Button variant="ghost" onClick={() => setOpportunitiesOpen(true)}>Explorar oportunidades<ArrowRight size={18} aria-hidden="true" /></Button>
      </Card>
    </div>

    <footer className="dashboard__footer"><span>Mercado Aurora · Unidade Centro</span><span>Dados demonstrativos · {data.updatedAt}</span></footer>

    <Modal open={opportunitiesOpen} onClose={() => setOpportunitiesOpen(false)} title="Prepare a loja para o próximo pico"
      description="Sugestões ilustrativas do Dashboard, baseadas nos dados demonstrativos do protótipo."
      actions={<Button variant="secondary" onClick={() => setOpportunitiesOpen(false)}>Fechar</Button>}>
      <ul className="dashboard-opportunity__suggestions"><li>Confira as bebidas antes das 17h e revise os produtos sem exposição.</li><li>Distribua as tarefas que ainda estão sem responsável.</li><li>Acompanhe o leite integral e os produtos próximos do estoque mínimo.</li></ul>
      <Link className="dashboard__text-link" to="/reposicoes">Ver central de reposição<ArrowRight size={18} aria-hidden="true" /></Link>
    </Modal>
  </main>
}
