import { salesDemo } from '../mocks/salesView'
import type { SalesView } from '../types/salesView'
export function getSalesView(): Promise<SalesView> { return Promise.resolve(structuredClone(salesDemo)) }

export function downloadSalesCsv(rows: string[][]): void {
  const csv = '\uFEFF' + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'kairos-vendas-clientes-demonstrativo.csv'
  document.body.append(link)
  try { link.click() } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
}
