export type SimulationMode = 'subject_practice' | 'day_one' | 'day_two' | 'essay'

export const SIMULATION_MODE_LABELS: Record<SimulationMode, string> = {
  subject_practice: 'Matéria específica',
  day_one: '1º dia ENEM (90 questões)',
  day_two: '2º dia ENEM (90 questões)',
  essay: 'Redação ENEM',
}

/** Labels for modes removed from the UI; kept for history display. */
export const LEGACY_SIMULATION_MODE_LABELS: Record<string, string> = {
  quick_practice: 'Prática rápida',
  area_full: 'Área completa (45 questões)',
  random_mixed: 'Aleatório',
}

export const ENEM_AREA_ORDER = [
  'Linguagens, Códigos e suas Tecnologias',
  'Ciências Humanas e suas Tecnologias',
  'Ciências da Natureza e suas Tecnologias',
  'Matemática e suas Tecnologias',
] as const

export const DAY_ONE_AREAS = [
  'Linguagens, Códigos e suas Tecnologias',
  'Ciências Humanas e suas Tecnologias',
]

export const DAY_TWO_AREAS = [
  'Ciências da Natureza e suas Tecnologias',
  'Matemática e suas Tecnologias',
]

/** Max questions loaded from EnemHub per subject-practice attempt (API quota). */
export const SUBJECT_PRACTICE_MAX_QUESTIONS = 45
export const TIME_DAY_SECONDS = 270 * 60
export const TIME_ESSAY_SECONDS = 90 * 60
export const TIME_ESSAY_MAX_SECONDS = 120 * 60

/** Redação: null = ilimitado; caso contrário cap em 2 horas. */
export function resolveEssayTimeLimitSeconds(
  raw: unknown,
  options: { defaultWhenMissing?: number | null } = {},
): number | null {
  if (raw === null) return null

  if (raw === undefined) {
    return options.defaultWhenMissing ?? null
  }

  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    return options.defaultWhenMissing ?? null
  }

  return Math.min(value, TIME_ESSAY_MAX_SECONDS)
}

export type EnemForeignLanguage = 'Inglês' | 'Espanhol'

export type StartSimulationBody = {
  mode: SimulationMode
  /** subject_area topic path from enem_questions_index (subject practice only) */
  subjectArea?: string
  /** ENEM discipline name, e.g. Matemática, História (subject practice only) */
  subjectName?: string
  /** Required for day_one: 5 opening questions from this language */
  foreignLanguage?: EnemForeignLanguage
  /** Omit or null = all questions for the subject area */
  questionCount?: number | null
  /** null or 0 = unlimited */
  timeLimitSeconds?: number | null
  /** Subject practice only; omit or all three = no filter */
  difficulties?: string[]
}
