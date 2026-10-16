// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StoreMap from './index'
import { storeMapDemo } from '../../mocks/storeMap'
import { getStoreMap } from '../../services/storeMapService'

vi.mock('../../services/storeMapService', () => ({ getStoreMap: vi.fn() }))
const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')

beforeEach(() => {
  vi.mocked(getStoreMap).mockReset().mockResolvedValue(structuredClone(storeMapDemo))
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(() => {
  cleanup()
  if (showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

async function setup() {
  render(<MemoryRouter><Routes><Route path="/" element={<StoreMap />} /><Route path="/reposicoes" element={<h1>Central de reposição</h1>} /></Routes></MemoryRouter>)
  await screen.findByRole('region', { name: 'Visão da loja' })
}

it('mostra 24 gôndolas, totais coerentes e a seleção inicial do protótipo', async () => {
  await setup()
  const map = screen.getByRole('region', { name: 'Visão da loja' })
  expect(within(map).getAllByRole('button', { name: /^Gôndola/ })).toHaveLength(24)
  expect(screen.getByText('17 abastecidas')).toBeTruthy()
  expect(screen.getByText('4 com estoque baixo')).toBeTruthy()
  expect(screen.getByText('3 com rupturas')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Gôndola A12, 2 rupturas' }).getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByText('Coca-Cola 2 L')).toBeTruthy()
  expect(screen.getByText(/^Dados demonstrativos ·/)).toBeTruthy()
})

it('combina busca por produto sem acentos e setor, limpa filtros e não mantém detalhes ocultos', async () => {
  await setup()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '  AGUA  ' } })
  expect(within(screen.getByRole('region', { name: 'Visão da loja' })).getAllByRole('button')).toHaveLength(1)
  fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: 'D' } })
  expect(screen.getByText('Nenhuma gôndola encontrada')).toBeTruthy()
  expect(screen.queryByRole('region', { name: 'Gôndola A12' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  fireEvent.change(screen.getByRole('combobox', { name: 'Setor' }), { target: { value: 'D' } })
  expect(screen.getByRole('region', { name: 'Gôndola D11' })).toBeTruthy()
  expect(screen.getByText('6 gôndolas de 24')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Gôndola D21, 3 rupturas' }))
  expect(screen.getByRole('region', { name: 'Gôndola D21' })).toBeTruthy()
  expect(screen.getByText(/A lista de produtos desta gôndola não está disponível/)).toBeTruthy()
})

it('seleciona outra gôndola, abre detalhes e restaura o foco ao fechar', async () => {
  await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Gôndola B11, Estoque baixo' }))
  expect(screen.getByRole('region', { name: 'Gôndola B11' })).toBeTruthy()
  const trigger = screen.getByRole('button', { name: 'Ver detalhes' })
  trigger.focus()
  fireEvent.click(trigger)
  const modal = screen.getByRole('dialog', { name: 'Detalhes da gôndola B11' })
  expect(within(modal).getByText('Mercearia')).toBeTruthy()
  fireEvent.keyDown(modal, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
  fireEvent.click(screen.getByRole('link', { name: 'Ver central de reposição' }))
  expect(screen.getByRole('heading', { name: 'Central de reposição' })).toBeTruthy()
})

it('mostra carregamento e permite tentar novamente após uma falha', async () => {
  vi.mocked(getStoreMap).mockRejectedValueOnce(new Error('Unavailable demo source'))
  render(<MemoryRouter><StoreMap /></MemoryRouter>)
  expect(screen.getByText('Carregando mapa da loja…')).toBeTruthy()
  expect(await screen.findByRole('alert')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('region', { name: 'Visão da loja' })).toBeTruthy()
})
