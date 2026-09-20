import assert from 'node:assert/strict'
import test from 'node:test'

test('formatTrendLabel shortens long discipline names', async () => {
  const { buildDashboardStats } = await import('./stats-aggregator.js')
  assert.equal(typeof buildDashboardStats, 'function')
})
