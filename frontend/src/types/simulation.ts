import type { Essay } from './essay'

export type SimulationMode = 'subject_practice' | 'day_one' | 'day_two' | 'essay'

export type EnemForeignLanguage = 'Inglês' | 'Espanhol'

export const ENEM_FOREIGN_LANGUAGE_OPTIONS: { value: EnemForeignLanguage; label: string }[] = [
  { value: 'Inglês', label: 'Inglês' },
  { value: 'Espanhol', label: 'Espanhol' },
]

export const TIME_DAY_SECONDS = 270 * 60
export const TIME_ESSAY_SECONDS = 90 * 60
export const TIME_ESSAY_MAX_SECONDS = 120 * 60

export const SIMULATION_MODES: { value: SimulationMode; label: string; description: string }[] = [
  {
    value: 'subject_practice',
    label: 'Matéria específica',
    description: 'Questões aleatórias por conteúdo específico',
  },
  {
    value: 'day_one',
    label: '1º dia ENEM',
    description: '90 questões · Linguagens + Humanas',
  },
  {
    value: 'day_two',
    label: '2º dia ENEM',
    description: '90 questões · Natureza + Matemática',
  },
  {
    value: 'essay',
    label: 'Redação ENEM',
    description: 'Tema aleatório · dissertação · correção nas 5 competências',
  },
]

export const SIMULATION_TIMER_OPTIONS: {
  value: number | null
  label: string
}[] = [
  { value: null, label: 'Ilimitado' },
  { value: 30 * 60, label: '30 minutos' },
  { value: 60 * 60, label: '1 hora' },
  { value: 90 * 60, label: '1h30' },
  { value: 120 * 60, label: '2 horas' },
  { value: TIME_DAY_SECONDS, label: '4h30 (ENEM)' },
]

/** Redação: ilimitado ou até 2 horas (sem 4h30). */
export const ESSAY_TIMER_OPTIONS = SIMULATION_TIMER_OPTIONS.filter(
  (option) => option.value === null || option.value <= TIME_ESSAY_MAX_SECONDS,
)

export const SUBJECT_PRACTICE_MAX_QUESTIONS = 45
export const SUBJECT_PRACTICE_QUESTION_PRESETS = [5, 10, 15, 20, 30, 45] as const

export type EnemSubjectArea = {
  area: string
  count: number
  depth?: number
}

export type EnemPracticeSubject = {
  name: string
  count: number
  knowledgeArea: string | null
}

export type SubjectPracticeFilter = 'subject' | 'topic'

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
  quiz_started_at?: string | null
  essay_id?: string | null
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
  subjectArea?: string
  subjectName?: string
  foreignLanguage?: EnemForeignLanguage
  questionCount?: number | null
  timeLimitSeconds?: number | null
}

export type StartSimulationResponse = {
  attempt: SimulationAttempt
  questions: SimulationQuestion[]
  essay?: Essay | null
}

export type BeginSimulationResponse = {
  attempt: SimulationAttempt
}

export type SimulationQuestionsBatchResponse = {
  questions: SimulationQuestion[]
  total: number
  from: number
}

/** Max questions per load request (matches backend; full simulado loads in one call). */
export const SIMULATION_QUESTION_BATCH_SIZE = 90

export type SubmitSimulationResponse = {
  attempt: SimulationAttempt
  answers: SimulationAnswer[]
}

export type SimulationDetailResponse = {
  attempt: SimulationAttempt
  answers: SimulationAnswer[]
  questions: SimulationQuestion[] | null
  essay?: Essay | null
}
