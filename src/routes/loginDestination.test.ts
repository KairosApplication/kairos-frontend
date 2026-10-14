import { describe, expect, it } from 'vitest'
import { loginDestination } from './loginDestination'

describe('destino após autenticação', () => {
  it('preserva somente uma rota conhecida e seus filtros', () => {
    expect(loginDestination({ from: '/mapa?setor=1#A12' })).toBe('/mapa?setor=1#A12')
  })
  it.each([undefined, null, {}, { from: 12 }, { from: 'https://evil.test' }, { from: '//evil.test' }, { from: '/login' }, { from: '/inexistente' }])('recusa destinos inválidos: %j', (state) => {
    expect(loginDestination(state)).toBe('/dashboard')
  })
})
