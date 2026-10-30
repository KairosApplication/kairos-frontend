import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, preferredTheme } from './support'

test('shelf links persist through create, update and confirmed removal', async ({ page }) => {
  const db = await mockSession(page)
  let writes = 0
  await page.route('**/api/v1/product-shelves/**', async route => {
    const request = route.request()
    if (!['POST', 'PATCH', 'DELETE'].includes(request.method())) { await route.fallback(); return }
    writes++
    const id = Number(new URL(request.url()).pathname.split('/').at(-1))
    const headers = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4175', 'Access-Control-Allow-Credentials': 'true' }
    if (request.method() === 'DELETE') { db.links = db.links.filter(l => l.id !== id); await route.fulfill({ status: 204, headers }); return }
    const body = request.postDataJSON()
    if (request.method() === 'POST') db.links.push({ ...body, id: 9 })
    else db.links = db.links.map(l => l.id === id ? { ...body, id } : l)
    await route.fulfill({ status: request.method() === 'POST' ? 201 : 200, headers, json: { id: request.method() === 'POST' ? 9 : id } })
  })
  await page.goto('/gondolas')
  await page.getByRole('button', { name: 'Gerenciar produtos da gôndola 101', exact: true }).click()
  await page.getByRole('combobox', { name: 'Produto', exact: true }).selectOption('3')
  await page.getByRole('textbox', { name: 'Quantidade na gôndola' }).fill('12')
  await page.getByRole('button', { name: 'Salvar vínculo' }).click()
  await expect(page.getByText('12 unidades', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Editar quantidade de Arroz branco 5 kg' }).click()
  await page.getByRole('textbox', { name: 'Quantidade na gôndola' }).fill('15')
  await page.getByRole('button', { name: 'Salvar vínculo' }).click()
  await expect(page.getByText('15 unidades', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Remover vínculo 9' }).click()
  expect(writes).toBe(2)
  await page.getByRole('button', { name: 'Confirmar remoção' }).click()
  await expect(page.getByText('Vínculo removido.', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes).toBe(3)
})

test('@a11y shelf product dialog supports keyboard and both themes on a narrow screen', async ({ page }) => {
  await mockSession(page)
  await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme); await page.goto('/gondolas')
    const trigger = page.getByRole('button', { name: 'Gerenciar produtos da gôndola 101', exact: true })
    await trigger.focus(); await page.keyboard.press('Enter')
    await expect(page.getByRole('combobox', { name: 'Produto', exact: true })).toBeVisible()
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused()
  }
})
