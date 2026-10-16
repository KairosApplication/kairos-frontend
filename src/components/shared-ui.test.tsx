// @vitest-environment jsdom
import { useState, type FormEvent } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Button from './Button'
import TextField from './TextField'
import SelectField from './SelectField'
import DataTable from './DataTable'
import Modal from './Modal'

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')

beforeEach(() => {
  // jsdom has no native modal implementation; keyboard containment is checked in Chrome.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true,
    value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true,
    value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(() => {
  cleanup()
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
  vi.restoreAllMocks()
})

it('botão não envia um formulário por padrão e bloqueia cliques durante uma ação', () => {
  const submit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault())
  const click = vi.fn()
  const view = render(<form onSubmit={submit}><Button onClick={click}>Continuar</Button></form>)
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  expect(click).toHaveBeenCalledTimes(1)
  expect(submit).not.toHaveBeenCalled()
  view.rerender(<Button loading loadingLabel="Enviando" onClick={click}>Continuar</Button>)
  fireEvent.click(screen.getByRole('button', { name: 'Enviando' }))
  expect(click).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true')
})

it('campos ligam label, ajuda e erro com IDs distintos, preservando descrição externa', () => {
  render(<><p id="extra">Descrição adicional</p>
    <TextField label="Nome" hint="Nome completo" error="Nome obrigatório" aria-describedby="extra" />
    <TextField label="Apelido" hint="Opcional" />
    <SelectField label="Setor" error="Escolha um setor"><option value="">Selecione</option></SelectField></>)
  const name = screen.getByLabelText('Nome')
  const ids = name.getAttribute('aria-describedby')?.split(' ') ?? []
  expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(['Descrição adicional', 'Nome completo', 'Nome obrigatório'])
  expect(name.getAttribute('aria-invalid')).toBe('true')
  expect(name.id).not.toBe(screen.getByLabelText('Apelido').id)
  expect(screen.getByLabelText('Setor').getAttribute('aria-invalid')).toBe('true')
})

it('tabela apresenta carregamento, erro com nova tentativa, vazio e dados com cabeçalhos', () => {
  const retry = vi.fn()
  const props = { caption: 'Catálogo de teste', columns: [{ key: 'name', header: 'Nome', render: (row: { id: number; name: string }) => row.name }], rowKey: (row: { id: number }) => row.id }
  const view = render(<DataTable {...props} rows={[]} loading />)
  expect(screen.getByRole('status').textContent).toContain('Carregando')
  view.rerender(<DataTable {...props} rows={[]} error="Sem conexão" onRetry={retry} />)
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(retry).toHaveBeenCalledOnce()
  view.rerender(<DataTable {...props} rows={[]} />)
  expect(screen.getByRole('status').textContent).toContain('Nenhum resultado')
  view.rerender(<DataTable {...props} rows={[{ id: 1, name: 'Café' }]} />)
  expect(screen.getByRole('table', { name: 'Catálogo de teste' })).toBeTruthy()
  expect(screen.getByRole('rowheader', { name: 'Café' })).toBeTruthy()
  expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeTruthy()
})

it('modal controlado fecha por Escape e restaura foco e rolagem', () => {
  function Example() {
    const [open, setOpen] = useState(false)
    return <><Button onClick={() => setOpen(true)}>Abrir</Button><Modal open={open} onClose={() => setOpen(false)} title="Revisar dados"><p>Conteúdo</p></Modal></>
  }
  render(<Example />)
  const trigger = screen.getByRole('button', { name: 'Abrir' })
  trigger.focus()
  fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Revisar dados' })
  expect(document.body.style.overflow).toBe('hidden')
  expect(document.activeElement?.textContent).toBe('Revisar dados')
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
  expect(document.body.style.overflow).toBe('')
})
