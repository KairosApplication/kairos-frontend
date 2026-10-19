// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Link, Route, Routes } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import ThemeProvider from './ThemeProvider'
import useTheme from '../hooks/useTheme'

function Controls() {
  const { theme, setTheme } = useTheme()
  return <><output aria-label="Tema atual">{theme}</output><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Alternar tema</button></>
}

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); localStorage.clear()
  delete document.documentElement.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.remove()
})

it('mantém a escolha na navegação e restaura após remontar a aplicação', () => {
  const meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.append(meta)
  const app = render(<ThemeProvider><MemoryRouter><Controls /><Routes>
    <Route path="/" element={<Link to="/dashboard">Dashboard</Link>} />
    <Route path="/dashboard" element={<h1>Dashboard</h1>} />
  </Routes></MemoryRouter></ThemeProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Alternar tema' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(meta.content).toBe('#102019')
  fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }))
  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
  expect(document.documentElement.dataset.theme).toBe('dark')
  app.unmount()
  // Simulate a fresh document while retaining browser storage.
  delete document.documentElement.dataset.theme
  render(<ThemeProvider><Controls /></ThemeProvider>)
  expect(screen.getByLabelText('Tema atual').textContent).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
  fireEvent.click(screen.getByRole('button', { name: 'Alternar tema' }))
  expect(localStorage.getItem('kairos.theme')).toBe('light')
  expect(meta.content).toBe('#1b4d3e')
})

it('sincroniza alterações de outra aba e ignora valores inválidos ou outras chaves', () => {
  localStorage.setItem('kairos.theme', 'invalid')
  render(<ThemeProvider><Controls /></ThemeProvider>)
  expect(document.documentElement.dataset.theme).toBe('light')
  fireEvent(window, new StorageEvent('storage', { key: 'kairos.theme', newValue: 'dark', storageArea: localStorage }))
  expect(screen.getByLabelText('Tema atual').textContent).toBe('dark')
  fireEvent(window, new StorageEvent('storage', { key: 'another.key', newValue: 'light' }))
  fireEvent(window, new StorageEvent('storage', { key: 'kairos.theme', newValue: 'light', storageArea: sessionStorage }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  fireEvent(window, new StorageEvent('storage', { key: null, newValue: null, storageArea: localStorage }))
  expect(document.documentElement.dataset.theme).toBe('light')
})

it('permite alternar sem quebrar a aplicação quando o armazenamento está bloqueado', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
  render(<ThemeProvider><Controls /></ThemeProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Alternar tema' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(screen.getByLabelText('Tema atual').textContent).toBe('dark')
})
