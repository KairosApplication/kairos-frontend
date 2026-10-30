import { test, expect, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockSession, panelPages, preferredTheme } from './support'

async function audit(page: Page, info: TestInfo, state: string) {
  await page.evaluate(() => document.fonts.ready)
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  await info.attach(`${state}.json`, { body: JSON.stringify({ url: result.url, violations: result.violations, incomplete: result.incomplete, passes: result.passes.map(rule => rule.id) }, null, 2), contentType: 'application/json' })
  expect(result.violations, `WCAG A/AA: ${state}`).toEqual([])
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of [...panelPages, { path: '/login', title: 'Bem-vindo de volta' }, { path: '/rota-invalida', title: 'Página não encontrada' }]) {
    test(`@a11y auditoria ${theme}: ${item.path}`, async ({ page }, info) => {
      await mockSession(page, item.path !== '/login'); await preferredTheme(page, theme)
      await page.goto(item.path)
      await page.getByRole('heading', { level: 1, name: item.title, exact: true }).waitFor()
      await expect(page.locator('.ui-feedback--loading')).toHaveCount(0)
      await audit(page, info, `${theme}-${item.path.replaceAll('/', '') || 'home'}`)
    })
  }

  test(`@a11y auditoria ${theme}: diálogos abertos`, async ({ page }, info) => {
    test.setTimeout(180000)
    await mockSession(page); await preferredTheme(page, theme)
    const cases = [
      ['/dashboard', 'Ver valores por dia'], ['/mapa', 'Ver detalhes'], ['/gondolas', 'Nova gôndola'],
      ['/produtos', 'Ver detalhes de Coca-Cola 2 L'], ['/reposicoes', 'Criar reposição'],
      ['/funcionarios', 'Novo funcionário'], ['/vendas-clientes', 'Ver recomendações'],
      ['/perfil', 'Alterar senha'], ['/configuracoes', 'Gerenciar acessos'],
    ]
    for (const [path, trigger] of cases) {
      await page.goto(path)
      await page.getByRole('button', { name: trigger, exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await audit(page, info, `${theme}-${path.slice(1)}-dialog`)
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
    }
  })

  test(`@a11y auditoria ${theme}: vazio, erros e mensagens`, async ({ page }, info) => {
    test.setTimeout(90000)
    await mockSession(page); await preferredTheme(page, theme)
    await page.goto('/produtos')
    await page.getByRole('searchbox', { name: /Buscar nome/ }).fill('produto-inexistente-xyz')
    await expect(page.getByText('Nenhum produto encontrado')).toBeVisible()
    await audit(page, info, `${theme}-empty`)
    await page.goto('/kairos-ia')
    await page.getByRole('textbox', { name: 'Mensagem para KAIROS IA' }).fill('Como estão as vendas?')
    await page.getByRole('button', { name: 'Enviar mensagem' }).click()
    await expect(page.getByRole('log')).toContainText('Como estão as vendas?')
    await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled()
    await audit(page, info, `${theme}-conversation`)
    await mockSession(page, false)
    await page.goto('/login')
    await page.getByRole('button', { name: 'Entrar no painel' }).click()
    await expect(page.getByRole('textbox', { name: 'E-mail corporativo' })).toHaveAttribute('aria-invalid', 'true')
    await audit(page, info, `${theme}-login-errors`)
    await page.route('**/api/v1/auth/me', async route => route.fulfill({ status: 503, headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4175', 'Access-Control-Allow-Credentials': 'true' }, json: {} }))
    await page.goto('/dashboard')
    await page.getByRole('heading', { name: 'Não foi possível verificar seu acesso' }).waitFor()
    await audit(page, info, `${theme}-session-error`)
  })
}
