import assert from 'node:assert/strict'
import test from 'node:test'

test('FRONTEND_URL supports comma-separated CORS origins', async () => {
  process.env.FRONTEND_URL = 'http://localhost:5173,https://enem-prep-ai.vercel.app'

  const { env } = await import('./env.js')

  assert.deepEqual(env.frontendOrigins, [
    'http://localhost:5173',
    'https://enem-prep-ai.vercel.app',
  ])
  assert.equal(env.frontendUrl, 'http://localhost:5173')
})
