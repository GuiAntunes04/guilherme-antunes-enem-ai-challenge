import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase.js'

import { requireAuth } from '../middleware/auth.js'

import {

  cacheQuestions,

  fetchQuestionsByIds,

  sanitizeQuestion,

} from '../services/enemhub-api.js'

import { QuestionIndexNotSyncedError } from '../services/question-index.js'
import { mapEssay } from '../services/essay-mapper.js'
import { isValidMode, planSimulation } from '../services/simulation-builder.js'
import type { EssayRow } from '../types/essay.js'

import {
  LEGACY_SIMULATION_MODE_LABELS,
  SIMULATION_MODE_LABELS,
} from '../types/simulation.js'

import type { EnemHubQuestion } from '../types/enemhub.js'

import type { StartSimulationBody } from '../types/simulation.js'



export const simulationsRouter = Router()

const QUESTION_LOAD_BATCH_SIZE = 8

simulationsRouter.use(requireAuth)



const ALL_MODE_LABELS = {
  ...SIMULATION_MODE_LABELS,
  ...LEGACY_SIMULATION_MODE_LABELS,
}

function formatAttemptLabel(attempt: Record<string, unknown>): string {
  const mode = attempt.mode as string | undefined

  if (mode && mode in ALL_MODE_LABELS) {
    return ALL_MODE_LABELS[mode as keyof typeof ALL_MODE_LABELS]
  }

  return String(attempt.discipline ?? '')
}



function formatAttemptTitle(attempt: Record<string, unknown>): string {

  const yearsUsed = attempt.years_used as number[] | undefined

  const examYear = attempt.exam_year as number | null | undefined



  if (yearsUsed && yearsUsed.length > 1) {
    return `Multi-anos (${yearsUsed.join(', ')})`
  }

  if (yearsUsed?.length === 1) {
    return `ENEM ${yearsUsed[0]}`
  }

  if (examYear) {
    return `ENEM ${examYear}`
  }

  return 'Simulado ENEM'

}

const ATTEMPT_TIMER_FIELDS =
  'id, exam_year, discipline, mode, years_used, score, total, started_at, quiz_started_at, time_limit_seconds, finished_at, elapsed_seconds, essay_id'

const ESSAY_FIELDS =
  'id, user_id, theme, motivators, content, source, status, ai_feedback, time_limit_seconds, elapsed_seconds, quiz_started_at, finished_at, created_at'

function mapAttemptRow(attempt: Record<string, unknown>) {
  return {
    ...attempt,
    disciplineLabel: formatAttemptLabel(attempt),
    attemptTitle: formatAttemptTitle(attempt),
  }
}

function computeElapsedSeconds(
  attempt: {
    started_at: string
    quiz_started_at?: string | null
    time_limit_seconds?: number | null
  },
  clientElapsedSeconds: number,
): number | null {
  const timerStart = attempt.quiz_started_at ?? attempt.started_at
  const serverElapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(timerStart).getTime()) / 1000),
  )

  const elapsed =
    attempt.quiz_started_at != null
      ? serverElapsed
      : clientElapsedSeconds > 0
        ? clientElapsedSeconds
        : serverElapsed

  if (!elapsed) return null

  if (attempt.time_limit_seconds && elapsed > 0) {
    return Math.min(elapsed, attempt.time_limit_seconds + 30)
  }

  return elapsed
}

simulationsRouter.get('/', async (req, res) => {

  const userId = req.user!.id



  const { data, error } = await supabaseAdmin

    .from('simulation_attempts')

    .select(

      'id, exam_year, discipline, mode, years_used, score, total, started_at, finished_at, elapsed_seconds',

    )

    .eq('user_id', userId)

    .not('finished_at', 'is', null)

    .order('finished_at', { ascending: false })



  if (error) {

    res.status(500).json({ error: 'Failed to load history', message: error.message })

    return

  }



  res.json(

    data.map((attempt) => ({

      ...attempt,

      disciplineLabel: formatAttemptLabel(attempt),

      attemptTitle: formatAttemptTitle(attempt),

    })),

  )

})



simulationsRouter.get('/:id/questions', async (req, res) => {
  const userId = req.user!.id
  const attemptId = req.params.id
  const from = Math.max(0, Number(req.query.from ?? 0))
  const count = Math.min(
    Math.max(1, Number(req.query.count ?? QUESTION_LOAD_BATCH_SIZE)),
    12,
  )

  const { data: attempt, error } = await supabaseAdmin
    .from('simulation_attempts')
    .select('id, question_ids, mode, finished_at')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .single()

  if (error || !attempt) {
    res.status(404).json({ error: 'Simulation not found' })
    return
  }

  const questionIds = (attempt.question_ids as string[] | null) ?? []
  const batchIds = questionIds.slice(from, from + count)

  if (batchIds.length === 0) {
    res.json({ questions: [], total: questionIds.length, from })
    return
  }

  try {
    const hubQuestions = await fetchQuestionsByIds(batchIds)
    cacheQuestions(hubQuestions)

    const questionMap = new Map(hubQuestions.map((question) => [question.id, question]))
    const orderedQuestions = batchIds.flatMap((id: string) => {
      const question = questionMap.get(id)
      return question ? [question] : []
    })

    res.json({
      questions: orderedQuestions.map(sanitizeQuestion),
      total: questionIds.length,
      from,
    })
  } catch (loadError) {
    res.status(502).json({
      error: 'Failed to load questions',
      message: loadError instanceof Error ? loadError.message : 'Unknown error',
    })
  }
})

