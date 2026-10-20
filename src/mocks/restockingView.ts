import type { RestockingTask } from '../types/restockingView'

export const restockingDemo: RestockingTask[] = [
  { id: 'REP-056', shelf: 'A12', product: 'Coca-Cola 2 L', quantity: 12, responsible: '', status: 'pending', urgent: true, time: 'Há 5 min' },
  { id: 'REP-055', shelf: 'A12', product: 'Água mineral 500 ml', quantity: 24, responsible: '', status: 'pending', urgent: true, time: 'Há 8 min' },
  { id: 'REP-054', shelf: 'B11', product: 'Biscoito Amidos', quantity: 12, responsible: 'Mariana Lima', status: 'pending', urgent: false, time: 'Há 16 min' },
  { id: 'REP-053', shelf: 'C31', product: 'Detergente', quantity: 18, responsible: 'João Silva', status: 'active', urgent: false, time: 'Iniciada há 4 min' },
  { id: 'REP-052', shelf: 'B21', product: 'Arroz branco 5 kg', quantity: 8, responsible: 'Pedro Santos', status: 'active', urgent: false, time: 'Iniciada há 9 min' },
  { id: 'REP-051', shelf: 'D11', product: 'Sabonete', quantity: 24, responsible: 'Mariana Lima', status: 'done', urgent: false, time: 'Concluída às 14:20' },
  { id: 'REP-050', shelf: 'A11', product: 'Suco de uva 1 L', quantity: 12, responsible: 'João Silva', status: 'done', urgent: false, time: 'Concluída às 14:12' },
]
