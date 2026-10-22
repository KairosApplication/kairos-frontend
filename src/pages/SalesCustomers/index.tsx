import { useState, type SubmitEvent } from 'react'
import { ArrowRight, CalendarDays, ChevronDown, Download, Search, ShoppingCart, UsersRound, WalletCards } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import DataTable, { type TableColumn } from '../../components/DataTable'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useDemoData from '../../hooks/useDemoData'
import { downloadSalesCsv, getSalesView } from '../../services/salesViewService'
import type { CustomerView, SaleView } from '../../types/salesView'
import './styles.css'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const integerCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export default function SalesCustomers() {
  const { data, loading, error, retry } = useDemoData(getSalesView)
  const [tab, setTab] = useState('sales')
  const [query, setQuery] = useState('')
  const [payment, setPayment] = useState('all')
  const [date, setDate] = useState('2026-09-25')
  const [dateOpen, setDateOpen] = useState(false)
  const [customerId, setCustomerId] = useState('c1')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sale, setSale] = useState<SaleView | null>(null)
  const [message, setMessage] = useState('')
  const [exportFailed, setExportFailed] = useState(false)
  const customer = data?.customers.find((item) => item.id === customerId)
  const customerName = (id: string | null) => data?.customers.find((item) => item.id === id)?.name ?? 'Não identificado'
  const sales = data?.sales.filter((item) => item.date === date && (payment === 'all' || item.payment === payment) && normalize(`${item.id} ${customerName(item.customerId)}`).includes(normalize(query))) ?? []
  const clients = data?.customers.filter((item) => normalize(`${item.name} ${item.email}`).includes(normalize(query))) ?? []
  const snapshotDay = date === '2026-09-25'
  const columns: TableColumn<SaleView>[] = [
    { key: 'id', header: 'Venda', render: (item) => <button className="sales-customers__text-button" onClick={() => setSale(item)} aria-label={`Ver venda ${item.id}`}>{item.id}</button> },
    { key: 'time', header: 'Horário', render: (item) => item.time },
    { key: 'customer', header: 'Cliente', render: (item) => item.customerId ? <button className="sales-customers__text-button sales-customers__customer-name" onClick={() => setCustomerId(item.customerId!)} aria-label={`Selecionar cliente ${customerName(item.customerId)}`}>{customerName(item.customerId)}</button> : 'Não identificado' },
    { key: 'payment', header: 'Pagamento', render: (item) => item.payment },
    { key: 'value', header: 'Valor', render: (item) => currency.format(item.value) },
  ]
  const clientColumns: TableColumn<CustomerView>[] = [
    { key: 'name', header: 'Cliente', render: (item) => <button className="sales-customers__text-button" onClick={() => setCustomerId(item.id)}>{item.name}</button> },
    { key: 'email', header: 'E-mail', render: (item) => item.email },
    { key: 'purchases', header: 'Compras', render: (item) => item.purchases },
    { key: 'total', header: 'Total no período', render: (item) => currency.format(item.total) },
  ]

  function exportData() {
    try {
      const rows = tab === 'sales' ? [['Venda', 'Data', 'Horário', 'Cliente', 'Pagamento', 'Valor'], ...sales.map((item) => [item.id, item.date, item.time, customerName(item.customerId), item.payment, item.value.toFixed(2).replace('.', ',')])]
        : [['Cliente', 'E-mail', 'Compras', 'Total'], ...clients.map((item) => [item.name, item.email, String(item.purchases), item.total.toFixed(2).replace('.', ',')])]
      downloadSalesCsv([['Dados demonstrativos — amostra filtrada'], ...rows]); setExportFailed(false); setMessage('Download dos dados demonstrativos iniciado.')
    } catch { setExportFailed(true); setMessage('Não foi possível preparar o arquivo. Tente novamente.') }
  }
  function changeDate(event: SubmitEvent<HTMLFormElement>) { event.preventDefault(); setDate(String(new FormData(event.currentTarget).get('date'))); setDateOpen(false) }

  return <VisualPage title="Vendas & Clientes" description="Consulte transações e conheça o histórico de compras dos seus clientes." className="sales-customers"
    actions={<Button icon={<Download />} disabled={!data} onClick={exportData}>Exportar dados</Button>}>
    {message && <p role={exportFailed ? 'alert' : 'status'} className="visual-message">{message}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar vendas e clientes." onRetry={retry} /> : loading || !data ? <Feedback kind="loading" title="Carregando vendas…" /> : <>
      <div className="sales-customers__tabs"><div className="visual-tabs" role="group" aria-label="Visualização de vendas e clientes"><Button variant="secondary" aria-pressed={tab === 'sales'} onClick={() => { setTab('sales'); setQuery('') }}>Vendas</Button><Button variant="secondary" aria-pressed={tab === 'customers'} onClick={() => { setTab('customers'); setQuery('') }}>Clientes</Button></div><Button variant="secondary" icon={<CalendarDays size={18} />} onClick={() => setDateOpen(true)}>{date.split('-').reverse().join('/')}</Button></div>
      <div className="sales-customers__layout"><div className="sales-customers__main">
        <div className="sales-customers__stats">
          <Card title="Receita do dia" actions={<WalletCards size={18} />}><strong>{integerCurrency.format(snapshotDay ? data.summary.revenue : 0)}</strong><p>{snapshotDay ? '+ 9,7% em relação a ontem' : 'Sem dados neste dia da demonstração'}</p></Card>
          <Card title="Vendas realizadas" actions={<ShoppingCart size={18} />}><strong>{snapshotDay ? data.summary.count : 0}</strong><p>Ticket médio de {currency.format(snapshotDay ? data.summary.average : 0)}</p></Card>
          <Card title="Clientes identificados" actions={<UsersRound size={18} />}><strong>{snapshotDay ? data.summary.identified : 0}</strong><p>{snapshotDay ? '43,5% das vendas do dia' : 'Sem vendas na amostra deste dia'}</p></Card>
        </div>
        <div className="visual-toolbar"><TextField label="Buscar venda ou cliente" type="search" placeholder="Buscar venda ou cliente" icon={<Search size={18} />} value={query} onChange={(event) => setQuery(event.target.value)} />
          {tab === 'sales' && <div className="visual-filter-select"><SelectField label="Pagamento" value={payment} onChange={(event) => setPayment(event.target.value)}><option value="all">Pagamento</option>{['Pix', 'Crédito', 'Débito'].map((item) => <option key={item}>{item}</option>)}</SelectField><ChevronDown size={18} aria-hidden="true" /></div>}
        </div>
        <Card title={tab === 'sales' ? 'Vendas recentes' : 'Clientes da loja'} className="sales-customers__table">
          {tab === 'sales' ? <DataTable caption="Amostra de vendas demonstrativas" rows={sales} columns={columns} rowKey={(item) => item.id} emptyTitle="Nenhuma venda encontrada" /> : <DataTable caption="Clientes demonstrativos" rows={clients} columns={clientColumns} rowKey={(item) => item.id} emptyTitle="Nenhum cliente encontrado" />}
        </Card>
      </div>
      <Card title="Cliente selecionado" className="sales-customers__customer">
        {customer && <><span className="sales-customers__avatar">{customer.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><h3>{customer.name}</h3><Badge tone="success">Cliente recorrente</Badge>
          <p className="sales-customers__label">Última compra</p><strong className="sales-customers__last">25 set, às {customer.lastPurchase}</strong><div className="sales-customers__history"><h4>Histórico de consumo</h4><strong>{customer.purchases} compras</strong><p>{currency.format(customer.total)} no período</p></div>
          <p className="sales-customers__label">Categorias frequentes</p><div className="sales-customers__badges">{customer.categories.map((category, index) => <Badge key={category} tone={index ? 'warning' : 'success'}>{category}</Badge>)}</div>
          <Button variant="secondary" icon={<ArrowRight size={18} />} onClick={() => setHistoryOpen(true)}>Ver histórico</Button></>}
      </Card></div>
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={`Histórico de ${customer?.name ?? 'cliente'}`} description="Amostra de transações fictícias. Os totais do perfil representam um resumo ilustrativo do período." actions={<Button variant="secondary" onClick={() => setHistoryOpen(false)}>Fechar</Button>}>
        <ul className="sales-customers__history-list">{data.sales.filter((item) => item.customerId === customerId).map((item) => <li key={item.id}><strong>{item.id} · {item.time}</strong><span>{item.payment} · {currency.format(item.value)}</span></li>)}</ul>
      </Modal>
    </>}
    <Modal open={Boolean(sale)} onClose={() => setSale(null)} title={`Venda ${sale?.id ?? ''}`} description="Transação demonstrativa, sem movimentação financeira." actions={<Button variant="secondary" onClick={() => setSale(null)}>Fechar</Button>}>
      {sale && <dl className="visual-details"><div><dt>Cliente</dt><dd>{customerName(sale.customerId)}</dd></div><div><dt>Horário</dt><dd>{sale.time}</dd></div><div><dt>Pagamento</dt><dd>{sale.payment}</dd></div><div><dt>Valor</dt><dd>{currency.format(sale.value)}</dd></div></dl>}
    </Modal>
    <Modal open={dateOpen} onClose={() => setDateOpen(false)} title="Selecionar dia" description="A amostra possui transações somente em 25/09/2026." actions={<Button type="submit" form="sales-date">Aplicar</Button>}><form id="sales-date" onSubmit={changeDate}><TextField name="date" type="date" label="Data das vendas" defaultValue={date} required /></form></Modal>
  </VisualPage>
}