simulationsRouter.get('/:id', async (req, res) => {

  const userId = req.user!.id

  const attemptId = req.params.id



  const { data: attempt, error } = await supabaseAdmin

    .from('simulation_attempts')

    .select('*')

    .eq('id', attemptId)

    .eq('user_id', userId)

    .single()



  if (error || !attempt) {

    res.status(404).json({ error: 'Simulation not found' })

    return

  }



  const { data: answers } = await supabaseAdmin

    .from('attempt_answers')

    .select('question_id, selected_option, is_correct')

    .eq('attempt_id', attemptId)



  let questions = null

  let enrichedAnswers = answers ?? []



  if (attempt.finished_at && attempt.question_ids?.length) {

    try {

      const hubQuestions = await fetchQuestionsByIds(attempt.question_ids)

      const orderedQuestions: EnemHubQuestion[] = attempt.question_ids.flatMap(

        (id: string) => {

          const question = hubQuestions.find((q) => q.id === id)

          return question ? [question] : []

        },

      )

      questions = orderedQuestions.map(sanitizeQuestion)



      if (attempt.finished_at && answers?.length) {

        const questionMap = new Map(hubQuestions.map((q) => [q.id, q]))

        enrichedAnswers = answers.map((answer) => ({

          ...answer,

          correct_option: questionMap.get(answer.question_id)?.correctAlternative,

        }))

      }

    } catch (error) {

      res.status(502).json({

        error: 'Failed to load questions',

        message: error instanceof Error ? error.message : 'Unknown error',

      })

      return

    }

  }



  let essay = null

  if (attempt.essay_id) {
    const { data: essayRow } = await supabaseAdmin
      .from('essays')
      .select(ESSAY_FIELDS)
      .eq('id', attempt.essay_id)
      .eq('user_id', userId)
      .single()

    if (essayRow) {
      essay = mapEssay(essayRow as EssayRow)
    }
  }

  res.json({

    attempt: {

      ...attempt,

      disciplineLabel: formatAttemptLabel(attempt),

      attemptTitle: formatAttemptTitle(attempt),

    },

    answers: enrichedAnswers,

    questions,

    essay,

  })

})



simulationsRouter.post('/start', async (req, res) => {

  const userId = req.user!.id

  const body = req.body as StartSimulationBody



  if (!body.mode || !isValidMode(body.mode)) {

    res.status(400).json({ error: 'Valid mode is required' })

    return

  }



  try {

    const planned = await planSimulation(body, { userId })

    const questionIds = planned.questionIds

    let essayId: string | null = null

    if (body.mode === 'essay') {
      if (!planned.essayTheme) {
        res.status(502).json({ error: 'Failed to generate essay theme' })
        return
      }

      const { data: essayRow, error: essayError } = await supabaseAdmin
        .from('essays')
        .insert({
          user_id: userId,
          theme: planned.essayTheme.title,
          motivators: planned.essayTheme.motivators,
          content: '',
          source: 'simulation',
          status: 'draft',
          time_limit_seconds: planned.timeLimitSeconds,
        })
        .select(ESSAY_FIELDS)
        .single()

      if (essayError || !essayRow) {
        res.status(500).json({ error: 'Failed to create essay', message: essayError?.message })
        return
      }

      essayId = essayRow.id
    }

    const { data: attempt, error } = await supabaseAdmin

      .from('simulation_attempts')

      .insert({

        user_id: userId,

        exam_year: planned.examYear,

        discipline: planned.discipline,

        mode: body.mode,

        years_used: planned.yearsUsed,

        subject_id: planned.subjectId,

        score: 0,

        total: body.mode === 'essay' ? 1000 : questionIds.length,

        question_ids: questionIds,

        time_limit_seconds: planned.timeLimitSeconds,

        essay_id: essayId,

      })

      .select(ATTEMPT_TIMER_FIELDS)

      .single()



    if (error || !attempt) {

      res.status(500).json({ error: 'Failed to create simulation', message: error?.message })

      return

    }

    let essay = null

    if (essayId) {
      const { data: essayRow } = await supabaseAdmin
        .from('essays')
        .select(ESSAY_FIELDS)
        .eq('id', essayId)
        .single()

      if (essayRow) {
        essay = mapEssay(essayRow as EssayRow)
      }
    }

    res.status(201).json({

      attempt: mapAttemptRow(attempt),

      questions: [],

      essay,

    })

  } catch (error) {

    const message = error instanceof Error ? error.message : 'Unknown error'

    let status = 502
    if (error instanceof QuestionIndexNotSyncedError) status = 503
    else if (message.startsWith('No questions') || message.startsWith('Nenhuma questão')) {
      status = 404
    }

    res.status(status).json({

      error: 'Failed to start simulation',

      message,

    })

  }

})

