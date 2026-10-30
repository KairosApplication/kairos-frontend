import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import Button from '../../components/Button'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import useApiData from '../../hooks/useApiData'
import { getProductCategories, ProductValidationError } from '../../services/productMutationService'
import type { CatalogProduct, ProductFieldErrors, ProductInput } from '../../types/productCatalog'

type Props = { product?: CatalogProduct; onClose: () => void; onSave: (input: ProductInput) => Promise<void> }
export default function ProductForm({ product, onClose, onSave }: Props) {
  const { data: categories, error: categoryError, reload } = useApiData(getProductCategories)
  const [input, setInput] = useState<ProductInput>({ name: product?.name ?? '', brand: product?.brand ?? '', categoryId: product?.categoryId ?? '', price: product ? product.price.toFixed(2).replace('.', ',') : '' })
  const [fields, setFields] = useState<ProductFieldErrors>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const name = useRef<HTMLInputElement>(null)
  const formId = useId()
  useEffect(() => { if (categories?.length) name.current?.focus() }, [categories])
  function change(field: keyof ProductInput, value: string) { setInput({ ...input, [field]: value }); setFields({ ...fields, [field]: undefined }) }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || !categories?.length) return
    pending.current = true; setSaving(true); setError(''); setFields({})
    try {
      if (!categories.some(c => c.id === input.categoryId)) throw new ProductValidationError({ categoryId: 'Selecione uma categoria disponível.' })
      await onSave(input)
    } catch (cause) {
      if (cause instanceof ProductValidationError) {
        setFields(cause.fields)
        setTimeout(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      }
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o produto.')
      pending.current = false; setSaving(false)
    }
  }
  return <Modal open initialFocusRef={name} onClose={() => { if (!pending.current) onClose() }}
    title={product ? `Editar produto ${product.id}` : 'Novo produto'} description="Confirme os dados. As alterações serão gravadas na sua empresa."
    actions={<><Button variant="secondary" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" form={formId} disabled={!categories?.length} loading={saving} loadingLabel="Salvando…">{product ? 'Salvar alterações' : 'Criar produto'}</Button></>}>
    {categoryError ? <Feedback kind="error" title="Não foi possível carregar as categorias." description={categoryError.message} onRetry={() => void reload()} />
      : !categories ? <Feedback kind="loading" title="Carregando categorias…" />
        : !categories.length ? <Feedback kind="empty" title="Nenhuma categoria disponível" description="Solicite o cadastro de uma categoria para continuar." /> : null}
    <form id={formId} ref={form} onSubmit={submit} noValidate className="products__form">
      <p className="products__data-note">Campos com * são obrigatórios. O ID e a empresa são definidos no cadastro.</p>
      {product && <TextField label="ID do produto" value={product.id} readOnly />}
      <TextField ref={name} label="Nome do produto" required autoComplete="off" maxLength={100} disabled={saving || !categories?.length} value={input.name} error={fields.name} onChange={event => change('name', event.target.value)} />
      <TextField label="Marca" required autoComplete="off" maxLength={255} disabled={saving || !categories?.length} value={input.brand} error={fields.brand} onChange={event => change('brand', event.target.value)} />
      <SelectField label="Categoria" required disabled={saving || !categories?.length} value={input.categoryId} error={fields.categoryId} onChange={event => change('categoryId', event.target.value)}>
        <option value="">Selecione uma categoria</option>
        {input.categoryId && categories && !categories.some(c => c.id === input.categoryId) && <option value={input.categoryId} disabled>Categoria não disponível</option>}
        {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </SelectField>
      <TextField label="Preço (R$)" required inputMode="decimal" autoComplete="off" disabled={saving || !categories?.length} value={input.price} error={fields.price} hint="Use vírgula ou ponto, com até duas casas decimais e sem separador de milhar." onChange={event => change('price', event.target.value)} />
      {error && <p className="products__form-error" role="alert">{error}</p>}
    </form>
  </Modal>
}
