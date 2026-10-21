import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireQuestionIndexSyncSecret } from '../middleware/sync-secret.js'
import {
  getIndexCount,
  getPracticeDifficultyCounts,
  getPracticeMetaFromIndex,
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

enemRouter.post('/sync', requireQuestionIndexSyncSecret, async (_req, res) => {
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

enemRouter.get('/practice-filter-stats', async (req, res) => {
  const subjectName = String(req.query.subjectName ?? '').trim()
  const subjectArea = String(req.query.subjectArea ?? '').trim()

  if (subjectName && subjectArea) {
    res.status(400).json({ error: 'Informe subjectName ou subjectArea, não ambos' })
    return
  }

  if (!subjectName && !subjectArea) {
    res.status(400).json({ error: 'subjectName or subjectArea is required' })
    return
  }

  try {
    const stats = await getPracticeDifficultyCounts(
      subjectName ? { subjectName } : { subjectArea },
    )
    res.json(stats)
  } catch (error) {
    const status = error instanceof QuestionIndexNotSyncedError ? 503 : 502
    res.status(status).json({
      error: 'Failed to fetch practice filter stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