simulationsRouter.post('/:id/begin', async (req, res) => {
  const userId = req.user!.id
  const attemptId = req.params.id

  const { data: attempt, error } = await supabaseAdmin
    .from('simulation_attempts')
    .select('id, user_id, finished_at, quiz_started_at')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .single()

  if (error || !attempt) {
    res.status(404).json({ error: 'Simulation not found' })
    return
  }

  if (attempt.finished_at) {
    res.status(400).json({ error: 'Simulation already finished' })
    return
  }

  if (attempt.quiz_started_at) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('simulation_attempts')
      .select(ATTEMPT_TIMER_FIELDS)
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single()

    if (existingError || !existing) {
      res.status(500).json({ error: 'Failed to load simulation', message: existingError?.message })
      return
    }

    res.json({ attempt: mapAttemptRow(existing) })
    return
  }

  const now = new Date().toISOString()

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('simulation_attempts')
    .update({ quiz_started_at: now })
    .eq('id', attemptId)
    .eq('user_id', userId)
    .is('quiz_started_at', null)
    .select(ATTEMPT_TIMER_FIELDS)
    .maybeSingle()

  if (updateError) {
    res.status(500).json({ error: 'Failed to start quiz timer', message: updateError.message })
    return
  }

  if (updated) {
    res.json({ attempt: mapAttemptRow(updated) })
    return
  }

  const { data: raced, error: racedError } = await supabaseAdmin
    .from('simulation_attempts')
    .select(ATTEMPT_TIMER_FIELDS)
    .eq('id', attemptId)
    .eq('user_id', userId)
    .single()

  if (racedError || !raced) {
    res.status(500).json({ error: 'Failed to start quiz timer', message: racedError?.message })
    return
  }

  res.json({ attempt: mapAttemptRow(raced) })
})

simulationsRouter.post('/:id/submit', async (req, res) => {

  const userId = req.user!.id

  const attemptId = req.params.id

  const answers = req.body.answers as { questionId: string; selectedOption: string }[]

  const elapsedSeconds = Number(req.body.elapsedSeconds ?? 0)



  if (!Array.isArray(answers)) {

    res.status(400).json({ error: 'answers array is required' })

    return

  }



  const { data: attempt, error: attemptError } = await supabaseAdmin

    .from('simulation_attempts')

    .select('*')

    .eq('id', attemptId)

    .eq('user_id', userId)

    .single()



  if (attemptError || !attempt) {

    res.status(404).json({ error: 'Simulation not found' })

    return

  }



  if (attempt.finished_at) {

    res.status(400).json({ error: 'Simulation already submitted' })

    return

  }



  try {

    const hubQuestions = await fetchQuestionsByIds(attempt.question_ids)

    const questionMap = new Map(hubQuestions.map((q) => [q.id, q]))



    const gradedAnswers = answers.map((answer) => {

      const question = questionMap.get(answer.questionId)

      const isCorrect =

        question?.correctAlternative?.toUpperCase() === answer.selectedOption.toUpperCase()



      return {

        attempt_id: attemptId,

        question_id: answer.questionId,

        selected_option: answer.selectedOption.toUpperCase(),

        is_correct: Boolean(isCorrect),

      }

    })



    const score = gradedAnswers.filter((a) => a.is_correct).length

    const cappedElapsed = computeElapsedSeconds(attempt, elapsedSeconds)



    const { error: answersError } = await supabaseAdmin

      .from('attempt_answers')

      .insert(gradedAnswers)



    if (answersError) {

      res.status(500).json({ error: 'Failed to save answers', message: answersError.message })

      return

    }



    const { data: updated, error: updateError } = await supabaseAdmin

      .from('simulation_attempts')

      .update({

        score,

        elapsed_seconds: cappedElapsed,

        finished_at: new Date().toISOString(),

      })

      .eq('id', attemptId)

      .select(ATTEMPT_TIMER_FIELDS)

      .single()



    if (updateError || !updated) {

      res.status(500).json({ error: 'Failed to finalize simulation', message: updateError?.message })

      return

    }



    res.json({

      attempt: mapAttemptRow(updated),

      answers: gradedAnswers.map((a) => ({

        question_id: a.question_id,

        selected_option: a.selected_option,

        is_correct: a.is_correct,

        correct_option: questionMap.get(a.question_id)?.correctAlternative,

      })),

    })

  } catch (error) {

    res.status(502).json({

      error: 'Failed to submit simulation',

      message: error instanceof Error ? error.message : 'Unknown error',

    })

  }

})

