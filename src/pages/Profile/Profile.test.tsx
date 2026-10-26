// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import Profile from './index'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext'
import { initialAuthState, type AuthState } from '../../contexts/authReducer'
import type { SessionUser } from '../../types/auth'
import { mockDialogs } from '../../test/dialog'
mockDialogs()
afterEach(cleanup)

const manager: SessionUser = { email: 'gerente.real@kairos.example', roles: ['MANAGER'] }
function view(user: SessionUser | null = manager, status: AuthState['status'] = 'authenticated') {
  const value: AuthContextValue = {
    state: { ...initialAuthState, status, user },
    signIn: vi.fn(), signOut: vi.fn(), refreshSession: vi.fn(),
  }
  return <MemoryRouter initialEntries={['/perfil']}><AuthContext.Provider value={value}><Header /><Sidebar /><Profile /></AuthContext.Provider></MemoryRouter>
}

it('mostra a mesma conta autenticada no perfil, Header e Sidebar sem identidade ou loja fictícia', () => {
  render(view())
  expect(screen.getByRole('heading', { name: manager.email })).toBeTruthy()
  expect(screen.getByRole('textbox', { name: 'E-mail corporativo' })).toHaveProperty('value', manager.email)
  expect(screen.getAllByText(manager.email)).toHaveLength(3)
  expect(screen.queryByText('Ana Costa')).toBeNull()
  expect(document.body.textContent).not.toContain('Mercado Aurora')
  expect(screen.getByText('Loja não informada')).toBeTruthy()
})

it('não apresenta campos ausentes ou segurança desconhecida como dados confirmados/editáveis', () => {
  render(view())
  const name = screen.getByRole('textbox', { name: 'Nome completo' })
  expect(name).toHaveProperty('value', '')
  expect(name).toHaveProperty('readOnly', true)
  expect(screen.getByRole('textbox', { name: 'E-mail corporativo' })).toHaveProperty('readOnly', true)
  expect(screen.getByRole('textbox', { name: 'Telefone' })).toHaveProperty('value', '')
  expect(screen.queryByRole('button', { name: 'Salvar alterações' })).toBeNull()
  expect(screen.queryByRole('switch', { name: 'Autenticação em duas etapas' })).toBeNull()
  expect(screen.getByText('Configuração não informada.')).toBeTruthy()
  expect(screen.queryByText('Administrador da unidade')).toBeNull()
})

it('troca a identificação quando outra conta assume a sessão, sem conservar o usuário anterior', () => {
  const page = render(view())
  const next: SessionUser = { email: 'outra.gerente@kairos.example', roles: ['MANAGER'] }
  page.rerender(view(next))
  expect(screen.getByRole('heading', { name: next.email })).toBeTruthy()
  expect(screen.queryByText(manager.email)).toBeNull()
  expect(screen.getByRole('textbox', { name: 'E-mail corporativo' })).toHaveProperty('value', next.email)
})

it.each([null, { email: 'pessoa@kairos.example', roles: ['EMPLOYEE'] } satisfies SessionUser])('não revela o perfil sem uma sessão de gerente: %j', user => {
  render(view(user, user ? 'authenticated' : 'anonymous'))
  expect(screen.getByRole('alert').textContent).toContain('Identificação indisponível')
  expect(screen.queryByRole('textbox', { name: 'E-mail corporativo' })).toBeNull()
})

it('orienta sobre senha sem coletar credenciais e devolve o foco ao fechar', () => {
  render(view())
  const trigger = screen.getByRole('button', { name: 'Alterar senha' })
  trigger.focus(); fireEvent.click(trigger)
  expect(screen.getByText(/Este painel não recebe nem altera sua senha/)).toBeTruthy()
  expect(screen.queryByLabelText('Nova senha')).toBeNull()
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(document.activeElement).toBe(trigger)
})
