// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { operationDay } from '../../services/operationalAnalyticsService'
it('uses the operation day in São Paulo rather than the browser timezone', () => {
  expect(operationDay(new Date('2026-10-28T01:00:00Z'))).toBe('2026-10-27')
})
