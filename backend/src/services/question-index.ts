import { supabaseAdmin } from '../lib/supabase.js'
import type { EnemHubQuestion } from '../types/enemhub.js'
import type { EnemHubArea, EnemHubSubjectOption } from '../types/enemhub.js'
import type { QuestionIndexEntry } from '../types/question-index.js'
import {
  getSubjectNamesForKnowledgeArea,
  resolveKnowledgeAreaFromSubject,
  type EnemKnowledgeArea,
} from '../lib/enem-knowledge-areas.js'
import { ENEM_AREA_ORDER } from '../types/simulation.js'
import {
  AVAILABLE_YEARS,
  fetchQuestionsList,
  shuffleAndPick,
} from './enemhub-api.js'

const UPSERT_BATCH_SIZE = 200

export class QuestionIndexNotSyncedError extends Error {
  constructor() {
    super(
      'Índice de questões vazio. Execute npm run sync:questions no backend para sincronizar.',
    )
    this.name = 'QuestionIndexNotSyncedError'
  }
}

function toIndexRow(question: EnemHubQuestion) {
  return {
    id: question.id,
    year: question.year,
    subject_id: question.subject?.id ?? null,
    subject_name: question.subject?.name ?? null,
    subject_area: question.subject?.area ?? null,
    difficulty: question.difficulty,
    synced_at: new Date().toISOString(),
  }
}

function mapRow(row: QuestionIndexEntry): QuestionIndexEntry {
  return row
}

export async function getIndexCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('enem_questions_index')
    .select('id', { count: 'exact', head: true })

  if (error) {
    throw new Error(`Failed to count question index: ${error.message}`)
  }

  return count ?? 0
}

export async function ensureIndexSynced(): Promise<void> {
  const count = await getIndexCount()
  if (count === 0) {
    throw new QuestionIndexNotSyncedError()
  }
}

export async function syncQuestionIndex(): Promise<{ total: number; pages: number }> {
  const rows: ReturnType<typeof toIndexRow>[] = []
  let pages = 0

  for (let page = 1; ; page += 1) {
    const { data, meta } = await fetchQuestionsList({
      page: String(page),
      limit: '100',
    })

    pages += 1

    for (const question of data) {
      rows.push(toIndexRow(question))
    }

    if (rows.length >= meta.total || data.length === 0) break
  }

  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPSERT_BATCH_SIZE)
    const { error } = await supabaseAdmin
      .from('enem_questions_index')
      .upsert(batch, { onConflict: 'id' })

    if (error) {
      throw new Error(`Failed to upsert question index batch: ${error.message}`)
    }
  }

  return { total: rows.length, pages }
}

export async function getIndexedYears(): Promise<number[]> {
  await ensureIndexSynced()

  const { data, error } = await supabaseAdmin
    .from('enem_questions_index')
    .select('year')

  if (error) {
    throw new Error(`Failed to load indexed years: ${error.message}`)
  }

  const years = [...new Set((data ?? []).map((row) => row.year))]
  return years.sort((a, b) => b - a)
}

export async function getAreasFromIndex(year: number): Promise<EnemHubArea[]> {
  await ensureIndexSynced()

  const { data, error } = await supabaseAdmin
    .from('enem_questions_index')
    .select('subject_area')
    .eq('year', year)
    .not('subject_area', 'is', null)

  if (error) {
    throw new Error(`Failed to load areas from index: ${error.message}`)
  }

  const areas = [...new Set((data ?? []).map((row) => row.subject_area as string))]
  return areas.sort().map((area) => ({ area }))
}

