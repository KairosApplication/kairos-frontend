// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import Profile from './index'
import { mockDialogs } from '../../test/dialog'
mockDialogs()
afterEach(cleanup)

it('salva apenas a prévia e preserva cargo e permissão', async () => {
  render(<Profile />)
  const input = await screen.findByRole('textbox', { name: 'Nome completo' })
  fireEvent.change(input, { target: { value: 'Ana de Teste' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(screen.getByRole('heading', { name: 'Ana de Teste' })).toBeTruthy()
  expect(screen.getByRole('status').textContent).toContain('Sua conta real não foi alterada')
  expect(screen.getByText('Administrador da unidade')).toBeTruthy()
})

it('trata a segurança como demonstração e restaura foco do modal de senha', async () => {
  render(<Profile />)
  const toggle = await screen.findByRole('switch', { name: 'Autenticação em duas etapas' })
  expect(toggle.getAttribute('aria-checked')).toBe('true')
  fireEvent.click(toggle)
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  expect(screen.getByRole('status').textContent).toContain('Nenhuma configuração real')
  const trigger = screen.getByRole('button', { name: 'Alterar senha' })
  trigger.focus(); fireEvent.click(trigger)
  expect(screen.getByText(/não recebe nem altera sua senha/)).toBeTruthy()
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(document.activeElement).toBe(trigger)
})

it('rejeita um arquivo que não é imagem sem produzir prévia', async () => {
  render(<Profile />)
  await screen.findByRole('textbox', { name: 'Nome completo' })
  const file = new File(['teste'], 'teste.txt', { type: 'text/plain' })
  fireEvent.change(screen.getByLabelText('Selecionar foto do perfil'), { target: { files: [file] } })
  expect(screen.getByRole('alert').textContent).toContain('PNG, JPEG ou WebP')
  expect(screen.queryByRole('img', { name: 'Prévia da foto de perfil' })).toBeNull()
})
