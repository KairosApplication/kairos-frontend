export type SalesPoint = { date: string; label: string; value: number }
export type DashboardData = {
  date: string
  dateLabel: string
  updatedAt: string
  revenue: number
  salesCount: number
  averageTicket: number
  dailyGrowth: number
  weeklyGrowth: number
  stockouts: number
  shelvesNeedingAttention: number
  pendingAssignments: number
  sales: readonly SalesPoint[]
  restocking: readonly { key: 'pending' | 'active' | 'completed'; label: string; count: number }[]
}

// Presentation data from the supplied prototype, independent of API contracts.
export const dashboardDemo = {
  date: '2026-09-25',
  dateLabel: '25 SET',
  updatedAt: '25 set 2026, 14:32',
  revenue: 48760,
  salesCount: 428,
  averageTicket: 113.93,
  dailyGrowth: 9.7,
  weeklyGrowth: 8.7,
  stockouts: 8,
  shelvesNeedingAttention: 3,
  pendingAssignments: 4,
  sales: [
    { date: '2026-09-19', label: 'Sáb', value: 36000 },
    { date: '2026-09-20', label: 'Dom', value: 42000 },
    { date: '2026-09-21', label: 'Seg', value: 38000 },
    { date: '2026-09-22', label: 'Ter', value: 47000 },
    { date: '2026-09-23', label: 'Qua', value: 49000 },
    { date: '2026-09-24', label: 'Qui', value: 53000 },
    { date: '2026-09-25', label: 'Sex', value: 48760 },
  ],
  restocking: [
    { key: 'pending', label: 'Pendentes', count: 12 },
    { key: 'active', label: 'Em andamento', count: 8 },
    { key: 'completed', label: 'Concluídas', count: 36 },
  ],
} as const satisfies DashboardData

export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const wholeCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
