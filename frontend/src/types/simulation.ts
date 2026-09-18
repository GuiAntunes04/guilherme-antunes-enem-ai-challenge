export type SimulationMode = 'subject_practice' | 'day_one' | 'day_two'

export const SIMULATION_MODES: { value: SimulationMode; label: string; description: string }[] = [
  {
    value: 'subject_practice',
    label: 'Matéria específica',
    description: 'Questões aleatórias por tópico, com cronômetro configurável',
  },
  {
    value: 'day_one',
    label: '1º dia ENEM',
    description: '90 questões · Linguagens + Humanas · 4h30',
  },
  {
    value: 'day_two',
    label: '2º dia ENEM',
    description: '90 questões · Natureza + Matemática · 4h30',
  },
]

export const SUBJECT_PRACTICE_TIMER_OPTIONS: {
  value: number | null
  label: string
}[] = [
  { value: null, label: 'Ilimitado' },
  { value: 15 * 60, label: '15 minutos' },
  { value: 30 * 60, label: '30 minutos' },
  { value: 45 * 60, label: '45 minutos' },
  { value: 60 * 60, label: '1 hora' },
  { value: 90 * 60, label: '1h30' },
  { value: 120 * 60, label: '2 horas' },
]

export const SUBJECT_PRACTICE_QUESTION_PRESETS = [5, 10, 15, 20, 30, 45] as const

export type EnemYear = {
  year: number
  title: string
}

export type EnemSubjectArea = {
  area: string
  count: number
}

export type SimulationQuestion = {
  id: string
  year: number
  difficulty: string
  statement: string
  subjectName: string | null
  subjectArea: string | null
  alternatives: {
    id: string
    letter: string
    text: string
  }[]
}

export type SimulationAttempt = {
  id: string
  exam_year: number | null
  discipline: string
  disciplineLabel?: string
  attemptTitle?: string
  mode?: SimulationMode | string
  years_used?: number[]
  score: number
  total: number
  started_at: string
  finished_at?: string | null
  time_limit_seconds?: number | null
  elapsed_seconds?: number | null
}

export type SimulationAnswer = {
  question_id: string
  selected_option: string
  is_correct: boolean
  correct_option?: string | null
}

export type SimulationHistoryItem = SimulationAttempt

export type StartSimulationPayload = {
  mode: SimulationMode
  examYear?: number
  subjectArea?: string
  questionCount?: number | null
  timeLimitSeconds?: number | null
}

export type StartSimulationResponse = {
  attempt: SimulationAttempt
  questions: SimulationQuestion[]
}

export type SubmitSimulationResponse = {
  attempt: SimulationAttempt
  answers: SimulationAnswer[]
}

export type SimulationDetailResponse = {
  attempt: SimulationAttempt
  answers: SimulationAnswer[]
  questions: SimulationQuestion[] | null
}
