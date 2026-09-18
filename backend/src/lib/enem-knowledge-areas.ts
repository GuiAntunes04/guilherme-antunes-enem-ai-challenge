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
