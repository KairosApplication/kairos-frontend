// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StoreMap from './index'
import TestSession from '../../test/TestSession'
import { installShelfApiMock } from '../../test/shelfApiMock'

let api: ReturnType<typeof installShelfApiMock>
const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeEach(() => {
  api = installShelfApiMock()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(() => {
  cleanup(); vi.unstubAllGlobals()
  if (showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})
async function setup(path = '/mapa') {
  render(<TestSession><MemoryRouter initialEntries={[path]}><StoreMap /></MemoryRouter></TestSession>)
  await screen.findByRole('region', { name: 'Visão da loja' })
}

it('renders actual aisles, including multiple aisles in the same sector, without inventing a floor plan', async () => {
  await setup()
  expect(within(screen.getByRole('region', { name: 'Visão da loja' })).getAllByRole('button', { name: /^Gôndola/ })).toHaveLength(8)
  expect(screen.getByRole('region', { name: 'Bebidas · Corredor 1 · ID 11' })).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Bebidas · Corredor 2 · ID 12' })).toBeTruthy()
  expect(screen.getByText('2 com saldo')).toBeTruthy()
  expect(screen.getByText('1 com saldo zero')).toBeTruthy()
  expect(screen.getByText(/Mapa esquemático por corredor/)).toBeTruthy()
  expect(screen.queryByText('ENTRADA / SAÍDA')).toBeNull()
  expect(screen.getByRole('region', { name: 'Gôndola 101' })).toBeTruthy()
  expect(screen.getByText('Gôndola: 0 un.')).toBeTruthy()
  expect(screen.getByText('Gôndola: 4 un.')).toBeTruthy()
})

it('filters by product and sector and never leaves hidden shelf details selected', async () => {
  await setup()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' AGUA ' } })
  expect(screen.getByText('2 gôndolas de 8')).toBeTruthy()
  fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: '2' } })
  expect(screen.getByText('Nenhuma gôndola encontrada')).toBeTruthy()
  expect(screen.queryByRole('region', { name: 'Gôndola 101' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  fireEvent.click(screen.getByRole('button', { name: 'Gôndola 103 Sem produtos' }))
  expect(screen.getByRole('region', { name: 'Gôndola 103' })).toBeTruthy()
})

it('does not silently substitute a different identity for a missing URL ID', async () => {
  await setup('/mapa?gondola=A12')
  expect(screen.getByText('Gôndola solicitada não encontrada')).toBeTruthy()
  expect(screen.queryByRole('region', { name: 'Gôndola 101' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Gôndola 103 Sem produtos' }))
  expect(screen.getByRole('region', { name: 'Gôndola 103' })).toBeTruthy()
})

it('opens real details and restores keyboard focus', async () => {
  await setup('/mapa?gondola=104')
  const trigger = screen.getByRole('button', { name: 'Ver detalhes' })
  trigger.focus(); fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Detalhes da gôndola 104' })
  expect(within(dialog).getByText('Mercearia')).toBeTruthy()
  expect(within(dialog).getByText('Corredor 3')).toBeTruthy()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})

it('handles permission failures with a read retry', async () => {
  api.fetch.mockImplementationOnce(async () => new Response(null, { status: 403 }))
  render(<TestSession><MemoryRouter><StoreMap /></MemoryRouter></TestSession>)
  expect(await screen.findByRole('alert')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('region', { name: 'Visão da loja' })).toBeTruthy()
})
