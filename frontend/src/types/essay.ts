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

export type EssayStatus = 'draft' | 'evaluating' | 'done'

export type EssaySource = 'redacao' | 'simulation'

export type Essay = {
  id: string
  theme: string
  motivators: string[]
  content: string
  source: EssaySource
  status: EssayStatus
  aiFeedback: EssayFeedback | null
  timeLimitSeconds: number | null
  elapsedSeconds: number | null
  quizStartedAt: string | null
  finishedAt: string | null
  createdAt: string
}

export const ESSAY_COMPETENCY_LABELS: Record<EssayCompetencyKey, string> = {
  c1: 'Competência I — Domínio da norma culta',
  c2: 'Competência II — Compreensão da proposta',
  c3: 'Competência III — Argumentação',
  c4: 'Competência IV — Mecanismos linguísticos',
  c5: 'Competência V — Proposta de intervenção',
}

export const MIN_ESSAY_CHARS = 150