export async function getSubjectsFromIndex(year: number): Promise<EnemHubSubjectOption[]> {
  await ensureIndexSynced()

  const { data, error } = await supabaseAdmin
    .from('enem_questions_index')
    .select('subject_id, subject_name, subject_area')
    .eq('year', year)
    .not('subject_id', 'is', null)

  if (error) {
    throw new Error(`Failed to load subjects from index: ${error.message}`)
  }

  const map = new Map<string, EnemHubSubjectOption>()

  for (const row of data ?? []) {
    if (row.subject_id) {
      map.set(row.subject_id, {
        id: row.subject_id,
        name: row.subject_name ?? 'Matéria',
        area: row.subject_area,
      })
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

async function queryIndexEntries(
  filters: {
    year?: number
    years?: number[]
    subjectArea?: string
    subjectId?: string
    subjectNames?: string[]
  },
): Promise<QuestionIndexEntry[]> {
  await ensureIndexSynced()

  let query = supabaseAdmin.from('enem_questions_index').select('*')

  if (filters.year !== undefined) {
    query = query.eq('year', filters.year)
  }

  if (filters.years?.length) {
    query = query.in('year', filters.years)
  }

  if (filters.subjectArea) {
    query = query.eq('subject_area', filters.subjectArea)
  }

  if (filters.subjectId) {
    query = query.eq('subject_id', filters.subjectId)
  }

  if (filters.subjectNames?.length) {
    query = query.in('subject_name', filters.subjectNames)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to query question index: ${error.message}`)
  }

  return (data ?? []).map(mapRow)
}

export function sortIndexWithinArea(entries: QuestionIndexEntry[]): QuestionIndexEntry[] {
  return [...entries].sort((a, b) => {
    const nameCompare = (a.subject_name ?? '').localeCompare(b.subject_name ?? '')
    if (nameCompare !== 0) return nameCompare
    return a.year - b.year
  })
}

function knowledgeAreaOrder(subjectName: string | null): number {
  const area = resolveKnowledgeAreaFromSubject(subjectName)
  if (!area) return ENEM_AREA_ORDER.length
  return ENEM_AREA_ORDER.indexOf(area)
}

export function sortIndexLikeEnem(entries: QuestionIndexEntry[]): QuestionIndexEntry[] {
  return [...entries].sort((a, b) => {
    const areaCompare = knowledgeAreaOrder(a.subject_name) - knowledgeAreaOrder(b.subject_name)
    if (areaCompare !== 0) return areaCompare
    const nameCompare = (a.subject_name ?? '').localeCompare(b.subject_name ?? '')
    if (nameCompare !== 0) return nameCompare
    return a.year - b.year
  })
}

export function pickFromIndex(
  entries: QuestionIndexEntry[],
  count: number,
  ordered: boolean,
): QuestionIndexEntry[] {
  const picked = shuffleAndPick(entries, Math.min(count, entries.length))
  return ordered ? sortIndexWithinArea(picked) : picked
}

export async function pickQuestionIdsByKnowledgeArea(
  year: number,
  knowledgeArea: EnemKnowledgeArea,
  count: number,
  ordered: boolean,
): Promise<string[]> {
  const subjectNames = getSubjectNamesForKnowledgeArea(knowledgeArea)
  const entries = await queryIndexEntries({ year, subjectNames })
  return pickFromIndex(entries, count, ordered).map((entry) => entry.id)
}

export async function pickQuestionIdsBySubject(
  year: number,
  subjectId: string,
  count: number,
): Promise<{ ids: string[]; subjectName: string }> {
  const entries = await queryIndexEntries({ year, subjectId })
  const picked = sortIndexWithinArea(
    shuffleAndPick(entries, Math.min(count, entries.length)),
  )
  return {
    ids: picked.map((entry) => entry.id),
    subjectName: entries[0]?.subject_name ?? 'Matéria',
  }
}

export async function pickQuestionIdsForDay(
  year: number,
  areas: EnemKnowledgeArea[],
  countPerArea: number,
): Promise<{ ids: string[]; missingAreas: EnemKnowledgeArea[] }> {
  const ids: string[] = []
  const missingAreas: EnemKnowledgeArea[] = []

  for (const area of areas) {
    const block = await pickQuestionIdsByKnowledgeArea(year, area, countPerArea, true)
    if (block.length === 0) {
      missingAreas.push(area)
    }
    ids.push(...block)
  }

  return { ids, missingAreas }
}

export { AVAILABLE_YEARS }
