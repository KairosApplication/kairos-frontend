import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'
test('employee registration, role edit and deletion use the available API contract', async ({ page }) => {
  const db = await mockSession(page)
  await page.goto('/funcionarios')
  await page.getByRole('button', { name: 'Novo funcionário', exact: true }).click()
  for (const [label, value] of [['Nome completo', 'Pessoa Teste'], ['E-mail', 'pessoa@kairos.example'], ['CPF', '52998224725'], ['Data de nascimento', '1990-01-01'], ['Senha inicial', 'senha-ficticia-teste']]) await page.getByLabel(label + ' *', { exact: true }).fill(value)
  await page.getByRole('button', { name: 'Salvar funcionário' }).click()
  await expect(page.getByRole('heading', { name: 'Pessoa Teste' })).toBeVisible()
  await page.getByRole('button', { name: 'Editar função de Pessoa Teste' }).click()
  await page.getByRole('dialog', { name: 'Editar função' }).getByRole('combobox', { name: 'Função', exact: true }).selectOption('CASHIER')
  await page.getByRole('button', { name: 'Salvar funcionário' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(db.employees.find(p => p.id === 4)?.position).toBe('CASHIER')
  await page.getByRole('button', { name: 'Excluir funcionário 4', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click()
  await expect(page.getByRole('heading', { name: 'Pessoa Teste' })).toHaveCount(0)
  expect(db.employees).toHaveLength(3)
})
test('@a11y employee errors preserve labels, focus and both themes', async ({ page }) => {
  await mockSession(page); await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme); await page.goto('/funcionarios')
    await page.getByRole('button', { name: 'Novo funcionário', exact: true }).click()
    await page.getByRole('button', { name: 'Salvar funcionário' }).click()
    await expect(page.getByRole('textbox', { name: 'Nome completo' })).toBeFocused()
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    await page.keyboard.press('Escape')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
