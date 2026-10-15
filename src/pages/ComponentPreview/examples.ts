// Presentation examples, independent of the API's product contract.
export type ExampleProduct = { id: number; name: string; category: string; availability: 'available' | 'low' | 'out' }

export const exampleProducts: ExampleProduct[] = [
  { id: 1, name: 'Café torrado 500 g', category: 'Mercearia', availability: 'available' },
  { id: 2, name: 'Leite integral 1 L', category: 'Mercearia', availability: 'low' },
  { id: 3, name: 'Água mineral 500 ml', category: 'Bebidas', availability: 'out' },
  { id: 4, name: 'Detergente neutro 500 ml', category: 'Limpeza', availability: 'available' },
]

export const availabilityLabels = { available: 'Disponível', low: 'Estoque baixo', out: 'Ruptura' } as const
