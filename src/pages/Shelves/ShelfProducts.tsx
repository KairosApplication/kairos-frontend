import { useRef, useState, type SubmitEvent } from 'react'
import Button from '../../components/Button'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import useApiData from '../../hooks/useApiData'
import { getStoreCatalog } from '../../services/storeCatalogService'
import { ApiHttpError } from '../../services/apiData'
import { ShelfProductUncertainError, writeShelfProduct } from '../../services/shelfProductService'
import './shelf-products.css'

export default function ShelfProducts({ shelfId, onClose }: { shelfId: number; onClose: (changed: boolean) => void }) {
  const { data, error, reload, fail } = useApiData(getStoreCatalog)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [editing, setEditing] = useState<number | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const changed = useRef(false)
  const links = data?.productShelves.filter(l => l.shelfId === shelfId) ?? []
  const available = data?.products.filter(p => editing ? p.id === Number(productId) : !links.some(l => l.productId === p.id)) ?? []
  const exists = data?.shelves.some(s => s.id === shelfId)
  function reset() { setEditing(null); setRemoving(null); setProductId(''); setQuantity('1') }
  async function mutate(method: 'POST' | 'PATCH' | 'DELETE', id?: number) {
    if (pending.current || !data || !exists) return
    const product = method === 'DELETE' ? links.find(l => l.id === id)?.productId : Number(productId)
    if (!product || !data.products.some(p => p.id === product)) { setFailure('Selecione um produto disponível.'); return }
    pending.current = true; setBusy(true); setFailure(''); setMessage('')
    try {
      await writeShelfProduct(method, shelfId, product, quantity, id)
      changed.current = true; reset(); setMessage(method === 'DELETE' ? 'Vínculo removido.' : 'Vínculo salvo.')
      await reload()
    } catch (cause) {
      if (cause instanceof ShelfProductUncertainError || cause instanceof ApiHttpError && cause.status === 401) { changed.current = true; reset(); fail(cause) }
      else setFailure(cause instanceof Error ? cause.message : 'Não foi possível alterar o vínculo.')
    } finally { pending.current = false; setBusy(false) }
  }
  function submit(event: SubmitEvent<HTMLFormElement>) { event.preventDefault(); void mutate(editing ? 'PATCH' : 'POST', editing ?? undefined) }
  return <Modal open title={`Produtos da gôndola ${shelfId}`} description="Consulte e ajuste os produtos e as quantidades vinculadas."
    onClose={() => { if (!pending.current) onClose(changed.current) }} actions={<Button variant="secondary" disabled={busy} onClick={() => onClose(changed.current)}>Fechar</Button>}>
    {message && <p role="status">{message}</p>}
    {failure && <p role="alert">{failure}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar os vínculos." description={error.message} onRetry={() => void reload()} />
      : !data ? <Feedback kind="loading" title="Carregando vínculos…" /> : !exists ? <Feedback kind="empty" title="Gôndola não encontrada" /> : <>
        <ul className="shelf-products__list">{links.map(link => <li key={link.id}>
          <strong>{data.products.find(p => p.id === link.productId)?.name}</strong><span>{link.productQuantity} unidades</span>
          <div><Button variant="secondary" disabled={busy} onClick={() => { setEditing(link.id); setRemoving(null); setProductId(String(link.productId)); setQuantity(String(link.productQuantity)); setFailure('') }}>Editar quantidade de {data.products.find(p => p.id === link.productId)?.name}</Button>
          <Button variant="ghost" disabled={busy} onClick={() => setRemoving(link.id)}>Remover vínculo {link.id}</Button></div>
          {removing === link.id && <div role="group" aria-label={`Confirmar remoção do vínculo ${link.id}`}><p>Remover o produto desta gôndola? Isso remove o vínculo e seu saldo cadastrado.</p><Button variant="danger" loading={busy} onClick={() => void mutate('DELETE', link.id)}>Confirmar remoção</Button><Button variant="secondary" disabled={busy} onClick={() => setRemoving(null)}>Cancelar remoção</Button></div>}
        </li>)}</ul>
        {!links.length && <p>Nenhum produto vinculado.</p>}
        <form className="shelf-products__form" onSubmit={submit} noValidate>
          <h3>{editing ? 'Editar quantidade' : 'Vincular produto'}</h3>
          <SelectField label="Produto" required disabled={busy || editing !== null} value={productId} onChange={event => setProductId(event.target.value)}>
            <option value="">Selecione um produto</option>{available.map(p => <option value={p.id} key={p.id}>{p.name} · ID {p.id}</option>)}
          </SelectField>
          <TextField label="Quantidade na gôndola" required inputMode="numeric" value={quantity} disabled={busy} onChange={event => setQuantity(event.target.value)} />
          <p>Informe uma quantidade positiva. Remover o vínculo não movimenta produtos para o depósito.</p>
          <div><Button type="submit" loading={busy} disabled={!available.length}>Salvar vínculo</Button>{editing && <Button variant="secondary" disabled={busy} onClick={reset}>Cancelar edição</Button>}</div>
        </form>
      </>}
  </Modal>
}
