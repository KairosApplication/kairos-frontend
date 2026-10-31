import { expect, test } from '@playwright/test'
import { mockSession } from './support'

test('reuses recent reads across pages and loads restocking options only when opening the form', async ({ page }) => {
  await mockSession(page)
  const counts = new Map<string, number>()
  page.on('request', request => {
    if (request.method() !== 'GET') return
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    counts.set(path, (counts.get(path) ?? 0) + 1)
  })
  const navigate = async (name: string) => page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name, exact: true }).click()
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Pulso da loja · hoje' })).toBeVisible()
  await navigate('Mapa da Loja')
  await expect(page.getByRole('button', { name: 'Ver detalhes', exact: true })).toBeVisible()
  await navigate('Insights')
  await expect(page.getByRole('progressbar', { name: 'Bebidas: 2 produtos' })).toBeVisible()
  await navigate('Central de Reposição')
  await expect(page.getByRole('region', { name: 'Registros', exact: true })).toBeVisible()
  expect(counts.get('/store-map')).toBe(1)
  expect(counts.get('/restockings/list')).toBe(1)
  expect(counts.get('/employees/list') ?? 0).toBe(0)
  expect(counts.get('/inventories/list') ?? 0).toBe(0)
  expect(counts.get('/restockings/options') ?? 0).toBe(0)
  await page.getByRole('button', { name: 'Criar reposição', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('combobox', { name: 'Depósito', exact: true })).toBeVisible()
  expect(counts.get('/restockings/options')).toBe(1)
  expect(counts.get('/employees/list') ?? 0).toBe(0)
  expect(counts.get('/inventories/list') ?? 0).toBe(0)
  await page.keyboard.press('Escape')
  await navigate('Funcionários')
  await expect(page.getByRole('heading', { name: 'João Silva', exact: true })).toBeVisible()
  expect(counts.get('/employees/list')).toBe(1)
})

test('shows catalog indicators while sharing a pending history request during navigation', async ({ page }) => {
  await mockSession(page)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  let reads = 0
  await page.route('**/api/v1/restockings/list', async route => { reads++; await gate; await route.fallback() })
  try {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Pulso da loja · hoje' })).toBeVisible()
    expect(reads).toBe(0)
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Insights', exact: true }).click()
    await expect(page.getByRole('progressbar', { name: 'Bebidas: 2 produtos' })).toBeVisible()
    await expect(page.getByText('Carregando indicadores de reposição…')).toBeVisible()
    expect(reads).toBe(1)
    release()
    await expect(page.getByText('Carregando indicadores de reposição…')).toHaveCount(0)
    expect(reads).toBe(1)
  } finally { release() }
})
