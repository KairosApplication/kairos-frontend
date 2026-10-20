export type SaleView = { id: string; time: string; date: string; customerId: string | null; payment: 'Pix' | 'Crédito' | 'Débito'; value: number }
export type CustomerView = { id: string; name: string; email: string; purchases: number; total: number; lastPurchase: string; categories: string[] }
export type SalesView = { sales: SaleView[]; customers: CustomerView[]; summary: { revenue: number; count: number; identified: number; average: number } }
