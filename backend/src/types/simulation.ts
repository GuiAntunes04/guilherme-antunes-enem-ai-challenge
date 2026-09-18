export type SimulationMode = 'subject_practice' | 'day_one' | 'day_two'

export const SIMULATION_MODE_LABELS: Record<SimulationMode, string> = {
  subject_practice: 'Matéria específica',
  day_one: '1º dia ENEM (90 questões)',
  day_two: '2º dia ENEM (90 questões)',
}

/** Labels for modes removed from the UI; kept for history display. */
export const LEGACY_SIMULATION_MODE_LABELS: Record<string, string> = {
  quick_practice: 'Prática rápida',
  area_full: 'Área completa (45 questões)',
  random_mixed: 'Aleatório multi-anos',
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

export const QUESTIONS_PER_AREA = 45
export const TIME_AREA_SECONDS = 90 * 60
export const TIME_DAY_SECONDS = 270 * 60

export type StartSimulationBody = {
  mode: SimulationMode
  examYear?: number
  subjectId?: string
  questionCount?: number
}
