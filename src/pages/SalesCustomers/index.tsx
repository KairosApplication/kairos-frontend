import { useCallback, useRef, useState, type SubmitEvent } from 'react'
import { Download, Search } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import DataTable, { type TableColumn } from '../../components/DataTable'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useApiData from '../../hooks/useApiData'
import { exportSalesCsv, getCustomers, getPurchaseTotal, getRecommendations, type ApiCustomer } from '../../services/salesApiService'
import './styles.css'
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function Recommendations({ customer, onClose }: { customer: ApiCustomer; onClose: () => void }) {
  const loader = useCallback((signal?: AbortSignal) => getRecommendations(customer.id, signal), [customer.id])
  const { data, error, reload } = useApiData(loader)
  return <Modal open title={`Recomendações para ${customer.userName}`} onClose={onClose} actions={<Button onClick={onClose}>Fechar</Button>}>
    {error ? <Feedback kind="error" title="Não foi possível consultar as recomendações." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando recomendações…" /> : data.length ? <ul>{data.map(p => <li key={p.productId}><strong>{p.productName}</strong><p>{p.categoryName} · Produto {p.productId}</p></li>)}</ul> : <Feedback kind="empty" title="Nenhuma recomendação disponível" />}
  </Modal>
}
function Purchase({ id }: { id: number }) {
  const loader = useCallback((signal?: AbortSignal) => getPurchaseTotal(id, signal), [id])
  const { data, error, reload } = useApiData(loader)
  return error ? <Feedback kind="error" title="Não foi possível consultar a compra." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Consultando compra…" /> : <Card title={`Compra ${data.purchaseId}`}><p role="status">Total: {currency.format(data.total)}</p></Card>
}
export default function SalesCustomers() {
  const { data, error, reload } = useApiData(getCustomers)
  const [tab, setTab] = useState('customers')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [recommendations, setRecommendations] = useState(false)
  const [purchaseInput, setPurchaseInput] = useState('')
  const [purchaseId, setPurchaseId] = useState<number | null>(null)
  const [purchaseError, setPurchaseError] = useState('')
  const purchaseField = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState('')
  const [exportError, setExportError] = useState(false)
  const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const filtered = data?.filter(c => normalize(`${c.id} ${c.userId} ${c.userName}`).includes(normalize(query))) ?? []
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)))
  const customer = data?.find(c => c.id === customerId) ?? data?.[0]
  const columns: TableColumn<ApiCustomer>[] = [
    { key: 'id', header: 'ID', render: c => c.id },
    { key: 'name', header: 'Cliente', render: c => <button type="button" className="sales-customers__text-button" onClick={() => setCustomerId(c.id)}>{c.userName}</button> },
    { key: 'user', header: 'ID do usuário', render: c => c.userId },
  ]
  function exportData() { try { exportSalesCsv([['ID', 'Cliente', 'ID do usuário'], ...filtered.map(c => [String(c.id), c.userName, String(c.userId)])], 'kairos-clientes.csv'); setExportError(false); setNotice('Download dos clientes filtrados iniciado.') } catch { setExportError(true); setNotice('Não foi possível exportar os clientes.') } }
  function searchPurchase(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); const id = Number(purchaseInput)
    if (!/^\d+$/.test(purchaseInput) || !Number.isSafeInteger(id) || id <= 0) { setPurchaseError('Informe um ID de compra inteiro e positivo.'); setPurchaseId(null); purchaseField.current?.focus(); return }
    setPurchaseError(''); setPurchaseId(id)
  }
  return <VisualPage title="Vendas & Clientes" description="Consulte clientes, recomendações e o total de uma compra." className="sales-customers" footer="Consultas realizadas na API"
    actions={<Button icon={<Download />} disabled={!data || tab !== 'customers'} onClick={exportData}>Exportar dados</Button>}>
    {notice && <p role={exportError ? 'alert' : 'status'}>{notice}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar os clientes." description={error.message} onRetry={() => void reload()} /> : !data ? <Feedback kind="loading" title="Carregando clientes…" /> : <>
      <div className="sales-customers__tabs"><div className="visual-tabs" role="group" aria-label="Visualização de vendas e clientes"><Button variant="secondary" aria-pressed={tab === 'sales'} onClick={() => setTab('sales')}>Vendas</Button><Button variant="secondary" aria-pressed={tab === 'customers'} onClick={() => setTab('customers')}>Clientes</Button></div></div>
      <div className="sales-customers__layout"><div className="sales-customers__main">
        <div className="sales-customers__stats"><Card title="Clientes retornados"><strong>{data.length}</strong></Card><Card title="Receita por período"><strong>—</strong><p>Não disponível nesta consulta.</p></Card><Card title="Histórico de compras"><strong>—</strong><p>Não disponível nesta consulta.</p></Card></div>
        {tab === 'customers' ? <><div className="visual-toolbar"><TextField label="Buscar cliente ou ID" type="search" icon={<Search />} value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} /></div>
          <Card title="Clientes" className="sales-customers__table"><DataTable caption="Clientes retornados pela API" rows={filtered.slice((currentPage - 1) * 10, currentPage * 10)} columns={columns} rowKey={c => String(c.id)} emptyTitle="Nenhum cliente encontrado" />
            <nav aria-label="Paginação dos clientes" className="sales-customers__pagination"><Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button><span aria-current="page">{currentPage}</span><Button variant="secondary" disabled={currentPage * 10 >= filtered.length} onClick={() => setPage(currentPage + 1)}>Próxima</Button></nav>
          </Card></> : <Card title="Consultar total da compra"><p>Informe o ID de uma compra para consultar seu total. Data, pagamento e histórico não são fornecidos neste endpoint.</p><form className="visual-form" onSubmit={searchPurchase} noValidate><TextField ref={purchaseField} label="ID da compra" inputMode="numeric" required value={purchaseInput} error={purchaseError} onChange={e => { setPurchaseInput(e.target.value); setPurchaseError('') }} /><Button type="submit">Consultar compra</Button></form>{purchaseId && <Purchase key={purchaseId} id={purchaseId} />}</Card>}
      </div><Card title="Cliente selecionado" className="sales-customers__customer">{customer ? <><h3>{customer.userName}</h3><p>ID {customer.id}</p><p>Usuário {customer.userId}</p><Button variant="secondary" onClick={() => setRecommendations(true)}>Ver recomendações</Button></> : <p>Nenhum cliente disponível.</p>}</Card></div>
      {recommendations && customer && <Recommendations customer={customer} onClose={() => setRecommendations(false)} />}
    </>}
  </VisualPage>
}
