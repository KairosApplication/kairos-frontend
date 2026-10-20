export type InsightsView = {
  revenue: number; growth: number; stockoutRate: number; restockingMinutes: number; completionRate: number
  categories: { name: string; share: number; stockouts: number }[]
}
