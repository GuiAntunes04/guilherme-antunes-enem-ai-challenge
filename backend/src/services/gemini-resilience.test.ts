import assert from 'node:assert/strict'
import test from 'node:test'
import { withGeminiFallback } from './gemini-resilience.js'

test('withGeminiFallback rotates model on overload then key on quota', async () => {
  const calls: Array<{ key: string; model: string }> = []

  const result = await withGeminiFallback(
    async (apiKey, model) => {
      calls.push({ key: apiKey, model })

      if (model === 'model-1') {
        throw Object.assign(new Error('model overloaded'), { status: 503 })
      }

      if (apiKey === 'key-a') {
        throw Object.assign(new Error('quota exceeded'), { status: 429 })
      }

      return 'ok'
    },
    { apiKeys: ['key-a', 'key-b'], models: ['model-1', 'model-2'] },
  )

  assert.equal(result, 'ok')
  assert.deepEqual(calls, [
    { key: 'key-a', model: 'model-1' },
    { key: 'key-a', model: 'model-2' },
    { key: 'key-b', model: 'model-1' },
    { key: 'key-b', model: 'model-2' },
  ])
})
