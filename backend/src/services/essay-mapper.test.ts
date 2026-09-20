import assert from 'node:assert/strict'
import test from 'node:test'
import { computeEssayElapsedSeconds } from './essay-mapper.js'

test('computeEssayElapsedSeconds uses client elapsed when quiz has not started', () => {
  const elapsed = computeEssayElapsedSeconds(
    { quiz_started_at: null, time_limit_seconds: 5400 },
    120,
  )

  assert.equal(elapsed, 120)
})

test('computeEssayElapsedSeconds caps elapsed time by essay limit', () => {
  const startedAt = new Date(Date.now() - 10_000).toISOString()

  const elapsed = computeEssayElapsedSeconds(
    { quiz_started_at: startedAt, time_limit_seconds: 5 },
    0,
  )

  assert.equal(elapsed, 10)
})
