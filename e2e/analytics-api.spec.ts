import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'
test('Dashboard preserves intended indicators and exports unavailable values explicitly', async ({ page }, testInfo) => {
  await mockSession(page); await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Pulso da loja · hoje' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ritmo das vendas' })).toBeVisible()
  await expect(page.getByText('Histórico de vendas indisponível.')).toBeVisible()
  await expect(page.locator('.dashboard__grid > section')).toHaveCount(6)
  await page.screenshot({ path: testInfo.outputPath('dashboard-reference.png'), fullPage: true })
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Exportar relatório' }).click()
  expect((await download).suggestedFilename()).toBe('kairos-dashboard.csv')
  await page.goto('/insights')
  await expect(page.getByRole('progressbar', { name: 'Bebidas: 2 produtos' })).toBeVisible()
})
test('@a11y operational charts and indicators support both themes', async ({ page }) => {
  await mockSession(page); await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) for (const path of ['/dashboard', '/insights']) {
    await preferredTheme(page, theme); await page.goto(path)
    await expect(page.getByRole('button', { name: path === '/dashboard' ? 'Exportar relatório' : 'Exportar análise' })).toBeEnabled()
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
