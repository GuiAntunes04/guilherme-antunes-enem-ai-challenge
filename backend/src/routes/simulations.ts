import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import {
  cacheQuestions,
  fetchAllQuestionsForYear,
  fetchQuestionsByIds,
  sanitizeQuestion,
  shuffleAndPick,
} from '../services/enemhub-api.js'
import type { EnemHubQuestion } from '../types/enemhub.js'

export const simulationsRouter = Router()

simulationsRouter.use(requireAuth)

simulationsRouter.get('/', async (req, res) => {
  const userId = req.user!.id

  const { data, error } = await supabaseAdmin
    .from('simulation_attempts')
    .select('id, exam_year, discipline, score, total, started_at, finished_at')
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
      disciplineLabel: attempt.discipline,
    })),
  )
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

  if (attempt.question_ids?.length) {
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

  res.json({
    attempt: {
      ...attempt,
      disciplineLabel: attempt.discipline,
    },
    answers: enrichedAnswers,
    questions,
  })
})

simulationsRouter.post('/start', async (req, res) => {
  const userId = req.user!.id
  const examYear = Number(req.body.examYear)
  const subjectArea = String(req.body.subjectArea ?? '')
  const questionCount = Number(req.body.questionCount ?? 10)

  if (!examYear || !subjectArea) {
    res.status(400).json({ error: 'examYear and subjectArea are required' })
    return
  }

  if (questionCount < 1 || questionCount > 20) {
    res.status(400).json({ error: 'questionCount must be between 1 and 20' })
    return
  }

  try {
    const allQuestions = await fetchAllQuestionsForYear(examYear)
    const filtered = allQuestions.filter((q) => q.subject?.area === subjectArea)

    if (filtered.length === 0) {
      res.status(404).json({ error: 'No questions found for this area and year' })
      return
    }

    const selected = shuffleAndPick(filtered, Math.min(questionCount, filtered.length))
    const questionIds = selected.map((q) => q.id)
    cacheQuestions(selected)

    const { data: attempt, error } = await supabaseAdmin
      .from('simulation_attempts')
      .insert({
        user_id: userId,
        exam_year: examYear,
        discipline: subjectArea,
        score: 0,
        total: selected.length,
        question_ids: questionIds,
      })
      .select('id, exam_year, discipline, total, started_at')
      .single()

    if (error || !attempt) {
      res.status(500).json({ error: 'Failed to create simulation', message: error?.message })
      return
    }

    res.status(201).json({
      attempt: {
        ...attempt,
        disciplineLabel: subjectArea,
      },
      questions: selected.map(sanitizeQuestion),
    })
  } catch (error) {
    res.status(502).json({
      error: 'Failed to start simulation',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

simulationsRouter.post('/:id/submit', async (req, res) => {
  const userId = req.user!.id
  const attemptId = req.params.id
  const answers = req.body.answers as { questionId: string; selectedOption: string }[]

  if (!Array.isArray(answers) || answers.length === 0) {
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
        finished_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .select('id, exam_year, discipline, score, total, started_at, finished_at')
      .single()

    if (updateError || !updated) {
      res.status(500).json({ error: 'Failed to finalize simulation', message: updateError?.message })
      return
    }

    res.json({
      attempt: {
        ...updated,
        disciplineLabel: updated.discipline,
      },
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
