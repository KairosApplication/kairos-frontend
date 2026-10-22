import { test, expect } from '@playwright/test'
import { mockSession, panelPages, preferredTheme } from './support'

function luminance(rgb: string) {
  const channels = rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}
function ratio(a: string, b: string) { const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y); return (high + 0.05) / (low + 0.05) }

for (const theme of ['light', 'dark'] as const) {
  test(`@a11y campos e seleção de tema têm contraste suficiente: ${theme}`, async ({ page }) => {
    await mockSession(page); await preferredTheme(page, theme); await page.goto('/configuracoes')
    const field = page.getByRole('textbox', { name: 'Nome da loja' })
    await expect(field).toBeVisible()
    const colors = await field.evaluate(element => { const input = getComputedStyle(element); const box = getComputedStyle(element.parentElement!); return { text: input.color, background: box.backgroundColor, border: box.borderColor } })
    expect(ratio(colors.border, colors.background)).toBeGreaterThanOrEqual(3)
    expect(ratio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5)
    const selected = page.getByRole('button', { name: theme === 'dark' ? 'Escuro' : 'Claro', exact: true })
    const selection = await selected.evaluate(element => { const css = getComputedStyle(element); return { border: css.borderColor, background: css.backgroundColor } })
    expect(ratio(selection.border, selection.background)).toBeGreaterThanOrEqual(3)
    await page.getByRole('switch', { name: 'Alertas de ruptura' }).click()
    const off = await page.locator('.demo-toggle[aria-checked="false"] .demo-toggle__track').evaluate(element => ({ track: getComputedStyle(element).backgroundColor, thumb: getComputedStyle(element.firstElementChild!).backgroundColor }))
    expect(ratio(off.track, off.thumb)).toBeGreaterThanOrEqual(3)
  })

  test(`@a11y todas as páginas preservam o conteúdo com reflow e espaçamento: ${theme}`, async ({ page }) => {
    test.setTimeout(120000)
    await mockSession(page); await preferredTheme(page, theme)
    await page.setViewportSize({ width: 320, height: 844 })
    for (const item of [...panelPages, { path: '/login', title: 'Bem-vindo de volta' }, { path: '/rota-invalida', title: 'Página não encontrada' }]) {
      if (item.path === '/login') await mockSession(page, false)
      await page.goto(item.path)
      await page.getByRole('heading', { level: 1, name: item.title, exact: true }).waitFor()
      await expect(page.locator('.ui-feedback--loading')).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important } p { margin-bottom: 2em !important }' })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: item.path }).toBe(true)
      if (item.path === '/mapa') {
        const shelves = page.locator('.store-map__shelf')
        await expect(shelves.first()).toBeVisible()
        expect(await shelves.evaluateAll(elements => elements.every(e => e.scrollHeight <= e.clientHeight + 1))).toBe(true)
      }
    }
  })
}
