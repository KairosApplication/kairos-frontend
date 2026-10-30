import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'
test('personal chat creates a conversation and loads the persisted response', async ({ page }) => {
  await mockSession(page); await page.goto('/kairos-ia')
  await page.getByRole('button', { name: 'Nova conversa', exact: true }).click()
  await expect(page.getByText('Como podemos cuidar da loja hoje?')).toBeVisible()
  await page.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }).fill('Como está a operação?')
  await page.getByRole('button', { name: 'Enviar mensagem' }).click()
  await expect(page.getByRole('log')).toContainText('Resposta recebida do serviço de IA.')
  await expect(page.getByRole('textbox', { name: 'Mensagem para KAIROS IA' })).toHaveValue('')
  await expect(page.getByRole('textbox', { name: 'Mensagem para KAIROS IA' })).toBeFocused()
})
test('@a11y personal chat messages and controls work in both themes', async ({ page }) => {
  await mockSession(page); await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme); await page.goto('/kairos-ia')
    await expect(page.getByRole('log')).toContainText('Como posso ajudar na operação?')
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
