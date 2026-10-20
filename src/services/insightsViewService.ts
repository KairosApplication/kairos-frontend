import { insightsDemo } from '../mocks/insightsView'
import type { InsightsView } from '../types/insightsView'
export function getInsightsView(): Promise<InsightsView> { return Promise.resolve(structuredClone(insightsDemo)) }
export function downloadInsights(data: InsightsView): void {
  const rows = [['Análise demonstrativa', '19 a 25/09/2026'], ['Receita da semana', data.revenue.toFixed(2).replace('.', ',')], ['Crescimento percentual', String(data.growth).replace('.', ',')],
    ['Taxa de ruptura percentual', String(data.stockoutRate).replace('.', ',')], ['Tempo de reposição em minutos', String(data.restockingMinutes)], ['Reposições concluídas percentual', String(data.completionRate)],
    ['Categoria', 'Participação percentual', 'Produtos em ruptura'], ...data.categories.map((category) => [category.name, String(category.share), String(category.stockouts)])]
  const csv = '\uFEFF' + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = 'kairos-insights-demonstrativo-2026-09-25.csv'; document.body.append(link)
  try { link.click() } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
}
