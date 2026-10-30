import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'
test('settings revalidates the account, persists the theme and signs out the current session', async ({ page }) => {
  await mockSession(page); await page.goto('/configuracoes')
  await page.getByRole('button', { name: 'Verificar sessão' }).click()
  await expect(page.getByText('Verificação da sessão concluída.')).toBeVisible()
  await page.getByRole('button', { name: 'Escuro', exact: true }).click()
  await page.goto('/perfil'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Atualizar identificação' }).click()
  await expect(page.getByRole('textbox', { name: 'E-mail corporativo' })).toHaveValue('gerente.acessibilidade@kairos.example')
  await page.goto('/configuracoes'); await page.getByRole('button', { name: 'Gerenciar acessos' }).click()
  await page.getByRole('button', { name: 'Encerrar sessão atual' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
test('@a11y settings account dialog supports both themes', async ({ page }) => {
  await mockSession(page); await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme); await page.goto('/configuracoes')
    await page.getByRole('button', { name: 'Gerenciar acessos' }).click()
    await expect(page.getByRole('dialog')).toContainText('gerente.acessibilidade@kairos.example')
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    await page.keyboard.press('Escape')
  }
})
