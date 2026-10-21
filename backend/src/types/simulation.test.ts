import assert from 'node:assert/strict'
import test from 'node:test'
import {
  resolveEssayTimeLimitSeconds,
  TIME_DAY_SECONDS,
  TIME_ESSAY_MAX_SECONDS,
  TIME_ESSAY_SECONDS,
} from './simulation.js'

test('resolveEssayTimeLimitSeconds allows unlimited and caps at two hours', () => {
  assert.equal(resolveEssayTimeLimitSeconds(null), null)
  assert.equal(
    resolveEssayTimeLimitSeconds(undefined, { defaultWhenMissing: TIME_ESSAY_SECONDS }),
    TIME_ESSAY_SECONDS,
  )
  assert.equal(resolveEssayTimeLimitSeconds(90 * 60), 90 * 60)
  assert.equal(resolveEssayTimeLimitSeconds(TIME_ESSAY_MAX_SECONDS), TIME_ESSAY_MAX_SECONDS)
  assert.equal(resolveEssayTimeLimitSeconds(TIME_DAY_SECONDS), TIME_ESSAY_MAX_SECONDS)
})
