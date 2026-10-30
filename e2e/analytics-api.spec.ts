import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'
test('Dashboard and Insights share actual operational totals and export a report', async ({ page }) => {
  await mockSession(page); await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: '3 produtos' })).toBeVisible()
  await expect(page.getByText('34 unidades registradas nas gôndolas')).toBeVisible()
  await page.getByRole('button', { name: 'Ver valores por dia' }).click()
  await expect(page.getByRole('table', { name: 'Unidades registradas sem avarias' })).toBeVisible()
  await page.keyboard.press('Escape')
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Exportar relatório' }).click()
  expect((await download).suggestedFilename()).toBe('kairos-operacao.csv')
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
