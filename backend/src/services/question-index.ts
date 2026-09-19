import { supabaseAdmin } from '../lib/supabase.js'
import type { EnemHubQuestion } from '../types/enemhub.js'
import type { EnemHubArea, EnemHubSubjectOption } from '../types/enemhub.js'
import type { QuestionIndexEntry } from '../types/question-index.js'
import {
  getSubjectNamesForKnowledgeArea,
  resolveKnowledgeAreaFromSubject,
  type EnemKnowledgeArea,
} from '../lib/enem-knowledge-areas.js'
import { ENEM_AREA_ORDER, SUBJECT_PRACTICE_MAX_QUESTIONS } from '../types/simulation.js'
import {
  AVAILABLE_YEARS,
  fetchQuestionsList,
  shuffleAndPick,
} from './enemhub-api.js'

const UPSERT_BATCH_SIZE = 200
const INDEX_PAGE_SIZE = 1000

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

  const years = new Set<number>()

  for (let from = 0; ; from += INDEX_PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from('enem_questions_index')
      .select('year')
      .range(from, from + INDEX_PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Failed to load indexed years: ${error.message}`)
    }

    if (!data?.length) break

    for (const row of data) {
      years.add(row.year)
    }

    if (data.length < INDEX_PAGE_SIZE) break
  }

  return [...years].sort((a, b) => b - a)
}

export async function getSubjectAreasFromIndex(): Promise<
  { area: string; count: number }[]
> {
  await ensureIndexSynced()

  const counts = new Map<string, number>()

  for (let from = 0; ; from += INDEX_PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from('enem_questions_index')
      .select('subject_area')
      .not('subject_area', 'is', null)
      .range(from, from + INDEX_PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Failed to load subject areas from index: ${error.message}`)
    }

    if (!data?.length) break

    for (const row of data) {
      const area = row.subject_area as string
      counts.set(area, (counts.get(area) ?? 0) + 1)
    }

    if (data.length < INDEX_PAGE_SIZE) break
  }

  return [...counts.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => a.area.localeCompare(b.area))
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

  const rows: QuestionIndexEntry[] = []

  for (let from = 0; ; from += INDEX_PAGE_SIZE) {
    let query = supabaseAdmin
      .from('enem_questions_index')
      .select('*')
      .range(from, from + INDEX_PAGE_SIZE - 1)

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

    if (!data?.length) break

    rows.push(...data.map(mapRow))

    if (data.length < INDEX_PAGE_SIZE) break
  }

  return rows
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

function resolveSubjectPracticeLimit(
  requested: number | null,
  available: number,
): number {
  const cappedAvailable = Math.min(available, SUBJECT_PRACTICE_MAX_QUESTIONS)

  if (requested === null) {
    return cappedAvailable
  }

  return Math.min(requested, cappedAvailable)
}

export async function pickQuestionIdsBySubjectArea(
  subjectArea: string,
  count: number | null,
): Promise<{ ids: string[]; yearsUsed: number[] }> {
  const entries = await queryIndexEntries({ subjectArea })

  if (entries.length === 0) {
    return { ids: [], yearsUsed: [] }
  }

  const limit = resolveSubjectPracticeLimit(count, entries.length)
  const picked = shuffleAndPick(entries, limit)

  const yearsUsed = [...new Set(picked.map((entry) => entry.year))].sort((a, b) => b - a)

  return {
    ids: picked.map((entry) => entry.id),
    yearsUsed,
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
