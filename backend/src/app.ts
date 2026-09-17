import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { healthRouter } from './routes/health.js'

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

  app.get('/', (_req, res) => {
    res.json({
      name: 'ENEM Prep AI API',
      status: 'ok',
    })
  })

  return app
}
