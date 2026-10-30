import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'
test('header loads alerts only on opening and navigates to the actual shelf', async ({ page }) => {
  await mockSession(page); let requests = 0
  page.on('request', r => { if (r.url().endsWith('/alerts/list')) requests++ })
  await page.goto('/dashboard'); expect(requests).toBe(0)
  await page.getByRole('button', { name: 'Notificações', exact: true }).click()
  await page.getByRole('link', { name: /Produto sem saldo na gôndola 101/ }).click()
  await expect(page).toHaveURL(/\/mapa\?gondola=101$/)
  await expect(page.getByRole('region', { name: 'Gôndola 101', exact: true })).toBeVisible()
  expect(requests).toBe(1)
})
test('@a11y header alerts support both themes and Escape focus', async ({ page }) => {
  await mockSession(page)
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme); await page.goto('/dashboard')
    const trigger = page.getByRole('button', { name: 'Notificações', exact: true })
    await trigger.focus(); await page.keyboard.press('Space')
    await expect(page.getByRole('link', { name: /Produto sem saldo na gôndola 101/ })).toBeVisible()
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused()
  }
})
