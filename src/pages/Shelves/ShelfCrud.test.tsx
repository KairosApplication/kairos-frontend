// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Shelves from './index'
import * as service from '../../services/shelfCatalogService'
import type { ShelfCatalog } from '../../types/shelfCatalog'

const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(async () => {
  cleanup()
  vi.restoreAllMocks()
  for (const shelf of (await service.getShelfCatalog()).shelves.filter((item) => item.status === 'empty')) await service.deleteShelf(shelf.id)
  if (showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

async function setup() {
  render(<MemoryRouter><Shelves /></MemoryRouter>)
  await screen.findByRole('table')
}

function fill(code: string, location: string, sectorId = 'A') {
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByRole('textbox', { name: 'Código' }), { target: { value: code } })
  fireEvent.change(within(dialog).getByRole('textbox', { name: 'Localização' }), { target: { value: location } })
  fireEvent.change(within(dialog).getByRole('combobox', { name: 'Setor' }), { target: { value: sectorId } })
}

it('cria, edita e exclui uma gôndola vazia atualizando a listagem e os indicadores', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Nova gôndola' }))
  expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Código' }))
  fill(' a99 ', 'Entrada', 'A')
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  const row = await screen.findByRole('rowheader', { name: 'A99' })
  expect(within(row.closest('tr')!).getByText('Sem produtos')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Gôndolas cadastradas' })).getByText('25')).toBeTruthy()
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Nova gôndola' })))
  fireEvent.click(screen.getByRole('button', { name: 'Editar gôndola A99' }))
  expect(screen.getByRole('textbox', { name: 'Localização' }).getAttribute('value')).toBe('Entrada')
  fill('C99', 'Fundo da loja', 'C')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(await screen.findByRole('rowheader', { name: 'C99' })).toBeTruthy()
  expect(screen.queryByRole('rowheader', { name: 'A99' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Ver gôndola C99 no mapa' }).getAttribute('href')).toBe('/mapa?gondola=C99')
  // O salvamento reposiciona o foco de forma assíncrona; conclua esse fluxo antes de iniciar outro.
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Nova gôndola' })))
  const trigger = screen.getByRole('button', { name: 'Excluir gôndola C99' })
  trigger.focus()
  fireEvent.click(trigger)
  const cancel = screen.getByRole('button', { name: 'Cancelar' })
  expect(document.activeElement).toBe(cancel)
  fireEvent.click(cancel)
  await waitFor(() => expect(document.activeElement).toBe(trigger))
  fireEvent.click(trigger)
  fireEvent.click(screen.getByRole('button', { name: 'Excluir gôndola' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(screen.queryByRole('rowheader', { name: 'C99' })).toBeNull()
  expect(within(screen.getByRole('region', { name: 'Gôndolas cadastradas' })).getByText('24')).toBeTruthy()
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Nova gôndola' })))
}, 15000)

it('valida campos e duplicatas sem fechar o modal ou perder a entrada', async () => {
  await setup()
  const trigger = screen.getByRole('button', { name: 'Nova gôndola' })
  trigger.focus()
  fireEvent.click(trigger)
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  expect(await screen.findByText('Informe uma localização de até 80 caracteres.')).toBeTruthy()
  fill('a12', 'Entrada')
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  expect(await screen.findByText('Já existe uma gôndola com esse código.')).toBeTruthy()
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Código' })))
  vi.spyOn(service, 'createShelf').mockRejectedValueOnce(new Error('Falha temporária ao salvar.'))
  fill('A98', 'Entrada')
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  expect(await screen.findByText('Falha temporária ao salvar.')).toBeTruthy()
  expect(screen.getByRole('textbox', { name: 'Código' }).getAttribute('value')).toBe('A98')
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
  expect((await service.getShelfCatalog()).shelves).toHaveLength(24)
})

it('informa o vínculo de produtos antes de permitir a exclusão', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Excluir gôndola A12' }))
  expect(screen.getByText(/Esta gôndola possui 18 produtos vinculados/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Excluir gôndola' }).hasAttribute('disabled')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.getByRole('rowheader', { name: 'A12' })).toBeTruthy()
})

it('impede envio duplo e fechamento durante uma operação pendente', async () => {
  await setup()
  let rejectSave: (reason: Error) => void = () => {}
  const pending = new Promise<ShelfCatalog>((_resolve, reject) => { rejectSave = reject })
  const save = vi.spyOn(service, 'createShelf').mockReturnValueOnce(pending)
  fireEvent.click(screen.getByRole('button', { name: 'Nova gôndola' }))
  fill('A98', 'Entrada')
  fireEvent.click(screen.getByRole('button', { name: 'Criar gôndola' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.submit(dialog.querySelector('form')!)
  expect(save).toHaveBeenCalledTimes(1)
  fireEvent.keyDown(dialog, { key: 'Escape' })
  fireEvent.click(screen.getByRole('button', { name: 'Fechar janela' }))
  expect(screen.getByRole('dialog')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Salvando…' }).hasAttribute('disabled')).toBe(true)
  rejectSave(new Error('Tente novamente.'))
  expect(await screen.findByText('Tente novamente.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
})
