import {
  DAY_ONE_AREAS,
  DAY_TWO_AREAS,
  ENEM_AREA_ORDER,
} from '../types/simulation.js'

export type EnemKnowledgeArea = (typeof ENEM_AREA_ORDER)[number]

/** EnemHub stores topic paths in subject.area; ENEM areas are inferred from subject.name. */
export const SUBJECT_NAMES_BY_ENEM_AREA: Record<EnemKnowledgeArea, readonly string[]> = {
  'Linguagens, Códigos e suas Tecnologias': [
    'Português',
    'Literatura',
    'Inglês',
    'Espanhol',
    'Artes',
    'Educação Física',
  ],
  'Ciências Humanas e suas Tecnologias': [
    'História',
    'Geografia',
    'Filosofia',
    'Sociologia',
  ],
  'Ciências da Natureza e suas Tecnologias': ['Biologia', 'Física', 'Química'],
  'Matemática e suas Tecnologias': ['Matemática'],
}

const SUBJECT_TO_ENEM_AREA = new Map<string, EnemKnowledgeArea>(
  ENEM_AREA_ORDER.flatMap((area) =>
    SUBJECT_NAMES_BY_ENEM_AREA[area].map((subject) => [subject, area]),
  ),
)

export function resolveKnowledgeAreaFromSubject(
  subjectName: string | null | undefined,
): EnemKnowledgeArea | null {
  if (!subjectName) return null
  return SUBJECT_TO_ENEM_AREA.get(subjectName.trim()) ?? null
}

export function getSubjectNamesForKnowledgeArea(area: EnemKnowledgeArea): string[] {
  return [...SUBJECT_NAMES_BY_ENEM_AREA[area]]
}

export function getKnowledgeAreasForDay(mode: 'day_one' | 'day_two'): EnemKnowledgeArea[] {
  return mode === 'day_one'
    ? ([...DAY_ONE_AREAS] as EnemKnowledgeArea[])
    : ([...DAY_TWO_AREAS] as EnemKnowledgeArea[])
}

/**
 * Official-like question counts per subject within each ENEM knowledge area (45 each).
 * EnemHub may omit some disciplines (e.g. Educação Física); shortfalls are filled from
 * other subjects in the same area during day simulation assembly.
 */
export const ENEM_SUBJECT_QUOTAS: Record<EnemKnowledgeArea, Record<string, number>> = {
  'Linguagens, Códigos e suas Tecnologias': {
    Português: 27,
    Literatura: 6,
    Inglês: 4,
    Espanhol: 4,
    Artes: 2,
    'Educação Física': 2,
  },
  'Ciências Humanas e suas Tecnologias': {
    História: 12,
    Geografia: 12,
    Filosofia: 10,
    Sociologia: 11,
  },
  'Ciências da Natureza e suas Tecnologias': {
    Biologia: 18,
    Física: 14,
    Química: 13,
  },
  'Matemática e suas Tecnologias': {
    Matemática: 45,
  },
}

export function getSubjectQuotasForArea(area: EnemKnowledgeArea): Record<string, number> {
  return { ...ENEM_SUBJECT_QUOTAS[area] }
}

export function getDaySimulationQuestionTarget(mode: 'day_one' | 'day_two'): number {
  return getKnowledgeAreasForDay(mode).reduce((total, area) => {
    const quotas = getSubjectQuotasForArea(area)
    return total + Object.values(quotas).reduce((sum, quota) => sum + quota, 0)
  }, 0)
}
