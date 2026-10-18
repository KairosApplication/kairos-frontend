import type { CatalogProduct, ProductCategory } from '../types/productCatalog'

export const productCategoriesDemo: ProductCategory[] = [
  { id: 'beverages', name: 'Bebidas' }, { id: 'grocery', name: 'Mercearia' },
  { id: 'cleaning', name: 'Limpeza' }, { id: 'hygiene', name: 'Higiene' },
]

export const productsDemo: CatalogProduct[] = [
  { id: 'p01', name: 'Coca-Cola 2 L', sku: 'BEB-001', barcode: '7891000000001', categoryId: 'beverages', price: 9.49, active: true, shelfUnits: 0, warehouseUnits: 84, minimumShelfUnits: 12, sourceShelfId: 'A12' },
  { id: 'p02', name: 'Água mineral 500 ml', sku: 'BEB-014', barcode: '7891000000002', categoryId: 'beverages', price: 2.99, active: true, shelfUnits: 0, warehouseUnits: 120, minimumShelfUnits: 24, sourceShelfId: 'A12' },
  { id: 'p03', name: 'Biscoito Amidos 100 g', sku: 'MER-042', barcode: '7891000000003', categoryId: 'grocery', price: 3.89, active: true, shelfUnits: 6, warehouseUnits: 48, minimumShelfUnits: 8, sourceShelfId: 'B11' },
  { id: 'p04', name: 'Arroz branco 5 kg', sku: 'MER-018', barcode: '7891000000004', categoryId: 'grocery', price: 24.9, active: true, shelfUnits: 32, warehouseUnits: 96, minimumShelfUnits: 12, sourceShelfId: 'B21' },
  { id: 'p05', name: 'Detergente neutro 500 ml', sku: 'LIM-009', barcode: '7891000000005', categoryId: 'cleaning', price: 2.79, active: true, shelfUnits: 18, warehouseUnits: 72, minimumShelfUnits: 6, sourceShelfId: 'C31' },
  { id: 'p06', name: 'Leite integral 1 L', sku: 'MER-026', barcode: '7891000000006', categoryId: 'grocery', price: 5.49, active: true, shelfUnits: 6, warehouseUnits: 18, minimumShelfUnits: 8, sourceShelfId: 'B11' },
  { id: 'p07', name: 'Sabonete 90 g', sku: 'HIG-003', barcode: '7891000000007', categoryId: 'hygiene', price: 2.49, active: true, shelfUnits: 22, warehouseUnits: 48, minimumShelfUnits: 6, sourceShelfId: 'D11' },
  { id: 'p08', name: 'Suco de uva 1 L', sku: 'BEB-020', barcode: '7891000000008', categoryId: 'beverages', price: 8.99, active: true, shelfUnits: 12, warehouseUnits: 36, minimumShelfUnits: 6, sourceShelfId: 'A11' },
  { id: 'p09', name: 'Papel higiênico 4 un.', sku: 'HIG-011', barcode: '7891000000009', categoryId: 'hygiene', price: 7.99, active: true, shelfUnits: 8, warehouseUnits: 24, minimumShelfUnits: 10, sourceShelfId: 'D12' },
  { id: 'p10', name: 'Álcool 70% 1 L', sku: 'LIM-016', barcode: '7891000000010', categoryId: 'cleaning', price: 9.99, active: true, shelfUnits: 16, warehouseUnits: 32, minimumShelfUnits: 6, sourceShelfId: 'C11' },
  { id: 'p11', name: 'Café tradicional 500 g', sku: 'MER-033', barcode: '7891000000011', categoryId: 'grocery', price: 18.9, active: false, shelfUnits: 0, warehouseUnits: 0, minimumShelfUnits: 6, sourceShelfId: 'B21' },
  { id: 'p12', name: 'Refrigerante 1 L', sku: 'BEB-025', barcode: '7891000000012', categoryId: 'beverages', price: 5.99, active: false, shelfUnits: 0, warehouseUnits: 0, minimumShelfUnits: 6, sourceShelfId: 'A11' },
]
