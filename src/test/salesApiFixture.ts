export function handleSales(method: string, path: string): { status: number; json: unknown } | null {
  if (method !== 'GET') return null
  if (path === '/customers/list') return { status: 200, json: [{ id: 1, userId: 11, userName: 'Maria Souza' }, { id: 2, userId: 12, userName: 'Carlos Lima' }] }
  if (/^\/customers\/\d+\/recommendations$/.test(path)) return { status: 200, json: [{ productId: 1, productName: 'Coca-Cola 2 L', categoryId: 1, categoryName: 'Bebidas' }] }
  if (path === '/purchases/428/total') return { status: 200, json: { purchaseId: 428, total: 126.4 } }
  if (path.startsWith('/purchases/')) return { status: 404, json: {} }
  return null
}
