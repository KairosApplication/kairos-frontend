import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'
test('customers, recommendations, purchase totals and filtered CSV use real-shaped responses', async ({ page }) => {
  await mockSession(page); await page.goto('/vendas-clientes')
  await page.getByRole('searchbox', { name: 'Buscar cliente ou ID' }).fill('maria')
  await page.getByRole('button', { name: 'Maria Souza', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar dados' }).click()
  expect((await download).suggestedFilename()).toBe('kairos-clientes.csv')
  await page.getByRole('button', { name: 'Ver recomendações' }).click()
  await expect(page.getByRole('dialog')).toContainText('Coca-Cola 2 L')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Vendas', exact: true }).click()
  await page.getByRole('textbox', { name: 'ID da compra' }).fill('428')
  await page.getByRole('button', { name: 'Consultar compra' }).click()
  await expect(page.getByText('Total: R$ 126,40')).toBeVisible()
})
test('@a11y customer recommendations and purchase errors support both themes', async ({ page }) => {
  await mockSession(page); await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme); await page.goto('/vendas-clientes')
    await page.getByRole('button', { name: 'Ver recomendações' }).click()
    await expect(page.getByRole('dialog')).toContainText('Coca-Cola 2 L')
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Vendas', exact: true }).click()
    await page.getByRole('textbox', { name: 'ID da compra' }).fill('999')
    await page.getByRole('button', { name: 'Consultar compra' }).click()
    await expect(page.getByRole('alert')).toContainText('Não foi possível consultar a compra.')
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
  }
})
