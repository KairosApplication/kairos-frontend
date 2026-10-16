import type { MapShelf, StoreMapData } from '../types/storeMap'

const sectors = [
  { id: 'A', name: 'Bebidas', aisle: 'Corredor 1' },
  { id: 'B', name: 'Mercearia', aisle: 'Corredor 2' },
  { id: 'C', name: 'Limpeza', aisle: 'Corredor 3' },
  { id: 'D', name: 'Higiene', aisle: 'Corredor 4' },
]

const stockouts: Record<string, number> = { A12: 2, B12: 3, D21: 3 }
const lowStock = new Set(['A21', 'B11', 'C22', 'C31'])

const shelves: MapShelf[] = sectors.flatMap((sector) =>
  ['11', '12', '21', '22', '31', '32'].map((suffix, row) => {
    const id = `${sector.id}${suffix}`
    return {
      id, sectorId: sector.id, row: row + 1,
      status: stockouts[id] ? 'stockout' : lowStock.has(id) ? 'low' : 'stocked',
      stockoutCount: stockouts[id] ?? 0,
      responsible: 'João Silva',
      restockingProducts: id === 'A12' ? [
        { id: 'BEB-001', name: 'Coca-Cola 2 L', shelfUnits: 0, warehouseUnits: 84 },
        { id: 'BEB-014', name: 'Água mineral 500 ml', shelfUnits: 0, warehouseUnits: 120 },
      ] : [],
    }
  }),
)

export const storeMapDemo: StoreMapData = {
  store: 'Mercado Aurora', unit: 'Unidade Centro',
  updatedAt: '25 set 2026, 14:32', sectors, shelves,
}
