import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { healthRouter } from './routes/health.js'
import { meRouter } from './routes/me.js'
import { statsRouter } from './routes/stats.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.use('/api/health', healthRouter)
  app.use('/api/me', meRouter)
  app.use('/api/stats', statsRouter)

  app.get('/', (_req, res) => {
    res.json({
      name: 'ENEM Prep AI API',
      status: 'ok',
    })
  })

  return app
}
