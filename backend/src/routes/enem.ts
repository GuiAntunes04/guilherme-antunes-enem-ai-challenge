import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { AVAILABLE_YEARS, fetchAreas } from '../services/enemhub-api.js'

export const enemRouter = Router()

enemRouter.use(requireAuth)

enemRouter.get('/years', (_req, res) => {
  res.json(
    AVAILABLE_YEARS.map((year) => ({
      year,
      title: `ENEM ${year}`,
    })),
  )
})

enemRouter.get('/areas', async (req, res) => {
  const year = Number(req.query.year)

  if (!year) {
    res.status(400).json({ error: 'year query parameter is required' })
    return
  }

  try {
    const areas = await fetchAreas(year)
    res.json(areas)
  } catch (error) {
    res.status(502).json({
      error: 'Failed to fetch areas from EnemHub API',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
