import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getIndexCount,
  getPracticeMetaFromIndex,
  getSubjectAreasFromIndex,
  getSubjectNamesFromIndex,
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

enemRouter.get('/practice-meta', async (_req, res) => {
  try {
    const meta = await getPracticeMetaFromIndex()
    res.json(meta)
  } catch (error) {
    const status = error instanceof QuestionIndexNotSyncedError ? 503 : 502
    res.status(status).json({
      error: 'Failed to fetch practice meta',
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
