export type EnemYear = {
  year: number
  title: string
}

export type EnemArea = {
  area: string
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
  exam_year: number
  discipline: string
  disciplineLabel?: string
  score: number
  total: number
  started_at: string
  finished_at?: string | null
}

export type SimulationAnswer = {
  question_id: string
  selected_option: string
  is_correct: boolean
  correct_option?: string | null
}

export type SimulationHistoryItem = SimulationAttempt

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
