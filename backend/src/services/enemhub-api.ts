import { env } from '../config/env.js'
import type {
  EnemHubListResponse,
  EnemHubQuestion,
  SanitizedQuestion,
} from '../types/enemhub.js'
import { resolveKnowledgeAreaFromSubject } from '../lib/enem-knowledge-areas.js'
import { ENEM_AREA_ORDER } from '../types/simulation.js'

const BASE_URL = 'https://api.enemhub.com.br/v1/enem/questions'
const MAX_RETRIES = 5
const FETCH_CONCURRENCY = 4
const FETCH_BATCH_DELAY_MS = 250

const questionCache = new Map<string, EnemHubQuestion>()

export const AVAILABLE_YEARS = [
  2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010,
  2009,
]

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function enemhubFetch(url: string): Promise<Response> {
  if (!env.enemhubApiKey) {
    throw new Error('ENEMHUB_API_KEY não configurada no backend')
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      headers: { 'X-API-Key': env.enemhubApiKey },
    })

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After') ?? 5)
      await sleep(Math.min(retryAfter, 15) * 1000)
      continue
    }

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`EnemHub API error ${response.status}: ${body}`)
    }

    return response
  }

  throw new Error(`EnemHub API rate limit persistente após ${MAX_RETRIES} tentativas`)
}

function buildListUrl(params: Record<string, string>): string {
  const url = new URL(BASE_URL)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

export async function fetchQuestionsList(
  params: Record<string, string>,
): Promise<EnemHubListResponse> {
  const response = await enemhubFetch(buildListUrl(params))
  return response.json() as Promise<EnemHubListResponse>
}

export async function fetchQuestionById(id: string): Promise<EnemHubQuestion> {
  const cached = questionCache.get(id)
  if (cached) return cached

  const response = await enemhubFetch(`${BASE_URL}/${id}`)
  const question = (await response.json()) as EnemHubQuestion
  questionCache.set(id, question)
  return question
}

export async function fetchQuestionsByIds(ids: string[]): Promise<EnemHubQuestion[]> {
  const uniqueIds = [...new Set(ids)]
  const results: EnemHubQuestion[] = []

  for (let offset = 0; offset < uniqueIds.length; offset += FETCH_CONCURRENCY) {
    const batch = uniqueIds.slice(offset, offset + FETCH_CONCURRENCY)
    const batchResults = await Promise.all(batch.map((id) => fetchQuestionById(id)))
    results.push(...batchResults)

    if (offset + FETCH_CONCURRENCY < uniqueIds.length) {
      await sleep(FETCH_BATCH_DELAY_MS)
    }
  }

  const resultMap = new Map(results.map((question) => [question.id, question]))
  return ids.flatMap((id) => {
    const question = resultMap.get(id)
    return question ? [question] : []
  })
}

export function cacheQuestions(questions: EnemHubQuestion[]): void {
  for (const question of questions) {
    questionCache.set(question.id, question)
  }
}

export function sanitizeQuestion(question: EnemHubQuestion): SanitizedQuestion {
  return {
    id: question.id,
    year: question.year,
    difficulty: question.difficulty,
    statement: question.statement,
    subjectName: question.subject?.name ?? null,
    subjectArea: question.subject?.area ?? null,
    alternatives: question.alternatives.map(({ id, letter, text }) => ({
      id,
      letter,
      text,
    })),
  }
}

export function shuffleAndPick<T>(items: T[], count: number): T[] {
  const copy = [...items]

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy.slice(0, count)
}

export function sortWithinArea(questions: EnemHubQuestion[]): EnemHubQuestion[] {
  return [...questions].sort((a, b) => {
    const nameCompare = (a.subject?.name ?? '').localeCompare(b.subject?.name ?? '')
    if (nameCompare !== 0) return nameCompare
    return a.year - b.year
  })
}

function knowledgeAreaOrder(subjectName: string | undefined): number {
  const area = resolveKnowledgeAreaFromSubject(subjectName)
  if (!area) return ENEM_AREA_ORDER.length
  return ENEM_AREA_ORDER.indexOf(area)
}

export function sortLikeEnem(questions: EnemHubQuestion[]): EnemHubQuestion[] {
  return [...questions].sort((a, b) => {
    const areaCompare =
      knowledgeAreaOrder(a.subject?.name) - knowledgeAreaOrder(b.subject?.name)
    if (areaCompare !== 0) return areaCompare
    const nameCompare = (a.subject?.name ?? '').localeCompare(b.subject?.name ?? '')
    if (nameCompare !== 0) return nameCompare
    return a.year - b.year
  })
}
