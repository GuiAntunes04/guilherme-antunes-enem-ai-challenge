export type SimulationMode = 'subject_practice' | 'day_one' | 'day_two'

export const SIMULATION_MODES: { value: SimulationMode; label: string; description: string }[] = [
  {
    value: 'subject_practice',
    label: 'Matéria específica',
    description: 'Questões de uma matéria, com quantidade configurável',
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

export type EnemYear = {
  year: number
  title: string
}

export type EnemArea = {
  area: string
}

export type EnemSubject = {
  id: string
  name: string
  area: string | null
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
  subjectId?: string
  questionCount?: number
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
