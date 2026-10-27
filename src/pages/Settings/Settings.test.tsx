// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import Settings from './index'
import ThemeProvider from '../../contexts/ThemeProvider'
import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext'
import { mockDialogs } from '../../test/dialog'
mockDialogs()
afterEach(() => { cleanup(); localStorage.clear(); delete document.documentElement.dataset.theme })
function setup() {
  const context: AuthContextValue = { state: { status: 'authenticated', user: { email: 'real@kairos.example', roles: ['MANAGER'] }, reason: null, error: null, signingOut: false }, signIn: vi.fn(), signOut: vi.fn(async () => {}), refreshSession: vi.fn(async () => {}) }
  render(<AuthContext.Provider value={context}><ThemeProvider><Settings /></ThemeProvider></AuthContext.Provider>); return context
}
it('shows the authenticated identity and keeps unknown store fields read-only', () => {
  setup()
  expect((screen.getByLabelText('E-mail da conta') as HTMLInputElement).value).toBe('real@kairos.example')
  expect(screen.getByLabelText('Nome da loja').hasAttribute('readonly')).toBe(true)
  expect(screen.queryByRole('button', { name: 'Salvar alterações' })).toBeNull()
  expect(screen.queryByText('Mercado Aurora')).toBeNull()
})
it('applies the persistent theme and moves focus to the chosen section', () => {
  setup(); fireEvent.click(screen.getByRole('button', { name: 'Escuro' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('kairos.theme')).toBe('dark')
  fireEvent.click(screen.getByRole('button', { name: 'Preferências' }))
  expect(document.activeElement?.id).toBe('settings-preferences')
})
it('revalidates the session and signs out only when explicitly requested', async () => {
  const context = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Verificar sessão' }))
  await screen.findByText('Verificação da sessão concluída.')
  expect(context.refreshSession).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Gerenciar acessos' }))
  expect(context.signOut).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Encerrar sessão atual' }))
  expect(context.signOut).toHaveBeenCalledTimes(1)
})
