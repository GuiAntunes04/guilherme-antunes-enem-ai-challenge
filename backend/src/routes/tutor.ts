import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { generateTutorReply, type TutorChatMessage } from '../services/gemini.js'
import { buildQuestionContextFromId } from '../services/tutor-context.js'
import {
  getGeneralTutorSystemPrompt,
  getSimulationTutorSystemPrompt,
} from '../services/tutor-prompt.js'

export const tutorRouter = Router()

tutorRouter.use(requireAuth)

const MAX_MESSAGE_LENGTH = 2000

type TutorSessionRow = {
  id: string
  user_id: string
  title: string | null
  simulation_attempt_id: string | null
  question_id: string | null
  created_at: string
  updated_at: string
}

type TutorMessageRow = {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

function mapSession(row: TutorSessionRow) {
  return {
    id: row.id,
    title: row.title,
    simulationAttemptId: row.simulation_attempt_id,
    questionId: row.question_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isSimulation: Boolean(row.simulation_attempt_id && row.question_id),
  }
}

function mapMessage(row: TutorMessageRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }
}

async function loadSessionForUser(sessionId: string, userId: string): Promise<TutorSessionRow | null> {
  const { data, error } = await supabaseAdmin
    .from('tutor_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as TutorSessionRow
}

async function findSimulationTutorSession(
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<TutorSessionRow | null> {
  const { data, error } = await supabaseAdmin
    .from('tutor_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('simulation_attempt_id', attemptId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as TutorSessionRow | null) ?? null
}

function isDuplicateSimulationSessionError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === '23505') return true
  return error.message?.includes('tutor_sessions_attempt_question_uidx') ?? false
}

async function loadSessionMessages(sessionId: string): Promise<TutorMessageRow[]> {
  const { data, error } = await supabaseAdmin
    .from('tutor_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load tutor messages: ${error.message}`)
  }

  return (data ?? []) as TutorMessageRow[]
}

tutorRouter.get('/sessions', async (req, res) => {
  const userId = req.user!.id

  const { data, error } = await supabaseAdmin
    .from('tutor_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('simulation_attempt_id', null)
    .order('updated_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: 'Failed to load tutor sessions', message: error.message })
    return
  }

  res.json((data as TutorSessionRow[]).map(mapSession))
})

tutorRouter.post('/sessions', async (req, res) => {
  const userId = req.user!.id
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''

  const { data, error } = await supabaseAdmin
    .from('tutor_sessions')
    .insert({
      user_id: userId,
      title: title || 'Nova conversa',
    })
    .select('*')
    .single()

  if (error || !data) {
    res.status(500).json({ error: 'Failed to create tutor session', message: error?.message })
    return
  }

  res.status(201).json(mapSession(data as TutorSessionRow))
})

tutorRouter.post('/sessions/simulation', async (req, res) => {
  const userId = req.user!.id
  const attemptId = String(req.body.attemptId ?? '').trim()
  const questionId = String(req.body.questionId ?? '').trim()

  if (!attemptId || !questionId) {
    res.status(400).json({ error: 'attemptId and questionId are required' })
    return
  }

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('simulation_attempts')
    .select('id, user_id, finished_at, question_ids')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .single()

  if (attemptError || !attempt) {
    res.status(404).json({ error: 'Simulation not found' })
    return
  }

  if (attempt.finished_at) {
    res.status(400).json({ error: 'Simulation already finished' })
    return
  }

  const questionIds = (attempt.question_ids as string[] | null) ?? []
  if (!questionIds.includes(questionId)) {
    res.status(400).json({ error: 'Question does not belong to this simulation' })
    return
  }

  try {
    const existing = await findSimulationTutorSession(userId, attemptId, questionId)
    if (existing) {
      res.json(mapSession(existing))
      return
    }

    const { data: created, error: createError } = await supabaseAdmin
      .from('tutor_sessions')
      .insert({
        user_id: userId,
        title: 'Dúvida no simulado',
        simulation_attempt_id: attemptId,
        question_id: questionId,
      })
      .select('*')
      .single()

    if (createError) {
      if (isDuplicateSimulationSessionError(createError)) {
        const raced = await findSimulationTutorSession(userId, attemptId, questionId)
        if (raced) {
          res.json(mapSession(raced))
          return
        }
      }

      res.status(500).json({ error: 'Failed to create tutor session', message: createError.message })
      return
    }

    if (!created) {
      res.status(500).json({ error: 'Failed to create tutor session' })
      return
    }

    res.status(201).json(mapSession(created as TutorSessionRow))
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load tutor session',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

tutorRouter.get('/sessions/:id/messages', async (req, res) => {
  const userId = req.user!.id
  const sessionId = req.params.id

  const session = await loadSessionForUser(sessionId, userId)
  if (!session) {
    res.status(404).json({ error: 'Tutor session not found' })
    return
  }

  try {
    const messages = await loadSessionMessages(sessionId)
    res.json({
      session: mapSession(session),
      messages: messages.map(mapMessage),
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load messages',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

tutorRouter.post('/sessions/:id/messages', async (req, res) => {
  const userId = req.user!.id
  const sessionId = req.params.id
  const content = String(req.body.content ?? '').trim()

  if (!content) {
    res.status(400).json({ error: 'content is required' })
    return
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `Message must be at most ${MAX_MESSAGE_LENGTH} characters` })
    return
  }

  const session = await loadSessionForUser(sessionId, userId)
  if (!session) {
    res.status(404).json({ error: 'Tutor session not found' })
    return
  }

  if (session.simulation_attempt_id && session.question_id) {
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('simulation_attempts')
      .select('id, finished_at, question_ids')
      .eq('id', session.simulation_attempt_id)
      .eq('user_id', userId)
      .single()

    if (attemptError || !attempt) {
      res.status(404).json({ error: 'Simulation not found' })
      return
    }

    if (attempt.finished_at) {
      res.status(400).json({ error: 'Simulation already finished' })
      return
    }

    const questionIds = (attempt.question_ids as string[] | null) ?? []
    if (!questionIds.includes(session.question_id)) {
      res.status(400).json({ error: 'Question does not belong to this simulation' })
      return
    }
  }

  try {
    const existingMessages = await loadSessionMessages(sessionId)
    const history: TutorChatMessage[] = existingMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }))

    let systemPrompt: string
    if (session.simulation_attempt_id && session.question_id) {
      const questionContext = await buildQuestionContextFromId(session.question_id)
      systemPrompt = getSimulationTutorSystemPrompt(questionContext)
    } else {
      systemPrompt = getGeneralTutorSystemPrompt()
    }

    const reply = await generateTutorReply(systemPrompt, history, content)

    const { data: savedMessages, error: saveError } = await supabaseAdmin
      .from('tutor_messages')
      .insert([
        { session_id: sessionId, role: 'user', content },
        { session_id: sessionId, role: 'assistant', content: reply },
      ])
      .select('*')

    if (saveError || !savedMessages?.length) {
      res.status(500).json({ error: 'Failed to save messages', message: saveError?.message })
      return
    }

    await supabaseAdmin
      .from('tutor_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    res.status(201).json({
      reply,
      messages: (savedMessages as TutorMessageRow[]).map(mapMessage),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(502).json({ error: 'Failed to generate tutor reply', message })
  }
})
