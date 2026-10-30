import { expect, test } from '@playwright/test'
import { mockSession, preferredTheme } from './support'

for (const theme of ['light', 'dark'] as const) {
  test(`Insights keeps twenty categories readable and bounded in ${theme} mode`, async ({ page }, testInfo) => {
    const db = await mockSession(page)
    await preferredTheme(page, theme)
    db.products = Array.from({ length: 800 }, (_, index) => ({
      id: index + 1, name: `Produto ${index + 1}`, brand: 'Teste', price: 1,
      category: { id: index % 20 + 1, category: `Categoria de produtos ${String(index % 20 + 1).padStart(2, '0')}` },
    }))
    await page.goto('/insights')
    const region = page.getByRole('region', { name: 'Produtos por categoria', exact: true })
    await expect(region.getByRole('progressbar')).toHaveCount(20)
    await expect(region).toBeVisible()
    expect(await region.evaluate(element => ({ height: element.clientHeight, scroll: element.scrollHeight })))
      .toMatchObject({ height: 280 })
    expect(await region.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
    await region.focus()
    await page.keyboard.press('End')
    await expect.poll(() => region.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
    await page.screenshot({ path: testInfo.outputPath(`insights-${theme}.png`), fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
