// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import Insights from './index'
import { downloadInsights } from '../../services/insightsViewService'
vi.mock('../../services/insightsViewService', async (original) => ({ ...await original<typeof import('../../services/insightsViewService')>(), downloadInsights: vi.fn() }))
afterEach(() => { cleanup(); vi.resetAllMocks() })

it('apresenta valores acessíveis nos gráficos e oportunidades com destino válido', async () => {
  render(<MemoryRouter><Insights /></MemoryRouter>)
  expect(await screen.findByRole('img', { name: /Participação na receita: Mercearia 38%/ })).toBeTruthy()
  expect(screen.getByRole('img', { name: /Produtos em ruptura por categoria: Bebidas 2, Mercearia 3, Limpeza 0, Higiene 3/ })).toBeTruthy()
  expect(screen.getByRole('link', { name: /Reforce a equipe/ }).getAttribute('href')).toBe('/funcionarios')
  expect(screen.getByText(/^Dados demonstrativos/)).toBeTruthy()
})

it('exporta a análise demonstrativa e trata falha do download', async () => {
  render(<MemoryRouter><Insights /></MemoryRouter>)
  await screen.findByRole('img', { name: /Participação na receita/ })
  fireEvent.click(screen.getByRole('button', { name: 'Exportar análise' }))
  expect(downloadInsights).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('status').textContent).toContain('Download da análise demonstrativa')
  vi.mocked(downloadInsights).mockImplementationOnce(() => { throw new Error('Unavailable download') })
  fireEvent.click(screen.getByRole('button', { name: 'Exportar análise' }))
  expect(screen.getByRole('alert').textContent).toContain('Não foi possível preparar')
})
