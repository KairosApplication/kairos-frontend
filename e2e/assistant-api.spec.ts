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
  const answer = page.getByRole('article').filter({ hasText: 'Resposta recebida do serviço de IA.' })
  await expect(answer.getByText('Banco de dados', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('navigation', { name: 'Conversas', exact: true }).getByRole('button', { name: /Conversa 000002/ }).click()
  await expect(page.getByRole('log').getByText('Banco de dados', { exact: true })).toBeVisible()
})

test('keeps history and draft visible after a server error without repeating the message', async ({ page }) => {
  await mockSession(page)
  let posts = 0
  await page.route('**/api/v1/me/chat/messages', async route => {
    if (route.request().method() !== 'POST') { await route.fallback(); return }
    posts++
    await route.fulfill({ status: 503, headers: {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:4175',
      'Access-Control-Allow-Credentials': 'true',
    }, json: { detail: 'private.database; password=secret' } })
  })
  await page.goto('/kairos-ia')
  await expect(page.getByRole('log')).toContainText('Como posso ajudar na operação?')
  await page.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }).fill('Qual é a prioridade de reposição?')
  await page.getByRole('button', { name: 'Enviar mensagem' }).click()
  await expect(page.getByRole('alert')).toContainText('temporariamente indisponível')
  await expect(page.getByRole('log')).toContainText('Como posso ajudar na operação?')
  await expect(page.getByRole('textbox', { name: 'Mensagem para KAIROS IA' })).toHaveValue('Qual é a prioridade de reposição?')
  await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Atualizar histórico' })).toBeEnabled()
  await expect(page.getByText(/private.database|password=secret/)).toHaveCount(0)
  expect(posts).toBe(1)
})
test('@a11y personal chat messages and controls work in both themes', async ({ page }) => {
  await mockSession(page); await page.setViewportSize({ width: 320, height: 844 })
  for (const theme of ['light', 'dark'] as const) {
    await preferredTheme(page, theme); await page.goto('/kairos-ia')
    await expect(page.getByRole('log')).toContainText('Como posso ajudar na operação?')
    await expect(page.getByText('Documento PDF', { exact: true })).toBeVisible()
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
