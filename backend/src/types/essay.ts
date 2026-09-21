export type EssayCompetencyKey = 'c1' | 'c2' | 'c3' | 'c4' | 'c5'

export type EssayCompetencyFeedback = {
  nota: number
  feedback: string
}

export type EssayFeedback = {
  competencias: Record<EssayCompetencyKey, EssayCompetencyFeedback>
  nota_total: number
  comentario_geral: string
}

export type EssayTheme = {
  title: string
  motivators: string[]
}

export type EssaySource = 'redacao' | 'simulation'

export type EssayStatus = 'draft' | 'evaluating' | 'done'

export type EssayRow = {
  id: string
  user_id: string
  theme: string
  motivators: string[]
  content: string
  source: EssaySource
  status: EssayStatus
  ai_feedback: EssayFeedback | null
  time_limit_seconds: number | null
  elapsed_seconds: number | null
  quiz_started_at: string | null
  finished_at: string | null
  created_at: string
}
