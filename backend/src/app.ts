import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { enemRouter } from './routes/enem.js'
import { essaysRouter } from './routes/essays.js'
import { healthRouter } from './routes/health.js'
import { meRouter } from './routes/me.js'
import { simulationsRouter } from './routes/simulations.js'
import { statsRouter } from './routes/stats.js'
import { tutorRouter } from './routes/tutor.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.frontendOrigins.includes(origin)) {
          callback(null, true)
          return
        }

        callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
    }),
  )
  app.use(express.json())

  app.use('/api/health', healthRouter)
  app.use('/api/me', meRouter)
  app.use('/api/stats', statsRouter)
  app.use('/api/enem', enemRouter)
  app.use('/api/simulations', simulationsRouter)
  app.use('/api/essays', essaysRouter)
  app.use('/api/tutor', tutorRouter)

  app.get('/', (_req, res) => {
    res.json({
      name: 'ENEM Prep AI API',
      status: 'ok',
    })
  })

  return app
}
