import { useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Plus, Search } from 'lucide-react'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Card from '../../components/Card'
import TextField from '../../components/TextField'
import SelectField from '../../components/SelectField'
import DataTable, { type TableColumn } from '../../components/DataTable'
import Modal from '../../components/Modal'
import Feedback from '../../components/Feedback'
import PageHeader from '../../components/PageHeader'
import { availabilityLabels, exampleProducts, type ExampleProduct } from './examples'
import './styles.css'

const tones = { available: 'success', low: 'warning', out: 'danger' } as const
const columns: TableColumn<ExampleProduct>[] = [
  { key: 'name', header: 'Produto', render: (product) => product.name },
  { key: 'category', header: 'Categoria', render: (product) => product.category },
  { key: 'availability', header: 'Situação', render: (product) => <Badge tone={tones[product.availability]}>{availabilityLabels[product.availability]}</Badge> },
]

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR') }

export default function ComponentPreview() {
  const [products, setProducts] = useState(exampleProducts)
  const [query, setQuery] = useState('')
  const [availability, setAvailability] = useState('all')
  const [tableState, setTableState] = useState('ready')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const rows = products.filter((product) => normalize(product.name).includes(normalize(query.trim()))
    && (availability === 'all' || availability === product.availability))

  function addExample(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError('Informe o nome do produto de exemplo.')
      inputRef.current?.focus()
      return
    }
    setProducts((current) => [...current, { id: Math.max(...current.map((product) => product.id)) + 1,
      name: name.trim(), category: 'Exemplo local', availability: 'available' }])
    setQuery('')
    setAvailability('all')
    setTableState('ready')
    setOpen(false)
    setMessage(`${name.trim()} adicionado à demonstração. Os dados serão descartados ao recarregar.`)
  }

  return <main className="component-preview">
    <div className="component-preview__intro"><span>KAIROS · Biblioteca visual</span><Badge tone="warning">Dados demonstrativos</Badge></div>
    <PageHeader title="Componentes compartilhados" description="Uma base visual para as próximas telas. Explore os estados e as interações sem conexão com a API."
      actions={<Button icon={<Plus />} onClick={() => { setName(''); setNameError(''); setOpen(true) }}>Adicionar exemplo</Button>} />

    <div className="component-preview__cards">
      <Card title="Receita ilustrativa" description="Exemplo de card de destaque" tone="brand">
        <p className="component-preview__value">R$ 48.760</p><Badge tone="warning">+9,7% no período</Badge>
      </Card>
      <Card title="Reposição em movimento" description="Exemplo de indicador operacional">
        <p className="component-preview__value">12 <span>pendentes</span></p><Badge tone="success">8 em andamento</Badge>
      </Card>
      <Card title="Antes do horário de pico" description="Exemplo de recomendação" tone="warm">
        <p className="component-preview__copy">Revise as prioridades e prepare a equipe para o próximo turno.</p>
        <Button variant="ghost" icon={<ArrowRight />} onClick={() => document.getElementById('preview-table')?.scrollIntoView({ block: 'start' })}>Explorar exemplos</Button>
      </Card>
    </div>

    <Card title="Ações e situações" description="Variações de botões, bloqueio durante uma ação e estados com texto explícito.">
      <div className="component-preview__row">
        <Button onClick={() => setMessage('Ação de exemplo executada localmente.')}>Ação principal</Button>
        <Button variant="secondary" onClick={() => setMessage('Ação secundária executada localmente.')}>Ação secundária</Button>
        <Button variant="ghost" onClick={() => setMessage('Ação discreta executada localmente.')}>Ação discreta</Button>
        <Button variant="danger" onClick={() => setMessage('Exemplo de ação de atenção. Nenhum dado foi excluído.')}>Ação de atenção</Button>
        <Button disabled>Indisponível</Button><Button loading loadingLabel="Salvando…">Salvar</Button>
      </div>
      <p className="component-preview__message" role="status">{message}</p>
    </Card>

    <div id="preview-table">
      <Card title="Produtos de exemplo" description="Busca e filtros funcionam somente sobre os exemplos desta página." actions={<Badge>{rows.length} resultados</Badge>}>
        <div className="component-preview__filters">
          <TextField label="Buscar produto" type="search" icon={<Search size={18} />} placeholder="Busque pelo nome" value={query} onChange={(event) => setQuery(event.target.value)} />
          <SelectField label="Disponibilidade" value={availability} onChange={(event) => setAvailability(event.target.value)}>
            <option value="all">Todas as situações</option><option value="available">Disponível</option><option value="low">Estoque baixo</option><option value="out">Ruptura</option>
          </SelectField>
          <SelectField label="Estado da demonstração" value={tableState} onChange={(event) => setTableState(event.target.value)}>
            <option value="ready">Dados disponíveis</option><option value="loading">Carregando</option><option value="empty">Sem resultados</option><option value="error">Erro com nova tentativa</option>
          </SelectField>
        </div>
        <DataTable caption="Catálogo demonstrativo — sem dados do banco" columns={columns} rows={tableState === 'empty' ? [] : rows}
          rowKey={(product) => product.id} loading={tableState === 'loading'}
          error={tableState === 'error' ? 'Este erro é simulado para revisar a apresentação.' : undefined} onRetry={() => setTableState('ready')} />
      </Card>
    </div>

    <div className="component-preview__states">
      <Card title="Carregamento"><Feedback kind="loading" title="Preparando os indicadores" description="Estrutura de espera com descrição acessível." /></Card>
      <Card title="Estado vazio"><Feedback kind="empty" title="Tudo em dia por aqui" description="Use uma mensagem que explique a ausência de dados e o próximo passo." /></Card>
    </div>
    <p className="component-preview__footer">Demonstração disponível apenas no modo de desenvolvimento. Nenhuma alteração é enviada à API.</p>

    <Modal open={open} onClose={() => setOpen(false)} title="Adicionar produto de exemplo"
      description="Este formulário modifica apenas os exemplos em memória nesta página." initialFocusRef={inputRef}
      actions={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" form="preview-product-form">Adicionar</Button></>}>
      <form id="preview-product-form" onSubmit={addExample} noValidate>
        <TextField label="Nome do produto" name="productName" ref={inputRef} value={name} required maxLength={100}
          hint="Use um nome fictício para revisar o formulário." error={nameError}
          onChange={(event) => { setName(event.target.value); setNameError('') }} />
      </form>
    </Modal>
  </main>
}
