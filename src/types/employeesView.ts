export type EmployeeView = {
  id: string; name: string; email: string; role: 'Repositor' | 'Caixa' | 'Vendedor'
  shift: 'Manhã' | 'Tarde'; status: 'active' | 'off' | 'inactive'; location: string
}
