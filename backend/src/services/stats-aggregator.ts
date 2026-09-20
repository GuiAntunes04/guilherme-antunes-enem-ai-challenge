import { supabaseAdmin } from '../lib/supabase.js'

export type SubjectPerformance = {
  subject: string
  area: string
  correct: number
  total: number
  accuracy: number
}

export type SimulationTrendPoint = {
  id: string
  label: string
  finishedAt: string
  score: number
  total: number
  accuracy: number
  mode: string
}

export type DashboardStats = {
  subjectPerformance: SubjectPerformance[]
  simulationTrend: SimulationTrendPoint[]
}

type AnswerRow = {
  question_id: string | null
  is_correct: boolean
  attempt_id: string
}

type QuestionMeta = {
  id: string
  subject_name: string | null
  subject_area: string | null
}

type AttemptRow = {
  id: string
  mode: string | null
  discipline: string
  score: number
  total: number
  finished_at: string
}

function formatTrendLabel(attempt: AttemptRow): string {
  const date = new Date(attempt.finished_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })

  if (attempt.mode === 'day_one') return `1º dia · ${date}`
  if (attempt.mode === 'day_two') return `2º dia · ${date}`
  if (attempt.mode === 'essay') return `Redação · ${date}`
  if (attempt.mode === 'subject_practice') {
    const short = attempt.discipline.length > 18
      ? `${attempt.discipline.slice(0, 16)}…`
      : attempt.discipline
    return `${short} · ${date}`
  }

  return `${attempt.discipline} · ${date}`
}

export async function buildDashboardStats(userId: string): Promise<DashboardStats> {
  const { data: attempts, error: attemptsError } = await supabaseAdmin
    .from('simulation_attempts')
    .select('id, mode, discipline, score, total, finished_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: true })

  if (attemptsError || !attempts?.length) {
    return { subjectPerformance: [], simulationTrend: [] }
  }

  const mcqAttemptIds = attempts
    .filter((attempt) => attempt.mode !== 'essay')
    .map((attempt) => attempt.id)

  const subjectPerformance = mcqAttemptIds.length
    ? await aggregateSubjectPerformance(mcqAttemptIds)
    : []

  const simulationTrend = (attempts as AttemptRow[])
    .filter((attempt) => attempt.total > 0)
    .slice(-12)
    .map((attempt) => ({
      id: attempt.id,
      label: formatTrendLabel(attempt),
      finishedAt: attempt.finished_at,
      score: attempt.score,
      total: attempt.total,
      accuracy: Math.round((attempt.score / attempt.total) * 100),
      mode: attempt.mode ?? 'unknown',
    }))

  return { subjectPerformance, simulationTrend }
}

const ATTEMPT_ID_BATCH = 40
const QUESTION_ID_BATCH = 100
const ANSWERS_PAGE_SIZE = 1000

async function fetchAnswersForAttempts(attemptIds: string[]): Promise<AnswerRow[]> {
  const answers: AnswerRow[] = []

  for (let i = 0; i < attemptIds.length; i += ATTEMPT_ID_BATCH) {
    const batch = attemptIds.slice(i, i + ATTEMPT_ID_BATCH)
    let offset = 0

    while (true) {
      const { data, error } = await supabaseAdmin
        .from('attempt_answers')
        .select('question_id, is_correct, attempt_id')
        .in('attempt_id', batch)
        .range(offset, offset + ANSWERS_PAGE_SIZE - 1)

      if (error) {
        throw error
      }

      if (!data?.length) {
        break
      }

      answers.push(...(data as AnswerRow[]))

      if (data.length < ANSWERS_PAGE_SIZE) {
        break
      }

      offset += ANSWERS_PAGE_SIZE
    }
  }

  return answers
}

async function fetchQuestionMetadata(questionIds: string[]): Promise<Map<string, QuestionMeta>> {
  const questionMap = new Map<string, QuestionMeta>()

  for (let i = 0; i < questionIds.length; i += QUESTION_ID_BATCH) {
    const batch = questionIds.slice(i, i + QUESTION_ID_BATCH)
    const { data, error } = await supabaseAdmin
      .from('enem_questions_index')
      .select('id, subject_name, subject_area')
      .in('id', batch)

    if (error) {
      throw error
    }

    for (const question of (data ?? []) as QuestionMeta[]) {
      questionMap.set(question.id, question)
    }
  }

  return questionMap
}

async function aggregateSubjectPerformance(
  attemptIds: string[],
): Promise<SubjectPerformance[]> {
  let answers: AnswerRow[] = []

  try {
    answers = await fetchAnswersForAttempts(attemptIds)
  } catch {
    return []
  }

  if (!answers.length) {
    return []
  }

  const questionIds = [
    ...new Set(
      answers
        .map((answer) => answer.question_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  if (questionIds.length === 0) {
    return []
  }

  let questionMap: Map<string, QuestionMeta>

  try {
    questionMap = await fetchQuestionMetadata(questionIds)
  } catch {
    return []
  }

  const totals = new Map<string, { subject: string; area: string; correct: number; total: number }>()

  for (const answer of answers) {
    if (!answer.question_id) continue

    const meta = questionMap.get(answer.question_id)
    const subject = meta?.subject_name?.trim() || 'Outros'
    const area = meta?.subject_area?.trim() || 'Sem área'
    const key = subject

    const current = totals.get(key) ?? { subject, area, correct: 0, total: 0 }
    current.total += 1
    if (answer.is_correct) current.correct += 1
    totals.set(key, current)
  }

  return [...totals.values()]
    .map((entry) => ({
      subject: entry.subject,
      area: entry.area,
      correct: entry.correct,
      total: entry.total,
      accuracy: Math.round((entry.correct / entry.total) * 100),
    }))
    .sort((a, b) => b.total - a.total)
}
