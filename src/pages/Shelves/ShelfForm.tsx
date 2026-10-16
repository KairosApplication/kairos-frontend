import { useId, useRef, useState, type SubmitEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import { ShelfValidationError } from '../../services/shelfCatalogService'
import type { ShelfCatalogItem, ShelfFieldErrors, ShelfInput } from '../../types/shelfCatalog'
import type { MapSector } from '../../types/storeMap'

type ShelfFormProps = {
  shelf?: ShelfCatalogItem
  sectors: MapSector[]
  onClose: () => void
  onSave: (input: ShelfInput) => Promise<void>
}

export default function ShelfForm({ shelf, sectors, onClose, onSave }: ShelfFormProps) {
  const [input, setInput] = useState<ShelfInput>({ code: shelf?.id ?? '', sectorId: shelf?.sectorId ?? sectors[0]?.id ?? '', location: shelf?.location ?? '' })
  const [errors, setErrors] = useState<ShelfFieldErrors>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const code = useRef<HTMLInputElement>(null)
  const formId = useId()

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError('')
    setErrors({})
    try {
      await onSave(input)
    } catch (cause) {
      if (cause instanceof ShelfValidationError) {
        setErrors(cause.fields)
        // Aguarda os atributos de validação serem aplicados antes de mover o foco.
        setTimeout(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      }
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a gôndola. Tente novamente.')
      savingRef.current = false
      setSaving(false)
    }
  }

  return <Modal open onClose={() => { if (!savingRef.current) onClose() }} initialFocusRef={code}
    title={shelf ? `Editar gôndola ${shelf.id}` : 'Nova gôndola'}
    description="Demonstração: alterações temporárias, descartadas ao recarregar. Nenhum dado é enviado ao banco."
    actions={<><Button variant="secondary" disabled={saving} onClick={onClose}>Cancelar</Button>
      <Button type="submit" form={formId} loading={saving} loadingLabel="Salvando…">{shelf ? 'Salvar alterações' : 'Criar gôndola'}</Button></>}>
    <form id={formId} ref={form} onSubmit={submit} noValidate className="shelves__form">
      <TextField ref={code} label="Código" value={input.code} maxLength={12} autoComplete="off" disabled={saving}
        hint="Até 12 letras, números ou hífen. O código deve ser único." error={errors.code}
        onChange={(event) => setInput({ ...input, code: event.target.value })} />
      <div className="shelves__form-select"><SelectField label="Setor" value={input.sectorId} disabled={saving} error={errors.sectorId}
        onChange={(event) => setInput({ ...input, sectorId: event.target.value })}>
        {sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
      </SelectField><ChevronDown size={18} aria-hidden="true" /></div>
      <TextField label="Localização" value={input.location} maxLength={80} autoComplete="off" disabled={saving}
        placeholder="Ex.: Corredor 1, próximo à entrada" error={errors.location}
        onChange={(event) => setInput({ ...input, location: event.target.value })} />
      <p className="shelves__form-note">{shelf ? 'A edição preserva os produtos vinculados e a situação de estoque.' : 'A nova gôndola começa sem produtos vinculados.'}</p>
      {error && <p className="shelves__form-error" role="alert">{error}</p>}
    </form>
  </Modal>
}
