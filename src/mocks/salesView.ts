import type { SalesView } from '../types/salesView'
export const salesDemo: SalesView = {
  summary: { revenue: 48760, count: 428, identified: 186, average: 113.93 },
  customers: [
    { id: 'c1', name: 'Maria Souza', email: 'maria@kairos.example', purchases: 12, total: 1486.7, lastPurchase: '14:28', categories: ['Mercearia', 'Bebidas'] },
    { id: 'c2', name: 'Carlos Lima', email: 'carlos@kairos.example', purchases: 6, total: 874.5, lastPurchase: '14:22', categories: ['Mercearia', 'Limpeza'] },
    { id: 'c3', name: 'Fernanda Alves', email: 'fernanda@kairos.example', purchases: 9, total: 1124.8, lastPurchase: '14:15', categories: ['Higiene', 'Bebidas'] },
  ],
  sales: [
    { id: '#00428', time: '14:28', date: '2026-09-25', customerId: 'c1', payment: 'Pix', value: 126.4 },
    { id: '#00427', time: '14:25', date: '2026-09-25', customerId: null, payment: 'Crédito', value: 89.9 },
    { id: '#00426', time: '14:22', date: '2026-09-25', customerId: 'c2', payment: 'Débito', value: 214.75 },
    { id: '#00425', time: '14:18', date: '2026-09-25', customerId: null, payment: 'Pix', value: 42.3 },
    { id: '#00424', time: '14:15', date: '2026-09-25', customerId: 'c3', payment: 'Crédito', value: 168.2 },
    { id: '#00423', time: '14:11', date: '2026-09-25', customerId: 'c1', payment: 'Pix', value: 35.8 },
  ],
}
