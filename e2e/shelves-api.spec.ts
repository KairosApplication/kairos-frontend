import { expect, test } from '@playwright/test'
import { mockSession, preferredTheme } from './support'

test('persists real-contract create, edit and delete across reloads, and selects the same ID on the map', async ({ page }) => {
  await mockSession(page)
  const writes: { method: string; body: unknown }[] = []
  page.on('request', request => {
    if (['POST', 'PATCH', 'DELETE'].includes(request.method()) && request.url().includes('/shelves/')) writes.push({ method: request.method(), body: request.postData() ? request.postDataJSON() : null })
  })
  await page.goto('/gondolas')
  await page.getByRole('button', { name: 'Nova gôndola', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Corredor' })).toBeFocused()
  await page.getByRole('combobox', { name: 'Corredor' }).selectOption('12')
  await page.getByRole('spinbutton', { name: 'Capacidade máxima' }).fill('80')
  await page.getByRole('button', { name: 'Criar gôndola', exact: true }).click()
  await expect(page.getByRole('rowheader', { name: '109', exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Próxima', exact: true }).click()
  await page.getByRole('button', { name: 'Editar gôndola 109', exact: true }).click()
  await page.getByRole('combobox', { name: 'Corredor' }).selectOption('21')
  await page.getByRole('spinbutton', { name: 'Capacidade máxima' }).fill('200')
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click()
  await page.getByRole('link', { name: 'Ver gôndola 109 no mapa' }).click()
  await expect(page.getByRole('region', { name: 'Gôndola 109', exact: true })).toContainText('Corredor 3')
  await expect(page.getByRole('region', { name: 'Gôndola 109', exact: true })).toContainText('Capacidade máxima: 200')
  await page.screenshot({ path: 'test-results/shelves-map-desktop.png', fullPage: true })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Gôndola 109 Sem produtos', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('link', { name: 'Gerenciar gôndolas', exact: true }).click()
  await page.getByRole('button', { name: 'Próxima', exact: true }).click()
  await page.getByRole('button', { name: 'Excluir gôndola 109', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Excluir gôndola', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Gôndolas cadastradas' })).toContainText('8')
  await page.reload()
  await expect(page.getByRole('region', { name: 'Gôndolas cadastradas' })).toContainText('8')
  expect(writes).toEqual([{ method: 'POST', body: { aisleId: 12, maximumCapacity: 80 } }, { method: 'PATCH', body: { aisleId: 21, maximumCapacity: 200 } }, { method: 'DELETE', body: null }])
})

test('keeps confirmed success after a failed read; retry never repeats POST', async ({ page }) => {
  await mockSession(page)
  await page.goto('/gondolas')
  await page.getByRole('button', { name: 'Nova gôndola', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'Capacidade máxima' }).fill('80')
  await page.route('**/api/v1/shelves/list', async route => {
    if (route.request().method() === 'OPTIONS') { await route.fallback(); return }
    await route.fulfill({ status: 503, headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4175', 'Access-Control-Allow-Credentials': 'true' }, json: {} })
  })
  let posts = 0
  page.on('request', r => { if (r.method() === 'POST' && r.url().endsWith('/shelves/registration')) posts++ })
  await page.getByRole('button', { name: 'Criar gôndola', exact: true }).click()
  await expect(page.getByText('Gôndola 109 criada com sucesso.')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar as gôndolas.')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.unroute('**/api/v1/shelves/list')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('region', { name: 'Gôndolas cadastradas' })).toContainText('9')
  expect(posts).toBe(1)
})

test('handles real IDs, missing URL IDs, horizontal keyboard scrolling and narrow layouts in both themes', async ({ page }) => {
  await mockSession(page)
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme)
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/mapa?gondola=A12')
    await expect(page.getByText('Gôndola solicitada não encontrada')).toBeVisible()
    const scroll = page.getByRole('region', { name: 'Corredores da loja — rolagem horizontal' })
    await scroll.focus()
    await expect(scroll).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await page.getByRole('button', { name: 'Gôndola 103 Sem produtos', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Gôndola 103', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/shelves-map-${theme}-320.png`, fullPage: true })
  }
})
