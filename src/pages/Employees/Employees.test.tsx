// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Employees from './index'
import TestSession from '../../test/TestSession'
import { mockDialogs } from '../../test/dialog'
import { handleEmployees, makeEmployees } from '../../test/employeesApiFixture'
mockDialogs()
let db: { employees: ReturnType<typeof makeEmployees> }
let fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>
beforeEach(() => {
  db = { employees: makeEmployees() }
  fetch = vi.fn<typeof globalThis.fetch>(async (input, options) => {
    const path = new URL(String(input)).pathname.replace('/api/v1', '')
    if (path === '/auth/login') return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'test-csrf' })
    const result = handleEmployees(db, options?.method ?? 'GET', path, options?.body ? JSON.parse(String(options.body)) : undefined)
    if (!result) return Response.json({}, { status: 404 })
    return result.status === 204 ? new Response(null, { status: 204 }) : Response.json(result.json, { status: result.status })
  })
  vi.stubGlobal('fetch', fetch)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
async function setup() { render(<TestSession><Employees /></TestSession>); await screen.findByRole('heading', { name: 'João Silva' }) }
it('filters actual names and positions without inventing activity or email', async () => {
  await setup()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'joao' } })
  expect(screen.getByRole('heading', { name: 'João Silva' })).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Carla Oliveira' })).toBeNull()
  expect(screen.queryByText('Em atividade')).toBeNull()
})
it('creates an account with the API payload, edits its position and deletes only after confirmation', async () => {
  await setup(); fireEvent.click(screen.getByRole('button', { name: 'Novo funcionário' }))
  for (const [label, value] of [['Nome completo *', 'Pessoa Teste'], ['E-mail *', 'pessoa@kairos.example'], ['CPF *', '52998224725'], ['Data de nascimento *', '1990-01-01'], ['Senha inicial *', 'ficticia-para-testes']]) fireEvent.change(screen.getByLabelText(label), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar funcionário' }))
  await screen.findByRole('heading', { name: 'Pessoa Teste' })
  const registration = fetch.mock.calls.find(([, options]) => options?.method === 'POST')
  expect(JSON.parse(String(registration?.[1]?.body))).toMatchObject({ position: 'STOCKER', user: { name: 'Pessoa', lastName: 'Teste', birthDate: '1990-01-01' } })
  fireEvent.click(screen.getByRole('button', { name: 'Editar função de Pessoa Teste' }))
  fireEvent.change(screen.getByLabelText('Função *'), { target: { value: 'CASHIER' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar funcionário' }))
  await waitFor(() => expect(db.employees.find(p => p.id === 4)?.position).toBe('cashier'))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Excluir funcionário 4' }))
  expect(db.employees).toHaveLength(4)
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))
  await waitFor(() => expect(db.employees).toHaveLength(3))
})
it('validates required fields and disables manager role editing', async () => {
  await setup()
  expect(screen.getByRole('button', { name: 'Editar função de Ana Gerente' }).hasAttribute('disabled')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Novo funcionário' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar funcionário' }))
  expect(screen.getByLabelText('Nome completo *').getAttribute('aria-invalid')).toBe('true')
  expect(fetch.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false)
})
it('does not fabricate staff when the API denies access', async () => {
  fetch.mockResolvedValue(Response.json({}, { status: 403 }))
  render(<TestSession><Employees /></TestSession>)
  await screen.findByRole('alert')
  expect(screen.queryByRole('heading', { name: 'João Silva' })).toBeNull()
})
