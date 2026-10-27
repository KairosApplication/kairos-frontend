import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'

async function fill(page: Page, name = 'Produto de teste') {
  await page.getByRole('textbox', { name: 'Nome do produto' }).fill(name)
  await page.getByRole('textbox', { name: 'Marca', exact: true }).fill('Marca de teste')
  await page.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('4')
  await page.getByRole('textbox', { name: 'Preço (R$)' }).fill('12,34')
}

test('creates the first company product, edits its numeric price and confirms deletion', async ({ page }) => {
  const db = await mockSession(page)
  db.products = []; db.links = []
  const mutations: { path: string; body: unknown }[] = []
  page.on('request', request => { if (['POST', 'PATCH', 'DELETE'].includes(request.method()) && request.url().includes('/products/')) mutations.push({ path: new URL(request.url()).pathname, body: request.postData() ? request.postDataJSON() : null }) })
  await page.goto('/produtos')
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click()
  await fill(page)
  await page.getByRole('button', { name: 'Criar produto', exact: true }).click()
  await expect(page.getByRole('rowheader', { name: 'Produto de teste' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Novo produto', exact: true })).toBeFocused()
  expect(mutations[0]).toEqual({ path: '/api/v1/products/company/registration', body: { name: 'Produto de teste', brand: 'Marca de teste', categoryId: 4, price: 12.34 } })
  await page.reload()
  await page.getByRole('button', { name: 'Editar produto 1', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Preço (R$)' })).toHaveValue('12,34')
  await page.getByRole('textbox', { name: 'Preço (R$)' }).fill('0')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('row', { name: /Produto de teste/ })).toContainText('R$ 0,00')
  await page.getByRole('button', { name: 'Excluir produto 1', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Excluir produto 1', exact: true })).toBeFocused()
  expect(mutations).toHaveLength(2)
  await page.getByRole('button', { name: 'Excluir produto 1', exact: true }).click()
  await page.getByRole('button', { name: 'Excluir produto', exact: true }).click()
  await expect(page.getByText('Nenhum produto encontrado')).toBeVisible()
  expect(mutations).toHaveLength(3)
  expect(db.products).toHaveLength(0)
})

test('pending submission blocks double save and closing until the server acknowledges it', async ({ page }) => {
  await mockSession(page)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  let posts = 0
  await page.route('**/api/v1/products/company/registration', async route => {
    if (route.request().method() !== 'POST') { await route.fallback(); return }
    posts++; await gate; await route.fallback()
  })
  await page.goto('/produtos')
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click()
  await fill(page)
  await page.getByRole('button', { name: 'Criar produto', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Fechar janela' }).click()
  await expect(page.getByRole('dialog', { name: 'Novo produto' })).toBeVisible()
  expect(posts).toBe(1)
  release()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('rowheader', { name: 'Produto de teste' })).toBeVisible()
  expect(posts).toBe(1)
})

test('@a11y product form errors and deletion remain accessible in both themes at 320px', async ({ page }) => {
  const db = await mockSession(page)
  db.products.push({ id: 4, name: 'Produto livre', brand: 'Teste', price: 0, category: db.categories[0] })
  await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme); await page.goto('/produtos')
    const trigger = page.getByRole('button', { name: 'Novo produto', exact: true })
    await trigger.focus(); await page.keyboard.press('Enter')
    await fill(page)
    await page.getByRole('textbox', { name: 'Preço (R$)' }).fill('1,234')
    await page.getByRole('button', { name: 'Criar produto', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Preço (R$)' })).toBeFocused()
    await expect(page.getByRole('textbox', { name: 'Preço (R$)' })).toHaveAttribute('aria-invalid', 'true')
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/product-form-${theme}-320.png`, fullPage: true })
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused()
    await page.getByRole('button', { name: 'Excluir produto 4', exact: true }).click()
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    await page.keyboard.press('Escape')
  }
})
