// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as service from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../routes/ProtectedRoute'
import AuthProvider from './AuthProvider'
import type { SessionUser } from '../types/auth'

vi.mock('../services/authService', async (original) => ({
  ...await original<typeof service>(), getSession: vi.fn(), logout: vi.fn(), login: vi.fn(),
}))
const manager: SessionUser = { email: 'manager@example.test', roles: ['MANAGER'] }
const getSession = vi.mocked(service.getSession)

function Controls() {
  const { state, signOut, refreshSession } = useAuth()
  return <><span data-testid="state">{state.status}:{state.reason}</span>
    <button onClick={() => void signOut()}>Sair</button>
    <button onClick={() => void refreshSession()}>Verificar</button></>
}

function setup(strict = false) {
  const content = <MemoryRouter initialEntries={['/dashboard']}><AuthProvider>
    <Controls /><Routes><Route element={<ProtectedRoute />}><Route path="/dashboard" element={<h1>Conteúdo protegido</h1>} /></Route>
      <Route path="/login" element={<h1>Login</h1>} /></Routes>
  </AuthProvider></MemoryRouter>
  return render(strict ? <StrictMode>{content}</StrictMode> : content)
}

beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

it('aguarda a confirmação antes de mostrar conteúdo protegido', async () => {
  let resolve!: (user: SessionUser) => void
  getSession.mockReturnValue(new Promise((done) => { resolve = done }))
  setup()
  expect(screen.queryByText('Conteúdo protegido')).toBeNull()
  expect(screen.getByRole('status')).toBeTruthy()
  await act(async () => resolve(manager))
  expect(screen.getByText('Conteúdo protegido')).toBeTruthy()
})

it.each(['anonymous', 'forbidden'])('bloqueia sessão %s', async (kind) => {
  if (kind === 'anonymous') getSession.mockResolvedValue(null)
  else getSession.mockRejectedValue(new service.AccessDeniedError())
  setup()
  await screen.findByText('Login')
  expect(screen.queryByText('Conteúdo protegido')).toBeNull()
})

it('permite tentar novamente após erro de rede sem liberar conteúdo', async () => {
  getSession.mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValue(manager)
  setup()
  await screen.findByRole('alert')
  expect(screen.queryByText('Conteúdo protegido')).toBeNull()
  fireEvent.click(screen.getByText('Tentar novamente'))
  await screen.findByText('Conteúdo protegido')
})

it('detecta expiração ao voltar para a janela', async () => {
  getSession.mockResolvedValueOnce(manager).mockResolvedValue(null)
  setup()
  await screen.findByText('Conteúdo protegido')
  fireEvent.focus(window)
  await screen.findByText('Login')
  expect(screen.getByTestId('state').textContent).toBe('anonymous:expired')
})

it('ignora restauração antiga que termine depois do logout', async () => {
  let resolve!: (user: SessionUser) => void
  getSession.mockResolvedValueOnce(manager).mockReturnValueOnce(new Promise((done) => { resolve = done })).mockResolvedValue(null)
  vi.mocked(service.logout).mockResolvedValue()
  setup()
  await screen.findByText('Conteúdo protegido')
  fireEvent.click(screen.getByText('Verificar'))
  fireEvent.click(screen.getByText('Sair'))
  await screen.findByText('Login')
  await act(async () => resolve(manager))
  expect(screen.queryByText('Conteúdo protegido')).toBeNull()
  expect(screen.getByTestId('state').textContent).toBe('anonymous:signed-out')
})

it('falha de logout não simula saída e oferece nova verificação', async () => {
  getSession.mockResolvedValue(manager)
  vi.mocked(service.logout).mockRejectedValue(new Error('Falha ao sair'))
  setup()
  await screen.findByText('Conteúdo protegido')
  fireEvent.click(screen.getByText('Sair'))
  await screen.findByText('Falha ao sair')
  expect(screen.queryByText('Login')).toBeNull()
  expect(screen.queryByText('Conteúdo protegido')).toBeNull()
  fireEvent.click(screen.getByText('Tentar novamente'))
  await screen.findByText('Conteúdo protegido')
})

it('restaura no StrictMode sem aplicar resposta do efeito cancelado', async () => {
  getSession.mockImplementation((signal) => signal?.aborted ? Promise.reject(new Error('cancelado')) : Promise.resolve(manager))
  setup(true)
  await screen.findByText('Conteúdo protegido')
  await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('authenticated:'))
})
