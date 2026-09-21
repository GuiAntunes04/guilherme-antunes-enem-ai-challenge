import { supabaseAdmin } from '../lib/supabase.js'
import type { EnemHubQuestion } from '../types/enemhub.js'
import type { QuestionIndexEntry } from '../types/question-index.js'
import {
  getKnowledgeAreasForDay,
  getSubjectQuotasForArea,
  resolveKnowledgeAreaFromSubject,
  type EnemKnowledgeArea,
} from '../lib/enem-knowledge-areas.js'
import { ENEM_AREA_ORDER, SUBJECT_PRACTICE_MAX_QUESTIONS } from '../types/simulation.js'
import { fetchQuestionsList, shuffleAndPick } from './enemhub-api.js'

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

export type PracticeSubjectOption = {
  name: string
  count: number
  knowledgeArea: string | null
}

export async function getSubjectNamesFromIndex(): Promise<PracticeSubjectOption[]> {
  await ensureIndexSynced()

  const counts = new Map<string, number>()

  for (let from = 0; ; from += INDEX_PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from('enem_questions_index')
      .select('subject_name')
      .not('subject_name', 'is', null)
      .range(from, from + INDEX_PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Failed to load subject names from index: ${error.message}`)
    }

    if (!data?.length) break

    for (const row of data) {
      const name = row.subject_name as string
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }

    if (data.length < INDEX_PAGE_SIZE) break
  }

  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      knowledgeArea: resolveKnowledgeAreaFromSubject(name),
    }))
    .sort((a, b) => {
      const areaCompare = knowledgeAreaOrder(a.name) - knowledgeAreaOrder(b.name)
      if (areaCompare !== 0) return areaCompare
      return a.name.localeCompare(b.name)
    })
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

export async function pickQuestionIdsBySubjectName(
  subjectName: string,
  count: number | null,
): Promise<{ ids: string[]; yearsUsed: number[] }> {
  const entries = await queryIndexEntries({ subjectNames: [subjectName] })

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

const DAY_SIMULATION_MAX_RETRIES = 15

function questionSetSignature(ids: string[]): string {
  return [...ids].sort().join('|')
}

export async function getUserDaySimulationSignatures(
  userId: string,
  mode: 'day_one' | 'day_two',
): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('simulation_attempts')
    .select('question_ids')
    .eq('user_id', userId)
    .eq('mode', mode)

  if (error) {
    throw new Error(`Failed to load previous day simulations: ${error.message}`)
  }

  const signatures = new Set<string>()

  for (const row of data ?? []) {
    const ids = row.question_ids as string[] | null
    if (ids?.length) {
      signatures.add(questionSetSignature(ids))
    }
  }

  return signatures
}

async function loadSubjectPoolsForArea(
  area: EnemKnowledgeArea,
): Promise<Map<string, QuestionIndexEntry[]>> {
  const quotas = getSubjectQuotasForArea(area)
  const subjectNames = Object.keys(quotas)
  const entries = await queryIndexEntries({ subjectNames })
  const pools = new Map<string, QuestionIndexEntry[]>()

  for (const name of subjectNames) {
    pools.set(
      name,
      entries.filter(
        (entry) =>
          entry.subject_name === name &&
          resolveKnowledgeAreaFromSubject(entry.subject_name) === area,
      ),
    )
  }

  return pools
}

async function pickDaySimulationEntries(
  mode: 'day_one' | 'day_two',
): Promise<{ entries: QuestionIndexEntry[]; missingSubjects: string[] }> {
  const areas = getKnowledgeAreasForDay(mode)
  const picked: QuestionIndexEntry[] = []
  const missingSubjects: string[] = []

  for (const area of areas) {
    const quotas = getSubjectQuotasForArea(area)
    const areaTarget = Object.values(quotas).reduce((sum, quota) => sum + quota, 0)
    const pools = await loadSubjectPoolsForArea(area)
    const areaPicked: QuestionIndexEntry[] = []
    const remaining: QuestionIndexEntry[] = []

    for (const [subjectName, quota] of Object.entries(quotas)) {
      const available = pools.get(subjectName) ?? []
      const selected = shuffleAndPick(available, Math.min(quota, available.length))
      areaPicked.push(...selected)

      const selectedIds = new Set(selected.map((entry) => entry.id))
      remaining.push(...available.filter((entry) => !selectedIds.has(entry.id)))
    }

    if (areaPicked.length < areaTarget) {
      const need = areaTarget - areaPicked.length
      const filler = shuffleAndPick(remaining, Math.min(need, remaining.length))
      areaPicked.push(...filler)

      if (areaPicked.length < areaTarget) {
        missingSubjects.push(
          `${area} (${areaPicked.length}/${areaTarget} questões no índice)`,
        )
      }
    }

    picked.push(...areaPicked)
  }

  return { entries: sortIndexLikeEnem(picked), missingSubjects }
}

export async function pickQuestionIdsForDaySimulation(
  mode: 'day_one' | 'day_two',
  userId: string,
): Promise<{ ids: string[]; yearsUsed: number[]; missingSubjects: string[] }> {
  const usedSignatures = await getUserDaySimulationSignatures(userId, mode)

  for (let attempt = 0; attempt < DAY_SIMULATION_MAX_RETRIES; attempt += 1) {
    const { entries, missingSubjects } = await pickDaySimulationEntries(mode)
    const ids = entries.map((entry) => entry.id)

    if (ids.length === 0) {
      return { ids: [], yearsUsed: [], missingSubjects }
    }

    const signature = questionSetSignature(ids)

    if (!usedSignatures.has(signature)) {
      const yearsUsed = [...new Set(entries.map((entry) => entry.year))].sort((a, b) => b - a)
      return { ids, yearsUsed, missingSubjects }
    }
  }

  throw new Error(
    'Não foi possível montar um simulado diferente dos anteriores. Tente novamente.',
  )
}
