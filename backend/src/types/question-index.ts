import type { EnemHubAlternative } from './enemhub.js'

export type QuestionIndexContent = {
  statement: string
  alternatives: EnemHubAlternative[]
}

export type QuestionIndexEntry = {
  id: string
  year: number
  subject_id: string | null
  subject_name: string | null
  subject_area: string | null
  difficulty: string | null
  correct_alternative: string | null
  content: QuestionIndexContent | null
}

export type QuestionIndexRow = QuestionIndexEntry
