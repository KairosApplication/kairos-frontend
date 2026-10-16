import { expect, it } from 'vitest'
import { dashboardDemo } from './demo'
import { buildDashboardReport } from './report'

it('exporta CSV UTF-8 com origem demonstrativa, moeda decimal e os sete dias do gráfico', () => {
  const csv = buildDashboardReport(dashboardDemo)
  expect(csv.startsWith('\uFEFF')).toBe(true)
  expect(csv).toContain('"Seção";"Indicador";"Valor";"Referência"\r\n')
  expect(csv).toContain('"Dados demonstrativos";"2026-09-25"')
  expect(csv).toContain('"Receita do dia (BRL)";"48760,00"')
  expect(csv).toContain('"Ticket médio (BRL)";"113,93"')
  expect(csv.match(/"Histórico"/g)).toHaveLength(7)
  expect(csv).toContain('"Reposição";"Concluídas";"36"')
})

it('escapa aspas e preserva delimitadores de textos nas células', () => {
  const csv = buildDashboardReport({ ...dashboardDemo,
    restocking: [{ key: 'pending', label: 'Pendentes; "turno"', count: 3 }],
  })
  expect(csv).toContain('"Reposição";"Pendentes; ""turno""";"3"')
})
