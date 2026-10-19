import type { ComponentType } from 'react'

type VisualRoute = { path: string; Component: ComponentType }
const modules = import.meta.glob<{ default: VisualRoute }>('../pages/*/route.ts', { eager: true })

// Cada tela registra sua rota em um arquivo próprio. As PRs podem ser integradas
// independentemente, sem disputar a mesma entrada no mapa de componentes.
export const visualPages: Partial<Record<string, ComponentType>> = Object.fromEntries(
  Object.values(modules).map(({ default: route }) => [route.path, route.Component]),
)
