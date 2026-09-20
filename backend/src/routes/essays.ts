import { Router } from 'express'
import multer from 'multer'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { extractTextFromUpload } from '../services/essay-import.js'
import { computeEssayElapsedSeconds, mapEssay } from '../services/essay-mapper.js'
import { evaluateEssay, generateEssayTheme } from '../services/gemini.js'
import type { EssayRow, EssaySource } from '../types/essay.js'

export const essaysRouter = Router()

essaysRouter.use(requireAuth)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
})

const ESSAY_FIELDS =
  'id, user_id, theme, motivators, content, source, status, ai_feedback, time_limit_seconds, elapsed_seconds, quiz_started_at, finished_at, created_at'

const MIN_ESSAY_CHARS = 150

async function loadEssayForUser(essayId: string, userId: string): Promise<EssayRow | null> {
  const { data, error } = await supabaseAdmin
    .from('essays')
    .select(ESSAY_FIELDS)
    .eq('id', essayId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as EssayRow
}

async function finalizeLinkedSimulationAttempt(
  essayId: string,
  userId: string,
  score: number,
  elapsedSeconds: number | null,
): Promise<void> {
  await supabaseAdmin
    .from('simulation_attempts')
    .update({
      score,
      elapsed_seconds: elapsedSeconds,
      finished_at: new Date().toISOString(),
    })
    .eq('essay_id', essayId)
    .eq('user_id', userId)
    .is('finished_at', null)
}

essaysRouter.post('/start', async (req, res) => {
  const userId = req.user!.id
  const source = (req.body.source as EssaySource | undefined) ?? 'redacao'
  const timeLimitRaw = req.body.timeLimitSeconds
  const timeLimitSeconds =
    timeLimitRaw === null || timeLimitRaw === undefined || Number(timeLimitRaw) <= 0
      ? null
      : Number(timeLimitRaw)

  try {
    const theme = await generateEssayTheme()

    const { data, error } = await supabaseAdmin
      .from('essays')
      .insert({
        user_id: userId,
        theme: theme.title,
        motivators: theme.motivators,
        content: '',
        source,
        status: 'draft',
        time_limit_seconds: timeLimitSeconds,
      })
      .select(ESSAY_FIELDS)
      .single()

    if (error || !data) {
      res.status(500).json({ error: 'Failed to create essay', message: error?.message })
      return
    }

    res.status(201).json({ essay: mapEssay(data as EssayRow) })
  } catch (error) {
    res.status(502).json({
      error: 'Failed to generate essay theme',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

essaysRouter.get('/:id', async (req, res) => {
  const essay = await loadEssayForUser(String(req.params.id), req.user!.id)
  if (!essay) {
    res.status(404).json({ error: 'Essay not found' })
    return
  }

  res.json({ essay: mapEssay(essay) })
})

essaysRouter.patch('/:id', async (req, res) => {
  const userId = req.user!.id
  const essayId = String(req.params.id)
  const content = typeof req.body.content === 'string' ? req.body.content : null

  if (content === null) {
    res.status(400).json({ error: 'content is required' })
    return
  }

  const existing = await loadEssayForUser(essayId, userId)
  if (!existing) {
    res.status(404).json({ error: 'Essay not found' })
    return
  }

  if (existing.status === 'done') {
    res.status(400).json({ error: 'Essay already evaluated' })
    return
  }

  const { data, error } = await supabaseAdmin
    .from('essays')
    .update({ content })
    .eq('id', essayId)
    .eq('user_id', userId)
    .select(ESSAY_FIELDS)
    .single()

  if (error || !data) {
    res.status(500).json({ error: 'Failed to save essay', message: error?.message })
    return
  }

  res.json({ essay: mapEssay(data as EssayRow) })
})

essaysRouter.post('/:id/begin', async (req, res) => {
  const userId = req.user!.id
  const essayId = String(req.params.id)

  const existing = await loadEssayForUser(essayId, userId)
  if (!existing) {
    res.status(404).json({ error: 'Essay not found' })
    return
  }

  if (existing.status === 'done') {
    res.status(400).json({ error: 'Essay already evaluated' })
    return
  }

  if (existing.quiz_started_at) {
    res.json({ essay: mapEssay(existing) })
    return
  }

  const now = new Date().toISOString()
  const { data: updated, error } = await supabaseAdmin
    .from('essays')
    .update({ quiz_started_at: now })
    .eq('id', essayId)
    .eq('user_id', userId)
    .is('quiz_started_at', null)
    .select(ESSAY_FIELDS)
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: 'Failed to start essay timer', message: error.message })
    return
  }

  if (updated) {
    res.json({ essay: mapEssay(updated as EssayRow) })
    return
  }

  const raced = await loadEssayForUser(essayId, userId)
  if (!raced) {
    res.status(404).json({ error: 'Essay not found' })
    return
  }

  res.json({ essay: mapEssay(raced) })
})

essaysRouter.post('/:id/import', upload.single('file'), async (req, res) => {
  const userId = req.user!.id
  const essayId = String(req.params.id)
  const file = req.file

  if (!file) {
    res.status(400).json({ error: 'file is required' })
    return
  }

  const existing = await loadEssayForUser(essayId, userId)
  if (!existing) {
    res.status(404).json({ error: 'Essay not found' })
    return
  }

  if (existing.status === 'done') {
    res.status(400).json({ error: 'Essay already evaluated' })
    return
  }

  try {
    const extractedText = await extractTextFromUpload(
      file.buffer,
      file.mimetype,
      file.originalname,
    )

    res.json({ extractedText })
  } catch (error) {
    res.status(400).json({
      error: 'Failed to import file',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

essaysRouter.post('/:id/evaluate', async (req, res) => {
  const userId = req.user!.id
  const essayId = String(req.params.id)
  const content = String(req.body.content ?? '').trim()
  const clientElapsedSeconds = Number(req.body.elapsedSeconds ?? 0)

  if (!content) {
    res.status(400).json({ error: 'content is required' })
    return
  }

  if (content.length < MIN_ESSAY_CHARS) {
    res.status(400).json({
      error: 'Essay too short',
      message: `A redação deve ter pelo menos ${MIN_ESSAY_CHARS} caracteres.`,
    })
    return
  }

  const existing = await loadEssayForUser(essayId, userId)
  if (!existing) {
    res.status(404).json({ error: 'Essay not found' })
    return
  }

  if (existing.status === 'done') {
    res.json({ essay: mapEssay(existing) })
    return
  }

  await supabaseAdmin
    .from('essays')
    .update({ content, status: 'evaluating' })
    .eq('id', essayId)
    .eq('user_id', userId)

  try {
    const feedback = await evaluateEssay(existing.theme, content)
    const elapsedSeconds = computeEssayElapsedSeconds(existing, clientElapsedSeconds)
    const finishedAt = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('essays')
      .update({
        content,
        ai_feedback: feedback,
        status: 'done',
        elapsed_seconds: elapsedSeconds,
        finished_at: finishedAt,
      })
      .eq('id', essayId)
      .eq('user_id', userId)
      .select(ESSAY_FIELDS)
      .single()

    if (error || !data) {
      res.status(500).json({ error: 'Failed to save evaluation', message: error?.message })
      return
    }

    if (existing.source === 'simulation') {
      await finalizeLinkedSimulationAttempt(
        essayId,
        userId,
        feedback.nota_total,
        elapsedSeconds,
      )
    }

    res.json({ essay: mapEssay(data as EssayRow) })
  } catch (error) {
    await supabaseAdmin
      .from('essays')
      .update({ status: 'draft' })
      .eq('id', essayId)
      .eq('user_id', userId)

    res.status(502).json({
      error: 'Failed to evaluate essay',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
