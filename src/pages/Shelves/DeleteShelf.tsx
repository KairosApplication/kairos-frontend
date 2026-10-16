import { useRef, useState } from 'react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import type { ShelfCatalogItem } from '../../types/shelfCatalog'

type DeleteShelfProps = { shelf: ShelfCatalogItem; onClose: () => void; onDelete: () => Promise<void> }

export default function DeleteShelf({ shelf, onClose, onDelete }: DeleteShelfProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const cancel = useRef<HTMLButtonElement>(null)
  const blocked = shelf.productCount > 0

  async function confirm() {
    if (pending.current || blocked) return
    pending.current = true
    setDeleting(true)
    setError('')
    try { await onDelete() } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir a gôndola. Tente novamente.')
      pending.current = false
      setDeleting(false)
    }
  }

  return <Modal open onClose={() => { if (!pending.current) onClose() }} initialFocusRef={cancel}
    title={`Excluir gôndola ${shelf.id}?`} description="Demonstração: a exclusão vale somente até recarregar a página."
    actions={<><Button ref={cancel} variant="secondary" onClick={onClose} disabled={deleting}>Cancelar</Button>
      <Button variant="danger" disabled={blocked} loading={deleting} loadingLabel="Excluindo…" onClick={() => { void confirm() }}>Excluir gôndola</Button></>}>
    <p>{shelf.sectorName} · {shelf.location}</p>
    <p>{blocked ? `Esta gôndola possui ${shelf.productCount} produtos vinculados. Remova ou transfira os produtos antes de excluir.` : 'Confirme a remoção desta gôndola vazia da listagem e do mapa demonstrativos.'}</p>
    {error && <p className="shelves__form-error" role="alert">{error}</p>}
  </Modal>
}
