import { quotePostgrestValue } from './topic-path.js'

export const ENEM_DIFFICULTY_ORDER = ['Fácil', 'Média', 'Difícil'] as const

export type EnemDifficulty = (typeof ENEM_DIFFICULTY_ORDER)[number]

export function normalizeIndexDifficulty(value: string | null | undefined): EnemDifficulty {
  if (value === 'Fácil' || value === 'Difícil') return value
  return 'Média'
}

export function isEnemDifficulty(value: string): value is EnemDifficulty {
  return (ENEM_DIFFICULTY_ORDER as readonly string[]).includes(value)
}

/** Undefined = no filter (all difficulties). */
export function parseDifficultyFilter(raw: unknown): EnemDifficulty[] | undefined {
  if (raw === undefined || raw === null) return undefined

  if (!Array.isArray(raw)) {
    throw new Error('difficulties must be an array')
  }

  const parsed: EnemDifficulty[] = []

  for (const item of raw) {
    const value = String(item).trim()
    if (!isEnemDifficulty(value)) {
      throw new Error('Dificuldade inválida')
    }
    if (!parsed.includes(value)) {
      parsed.push(value)
    }
  }

  if (parsed.length === 0) {
    throw new Error('Selecione ao menos uma dificuldade')
  }

  if (parsed.length === ENEM_DIFFICULTY_ORDER.length) {
    return undefined
  }

  return parsed
}

export function buildDifficultyOrFilter(difficulties: EnemDifficulty[]): string {
  const parts: string[] = []

  for (const difficulty of difficulties) {
    if (difficulty === 'Média') {
      parts.push('difficulty.eq.Média', 'difficulty.is.null')
    } else {
      parts.push(`difficulty.eq.${quotePostgrestValue(difficulty)}`)
    }
  }

  return parts.join(',')
}

export function emptyDifficultyCounts(): Record<EnemDifficulty, number> {
  return { Fácil: 0, Média: 0, Difícil: 0 }
}
