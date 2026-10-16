import type { DashboardData } from './demo'

export function buildDashboardReport(data: DashboardData): string {
  const amount = (value: number) => value.toFixed(2).replace('.', ',')
  const rows: (string | number)[][] = [
    ['Seção', 'Indicador', 'Valor', 'Referência'],
    ['Identificação', 'Origem', 'Dados demonstrativos', data.date],
    ['Vendas', 'Receita do dia (BRL)', amount(data.revenue), data.date],
    ['Vendas', 'Vendas realizadas', data.salesCount, data.date],
    ['Vendas', 'Ticket médio (BRL)', amount(data.averageTicket), data.date],
    ['Estoque', 'Produtos em ruptura', data.stockouts, data.date],
    ...data.restocking.map((item) => ['Reposição', item.label, item.count, data.date]),
    ...data.sales.map((point) => ['Histórico', 'Receita (BRL)', amount(point.value), point.date]),
  ]
  return '\uFEFF' + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\r\n') + '\r\n'
}

export function downloadDashboardReport(data: DashboardData): void {
  const blob = new Blob([buildDashboardReport(data)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = url
    link.download = `kairos-dashboard-demonstrativo-${data.date}.csv`
    document.body.append(link)
    link.click()
  } finally {
    link.remove()
    // Keep the URL alive long enough for the browser to start the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
