import type { RestockingRecord } from '../services/restockingApiService'
export function makeRestockingFixture() { return {
  people: [{ id: 1, userName: 'João Silva', position: 'stocker' }, { id: 2, userName: 'Ana Gerente', position: 'manager' }],
  inventories: [{ id: 1, sectorId: 1, sectorName: 'Bebidas' }],
  records: [{ id: 1, inventoryId: 1, employeeId: 1, shelfId: 101, productId: 1, restockingDate: '2026-10-27T10:00:00', restockedQuantity: 12, damagedQuantity: 0 }, { id: 2, inventoryId: 1, employeeId: 2, shelfId: 102, productId: 2, restockingDate: '2026-10-26T11:00:00', restockedQuantity: 20, damagedQuantity: 2 }] as RestockingRecord[],
} }
export function handleRestocking(db: ReturnType<typeof makeRestockingFixture>, method: string, path: string, body?: unknown): { status: number; json?: unknown } | null {
  const lists: Record<string, unknown> = { '/employees/list': db.people, '/inventories/list': db.inventories, '/restockings/list': db.records }
  if (method === 'GET' && path in lists) return { status: 200, json: lists[path] }
  if (!path.startsWith('/restockings/') || !['POST', 'PATCH', 'DELETE'].includes(method)) return null
  const id = Number(path.split('/').at(-1))
  if (method === 'DELETE') { db.records = db.records.filter(r => r.id !== id); return { status: 204 } }
  if (method === 'POST') { const r = { ...body as RestockingRecord, id: Math.max(0, ...db.records.map(r => r.id)) + 1, restockingDate: '2026-10-27T15:00:00' }; db.records.push(r); return { status: 201, json: r } }
  db.records = db.records.map(r => r.id === id ? { ...r, ...body as RestockingRecord } : r)
  return { status: 200, json: db.records.find(r => r.id === id) }
}
