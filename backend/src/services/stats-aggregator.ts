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

async function aggregateSubjectPerformance(
  attemptIds: string[],
): Promise<SubjectPerformance[]> {
  const { data: answers, error: answersError } = await supabaseAdmin
    .from('attempt_answers')
    .select('question_id, is_correct, attempt_id')
    .in('attempt_id', attemptIds)

  if (answersError || !answers?.length) {
    return []
  }

  const questionIds = [
    ...new Set(
      (answers as AnswerRow[])
        .map((answer) => answer.question_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  if (questionIds.length === 0) {
    return []
  }

  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('enem_questions_index')
    .select('id, subject_name, subject_area')
    .in('id', questionIds)

  if (questionsError) {
    return []
  }

  const questionMap = new Map(
    ((questions ?? []) as QuestionMeta[]).map((question) => [question.id, question]),
  )

  const totals = new Map<string, { subject: string; area: string; correct: number; total: number }>()

  for (const answer of answers as AnswerRow[]) {
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
