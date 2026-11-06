import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'
import { addProductCatalogCases } from '../src/test/shelvesApiFixture'

test('products use the company catalog, reload prices and open the chosen real shelf', async ({ page }) => {
  const db = await mockSession(page)
  addProductCatalogCases(db)
  const resourceRequests: string[] = []
  page.on('request', request => { if (request.url().includes('/api/v1/') && !request.url().includes('/auth/')) resourceRequests.push(`${request.method()} ${new URL(request.url()).pathname}`) })
  await page.goto('/produtos')
  await expect(page.getByRole('region', { name: 'Resumo do catálogo da empresa' })).toContainText('7')
  await page.getByRole('button', { name: 'Próxima', exact: true }).click()
  await expect(page.getByRole('rowheader', { name: 'Café tradicional 500 g' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Buscar nome, ID ou marca' }).fill(' FONTE CLARA ')
  await expect(page.getByRole('rowheader', { name: 'Água mineral 500 ml' })).toBeVisible()
  const row = page.getByRole('row', { name: /Água mineral 500 ml/ })
  await expect(row).toContainText('14 un.')
  db.products.find(p => p.id === 2)!.price = 3.49
  await page.reload()
  await page.getByRole('button', { name: 'Ver detalhes de Água mineral 500 ml', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Água mineral 500 ml' })
  await expect(dialog).toContainText('R$ 3,49')
  await expect(dialog.getByRole('link')).toHaveCount(2)
  await page.screenshot({ path: 'test-results/products-api-desktop.png', fullPage: true })
  await dialog.getByRole('link', { name: 'Ver gôndola 102 no mapa' }).click()
  await expect(page.getByRole('region', { name: 'Gôndola 102', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Gôndola 102 Com saldo' })).toHaveAttribute('aria-pressed', 'true')
  expect(resourceRequests.every(value => value === 'GET /api/v1/store-map')).toBe(true)
})

test('fills the catalog beside twenty categories and paginates every category without new API reads', async ({ page }) => {
  const db = await mockSession(page)
  db.categories = Array.from({ length: 20 }, (_, index) => ({ id: index + 1, category: `Categoria ${String(index + 1).padStart(2, '0')}` }))
  db.products = Array.from({ length: 800 }, (_, index) => ({ id: index + 1,
    name: `Produto de teste com nome longo ${String(index + 1).padStart(6, '0')}`, brand: 'Marca de teste',
    price: 10, category: db.categories[index % 20] }))
  db.links = []
  let catalogReads = 0
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/v1/store-map') catalogReads++ })
  await page.goto('/produtos')
  const rows = page.locator('.products__catalog tbody tr')
  const pagination = page.getByRole('navigation', { name: 'Paginação dos produtos' })
  async function expectFilled() {
    await expect.poll(async () => page.locator('.products__layout').evaluate(layout => {
      const sidebar = layout.querySelector('.products__categories')!.getBoundingClientRect()
      const catalog = layout.querySelector('.products__catalog')!.getBoundingClientRect()
      return catalog.bottom - sidebar.bottom
    })).toBeGreaterThanOrEqual(-1)
    expect(await rows.count()).toBeGreaterThan(5)
    expect(await rows.count()).toBeLessThan(40)
  }
  await expectFilled()
  await page.screenshot({ path: 'test-results/products-filled-desktop.png', fullPage: true })
  for (const category of db.categories) {
    await page.getByRole('button', { name: `${category.category} 40 produtos`, exact: true }).click()
    await expectFilled()
    const count = await rows.count()
    const firstName = await rows.first().innerText()
    await expect(page.getByRole('status')).toHaveText(`Exibindo 1–${count} de 40 produtos`)
    await pagination.getByRole('button', { name: 'Próxima' }).click()
    await expect(page.getByRole('status')).toHaveText(`Exibindo ${count + 1}–40 de 40 produtos`)
    await expect(pagination.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    expect(await rows.first().innerText()).not.toBe(firstName)
    await pagination.getByRole('button', { name: 'Anterior' }).click()
    await expect(page.getByRole('status')).toHaveText(`Exibindo 1–${count} de 40 produtos`)
  }
  await page.getByRole('searchbox', { name: 'Buscar nome, ID ou marca' }).fill('000800')
  await expect(rows).toHaveCount(1)
  await expect(page.getByRole('status')).toHaveText('Exibindo 1–1 de 1 produto')
  const gap = await page.locator('.products__catalog').evaluate(catalog => {
    const table = catalog.querySelector('.ui-table-scroll')!.getBoundingClientRect()
    const footer = catalog.querySelector('.products__table-footer')!.getBoundingClientRect()
    return footer.top - table.bottom
  })
  expect(gap).toBeLessThan(2)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('searchbox', { name: 'Buscar nome, ID ou marca' }).fill('')
  await expect(rows).toHaveCount(25)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(catalogReads).toBe(1)
})

test('company permission and server errors offer read retry without a global fallback', async ({ page }) => {
  await mockSession(page)
  let status = 403
  await page.route('**/api/v1/store-map', async route => {
    if (status === 200) { await route.fallback(); return }
    await route.fulfill({ status, headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4175', 'Access-Control-Allow-Credentials': 'true' }, json: {} })
  })
  await page.goto('/produtos')
  await expect(page.getByRole('alert')).toContainText('Você não tem permissão')
  await expect(page).toHaveURL(/\/produtos$/)
  await expect(page.getByRole('table')).toHaveCount(0)
  status = 503
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os produtos.')
  status = 200
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('table')).toBeVisible()
})

test('@a11y mixed and unknown balances preserve keyboard access and narrow layouts in both themes', async ({ page }) => {
  const db = await mockSession(page)
  addProductCatalogCases(db)
  await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme)
    await page.goto('/produtos')
    await page.getByRole('button', { name: 'Ver pendências' }).click()
    await expect(page.getByRole('row', { name: /Sabonete 90 g/ })).toContainText('Saldo parcial')
    await page.getByRole('searchbox', { name: 'Buscar nome, ID ou marca' }).fill('sem resultado')
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    const trigger = page.getByRole('button', { name: 'Ver detalhes de Escova dental', exact: true })
    await trigger.focus(); await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Escova dental' })
    await expect(dialog).toContainText('Não informado')
    await expect(dialog.getByRole('link')).toHaveCount(0)
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(audit.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/products-api-${theme}-320.png`, fullPage: true })
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  }
})
