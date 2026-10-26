import { test, expect } from '@playwright/test'
import { mockSession } from './support'

test('login JWT HTTP 200 confirma acesso, preserva destino, recarrega e sai sem persistir bearer', async ({ page }) => {
  await mockSession(page, false)
  const authRequests: { path: string; method: string; authorization?: string }[] = []
  page.on('request', request => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/api/v1/auth/')) authRequests.push({ path, method: request.method(), authorization: request.headers().authorization })
  })
  await page.goto('/produtos')
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  await page.getByRole('textbox', { name: 'E-mail corporativo' }).fill('gerente.jwt@kairos.example')
  await page.getByLabel('Senha', { exact: true }).fill('dummy-browser-password')
  await page.getByRole('button', { name: 'Entrar no painel' }).click()
  await expect(page.getByRole('heading', { name: 'Produtos', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Produtos', exact: true })).toBeVisible()
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))
  expect(JSON.stringify(storage)).not.toMatch(/browser-test-access|dummy-browser-password|accessToken|refreshToken/)
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  expect(authRequests.filter(request => request.method === 'POST' && request.path.endsWith('/login'))).toHaveLength(1)
  expect(authRequests.some(request => request.authorization)).toBe(false)
  expect(authRequests.some(request => request.path.endsWith('/refresh'))).toBe(false)
})

test('401 definitivo bloqueia o painel sem entrar em ciclo de refresh', async ({ page }) => {
  await mockSession(page)
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
  let refreshCalls = 0
  page.on('request', request => { if (new URL(request.url()).pathname.endsWith('/auth/refresh')) refreshCalls += 1 })
  await page.route('**/api/v1/auth/me', route => route.fulfill({ status: 401, headers: {
    'Access-Control-Allow-Origin': 'http://127.0.0.1:4175', 'Access-Control-Allow-Credentials': 'true',
  } }))
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Produtos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Produtos', exact: true })).not.toBeVisible()
  expect(refreshCalls).toBe(0)
})
