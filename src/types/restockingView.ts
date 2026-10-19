export type RestockingTask = {
  id: string; shelf: string; product: string; quantity: number
  responsible: string; status: 'pending' | 'active' | 'done'; urgent: boolean; time: string
}
