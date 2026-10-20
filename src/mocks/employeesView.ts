import type { EmployeeView } from '../types/employeesView'

export const employeesDemo: EmployeeView[] = [
  { id: 'e01', name: 'João Silva', email: 'joao@kairos.example', role: 'Repositor', shift: 'Manhã', status: 'active', location: 'Bebidas · Corredor 1' },
  { id: 'e02', name: 'Mariana Lima', email: 'mariana@kairos.example', role: 'Repositor', shift: 'Manhã', status: 'active', location: 'Higiene · Corredor 4' },
  { id: 'e03', name: 'Pedro Santos', email: 'pedro@kairos.example', role: 'Repositor', shift: 'Manhã', status: 'active', location: 'Mercearia · Corredor 2' },
  { id: 'e04', name: 'Carla Oliveira', email: 'carla@kairos.example', role: 'Caixa', shift: 'Manhã', status: 'active', location: 'Frente de caixa' },
  { id: 'e05', name: 'Lucas Almeida', email: 'lucas@kairos.example', role: 'Vendedor', shift: 'Tarde', status: 'off', location: 'Atendimento da loja' },
  { id: 'e06', name: 'Beatriz Souza', email: 'beatriz@kairos.example', role: 'Caixa', shift: 'Tarde', status: 'inactive', location: 'Sem posto atribuído' },
  ...['Rafael Costa', 'Juliana Rocha', 'Bruno Martins', 'Camila Ribeiro', 'Diego Alves', 'Fernanda Dias', 'Gabriel Melo', 'Helena Castro', 'Igor Nunes', 'Larissa Gomes', 'Mateus Reis', 'Natália Lopes'].map((name, index): EmployeeView => ({
    id: `e${index + 7}`, name, email: `equipe${index + 7}@kairos.example`,
    role: index < 3 || index === 8 || index === 11 ? 'Repositor' : index % 2 ? 'Caixa' : 'Vendedor',
    shift: index < 8 ? 'Manhã' : 'Tarde', status: index < 8 ? 'active' : index < 11 ? 'off' : 'inactive',
    location: index < 5 ? 'Área de reposição' : 'Atendimento da loja',
  })),
]
