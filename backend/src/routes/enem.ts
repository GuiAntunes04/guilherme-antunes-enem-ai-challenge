import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  AVAILABLE_YEARS,
  getAreasFromIndex,
  getIndexCount,
  getIndexedYears,
  getSubjectAreasFromIndex,
  getSubjectNamesFromIndex,
  getSubjectsFromIndex,
  QuestionIndexNotSyncedError,
  syncQuestionIndex,
} from '../services/question-index.js'

export const enemRouter = Router()

enemRouter.use(requireAuth)

enemRouter.get('/index-status', async (_req, res) => {
  try {
    const count = await getIndexCount()
    res.json({ synced: count > 0, count })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check index status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

enemRouter.post('/sync', async (_req, res) => {
  try {
    const result = await syncQuestionIndex()
    res.json({
      message: 'Question index synced successfully',
      ...result,
    })
  } catch (error) {
    res.status(502).json({
      error: 'Failed to sync question index',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

enemRouter.get('/years', async (_req, res) => {
  try {
    const count = await getIndexCount()
    const years = count > 0 ? await getIndexedYears() : AVAILABLE_YEARS

    res.json(
      years.map((year) => ({
        year,
        title: `ENEM ${year}`,
      })),
    )
  } catch (error) {
    res.status(502).json({
      error: 'Failed to fetch years',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

enemRouter.get('/subject-areas', async (_req, res) => {
  try {
    const areas = await getSubjectAreasFromIndex()
    res.json(areas)
  } catch (error) {
    const status = error instanceof QuestionIndexNotSyncedError ? 503 : 502
    res.status(status).json({
      error: 'Failed to fetch subject areas',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

enemRouter.get('/practice-subjects', async (_req, res) => {
  try {
    const subjects = await getSubjectNamesFromIndex()
    res.json(subjects)
  } catch (error) {
    const status = error instanceof QuestionIndexNotSyncedError ? 503 : 502
    res.status(status).json({
      error: 'Failed to fetch practice subjects',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

enemRouter.get('/subjects', async (req, res) => {
  const year = Number(req.query.year)

  if (!year) {
    res.status(400).json({ error: 'year query parameter is required' })
    return
  }

  try {
    const subjects = await getSubjectsFromIndex(year)
    res.json(subjects)
  } catch (error) {
    const status = error instanceof QuestionIndexNotSyncedError ? 503 : 502
    res.status(status).json({
      error: 'Failed to fetch subjects',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

enemRouter.get('/areas', async (req, res) => {
  const year = Number(req.query.year)

  if (!year) {
    res.status(400).json({ error: 'year query parameter is required' })
    return
  }

  try {
    const areas = await getAreasFromIndex(year)
    res.json(areas)
  } catch (error) {
    const status = error instanceof QuestionIndexNotSyncedError ? 503 : 502
    res.status(status).json({
      error: 'Failed to fetch areas',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
