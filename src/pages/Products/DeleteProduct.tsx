import { useRef, useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import type { CatalogProduct } from '../../types/productCatalog'

type Props = { product: CatalogProduct; onClose: () => void; onDelete: () => Promise<void> }
export default function DeleteProduct({ product, onClose, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const cancel = useRef<HTMLButtonElement>(null)
  const blocked = product.placements.length > 0
  async function confirm() {
    if (pending.current || blocked) return
    pending.current = true; setDeleting(true); setError('')
    try { await onDelete() } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir o produto.')
      pending.current = false; setDeleting(false)
    }
  }
  return <Modal open initialFocusRef={cancel} onClose={() => { if (!pending.current) onClose() }} title={`Excluir produto ${product.id}?`}
    description="Confirme a exclusão do produto antes de continuar."
    actions={<><Button ref={cancel} variant="secondary" disabled={deleting} onClick={onClose}>Cancelar</Button><Button variant="danger" disabled={blocked} loading={deleting} loadingLabel="Excluindo…" onClick={() => void confirm()}>Excluir produto</Button></>}>
    <p><strong>{product.name}</strong> · {product.brand}</p>
    <p>{blocked ? `Este produto está vinculado a ${product.placements.length} gôndola(s). Remova ou transfira os vínculos antes de excluir.` : 'Confirme a remoção deste produto do catálogo. Histórico de compras ou outros vínculos podem impedir a exclusão.'}</p>
    {error && <p className="products__form-error" role="alert">{error}</p>}
  </Modal>
}
