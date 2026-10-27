import { useId, useRef, useState, type SubmitEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import { ShelfValidationError } from '../../services/shelfCatalogService'
import type { ShelfCatalogItem, ShelfFieldErrors, ShelfInput } from '../../types/shelfCatalog'
import type { MapAisle } from '../../types/storeMap'

type Props = { shelf?: ShelfCatalogItem; aisles: MapAisle[]; onClose: () => void; onSave: (input: ShelfInput) => Promise<void> }
export default function ShelfForm({ shelf, aisles, onClose, onSave }: Props) {
  const [input, setInput] = useState<ShelfInput>({ aisleId: shelf?.aisleId ?? aisles[0]?.id ?? '', maximumCapacity: shelf ? String(shelf.maximumCapacity) : '' })
  const [errors, setErrors] = useState<ShelfFieldErrors>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const aisle = useRef<HTMLSelectElement>(null)
  const id = useId()
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true; setSaving(true); setError(''); setErrors({})
    try { await onSave(input) } catch (cause) {
      if (cause instanceof ShelfValidationError) {
        setErrors(cause.fields)
        setTimeout(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      }
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a gôndola.')
      pending.current = false; setSaving(false)
    }
  }
  return <Modal open onClose={() => { if (!pending.current) onClose() }} initialFocusRef={aisle}
    title={shelf ? `Editar gôndola ${shelf.id}` : 'Nova gôndola'} description="Confirme os dados. As alterações serão gravadas na loja."
    actions={<><Button variant="secondary" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" form={id} loading={saving} loadingLabel="Salvando…">{shelf ? 'Salvar alterações' : 'Criar gôndola'}</Button></>}>
    <form id={id} ref={form} onSubmit={submit} noValidate className="shelves__form">
      <p className="shelves__form-note">Campos com * são obrigatórios. O ID é gerado no cadastro.</p>
      {shelf && <TextField label="ID da gôndola" value={shelf.id} readOnly />}
      <div className="shelves__form-select"><SelectField ref={aisle} label="Corredor" required disabled={saving} value={input.aisleId} error={errors.aisleId}
        onChange={event => { setInput({ ...input, aisleId: event.target.value }); setErrors({ ...errors, aisleId: undefined }) }}>
        {!aisles.length && <option value="">Nenhum corredor disponível</option>}
        {aisles.map(a => <option key={a.id} value={a.id}>{a.sectorName} · Corredor {a.position} · ID {a.id}</option>)}
      </SelectField><ChevronDown size={18} aria-hidden="true" /></div>
      <TextField label="Capacidade máxima" type="number" required min={1} max={2147483647} step={1} disabled={saving} value={input.maximumCapacity} error={errors.maximumCapacity}
        onChange={event => { setInput({ ...input, maximumCapacity: event.target.value }); setErrors({ ...errors, maximumCapacity: undefined }) }} />
      {error && <p className="shelves__form-error" role="alert">{error}</p>}
    </form>
  </Modal>
}
