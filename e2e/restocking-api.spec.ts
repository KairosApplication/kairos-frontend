import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'
test('restocking records persist quantities and can be edited and deleted', async ({ page }) => {
  await mockSession(page); await page.goto('/reposicoes')
  await page.getByRole('button', { name: 'Criar reposição', exact: true }).click()
  const form = page.getByRole('dialog', { name: 'Criar reposição', exact: true })
  for (const [label, value] of [['Produto', '1'], ['Gôndola', '101'], ['Responsável', '1'], ['Depósito', '1']]) await form.getByRole('combobox', { name: label, exact: true }).selectOption(value)
  await form.getByRole('spinbutton', { name: 'Quantidade', exact: true }).fill('12')
  await form.getByRole('spinbutton', { name: 'Avarias', exact: true }).fill('2')
  await form.getByRole('button', { name: 'Salvar reposição' }).click()
  const record = page.getByRole('region', { name: 'Registros', exact: true }).getByRole('button', { name: /REP-3/ })
  await expect(record).toContainText('12 unidades')
  await record.click(); await page.getByRole('button', { name: 'Editar registro', exact: true }).click()
  await page.getByRole('dialog', { name: 'Editar reposição' }).getByRole('spinbutton', { name: 'Quantidade', exact: true }).fill('14')
  await page.getByRole('button', { name: 'Salvar reposição' }).click()
  await expect(record).toContainText('14 unidades')
  await record.click(); await page.getByRole('button', { name: 'Excluir registro' }).click()
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click()
  await expect(record).toHaveCount(0)
})
test('@a11y restocking form and records remain accessible in both themes', async ({ page }) => {
  await mockSession(page); await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme); await page.goto('/reposicoes')
    await page.getByRole('button', { name: 'Criar reposição', exact: true }).click()
    await page.getByRole('button', { name: 'Salvar reposição' }).click()
    await expect(page.getByRole('dialog').getByRole('combobox', { name: 'Produto', exact: true })).toBeFocused()
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    await page.keyboard.press('Escape')
  }
})
