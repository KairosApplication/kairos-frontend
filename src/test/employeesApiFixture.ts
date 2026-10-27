type EmployeeDto = { id: number; userId: number; userName: string; position: string }
export const makeEmployees = (): EmployeeDto[] => [{ id: 1, userId: 11, userName: 'João Silva', position: 'stocker' }, { id: 2, userId: 12, userName: 'Ana Gerente', position: 'manager' }, { id: 3, userId: 13, userName: 'Carla Oliveira', position: 'cashier' }]
export function handleEmployees(db: { employees: EmployeeDto[] }, method: string, path: string, body?: unknown): { status: number; json?: unknown } | null {
  if (method === 'GET' && path === '/employees/list') return { status: 200, json: db.employees }
  if (!['POST', 'PATCH', 'DELETE'].includes(method) || !path.startsWith('/employees/')) return null
  const id = Number(path.split('/').at(-1))
  const data = body as { position: string; user?: { name: string; lastName: string } }
  if (method === 'DELETE') { db.employees = db.employees.filter(p => p.id !== id); return { status: 204 } }
  if (method === 'PATCH') { db.employees = db.employees.map(p => p.id === id ? { ...p, position: data.position.toLowerCase() } : p); return { status: 200, json: db.employees.find(p => p.id === id) } }
  if (!data.user) return { status: 400, json: {} }
  const item = { id: Math.max(0, ...db.employees.map(p => p.id)) + 1, userId: 20, userName: `${data.user.name} ${data.user.lastName}`, position: data.position.toLowerCase() }
  db.employees.push(item)
  return { status: 201, json: item }
}
