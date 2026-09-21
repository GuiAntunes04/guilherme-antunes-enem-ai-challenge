export type EnemHubAlternative = {
  id: string
  letter: string
  text: string
  isCorrect: boolean
}

export type EnemHubSubject = {
  id: string
  name: string
  area: string | null
}

export type EnemHubQuestion = {
  id: string
  year: number
  difficulty: 'Fácil' | 'Média' | 'Difícil'
  statement: string
  correctAlternative: string | null
  exam: {
    id: string
    name: string
    institution: string | null
  }
  subject: EnemHubSubject | null
  alternatives: EnemHubAlternative[]
}

export type EnemHubListResponse = {
  data: EnemHubQuestion[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export type SanitizedQuestion = {
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
