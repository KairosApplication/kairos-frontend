import { expect, it } from 'vitest'
import { makeShelfApiFixture } from '../test/shelvesApiFixture'
import { summarizeOperations } from './operationalAnalyticsService'
it('distinguishes current stock from seven-day records and excludes future/older dates', () => {
  const db = makeShelfApiFixture()
  const catalog = { ...db, productShelves: db.links }
  const data = summarizeOperations(catalog, [
    { id: 1, restockingDate: '2026-10-27T10:00:00', restockedQuantity: 12, damagedQuantity: 2 },
    { id: 2, restockingDate: '2026-10-20T10:00:00', restockedQuantity: 50, damagedQuantity: 0 },
    { id: 3, restockingDate: '2026-10-28T10:00:00', restockedQuantity: 100, damagedQuantity: 0 },
  ], '2026-10-27')
  expect(data.quantity).toBe(34)
  expect(data.zero).toHaveLength(1)
  expect(data.emptyShelves).toBe(5)
  expect(data.week).toHaveLength(1)
  expect(data.days.map(d => d.value)).toEqual([0, 0, 0, 0, 0, 0, 10])
  expect(data.categories.find(c => c.name === 'Bebidas')).toMatchObject({ count: 2, zeroLinks: 1 })
})
it('preserves unavailable records instead of treating them as an empty successful response', () => {
  const db = makeShelfApiFixture()
  expect(summarizeOperations({ ...db, productShelves: db.links }, null, '2026-10-27').week).toBeNull()
  expect(summarizeOperations({ ...db, productShelves: db.links }, [], '2026-10-27').week).toEqual([])
})
