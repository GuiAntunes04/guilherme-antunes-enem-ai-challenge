import { env } from '../config/env.js'
import type {
  EnemHubListResponse,
  EnemHubQuestion,
  SanitizedQuestion,
} from '../types/enemhub.js'
import { resolveKnowledgeAreaFromSubject } from '../lib/enem-knowledge-areas.js'
import { ENEM_AREA_ORDER } from '../types/simulation.js'

const BASE_URL = 'https://api.enemhub.com.br/v1/enem/questions'
const MAX_RETRIES = 8
/** Parallel fetches per chunk; pause between chunks to avoid rate limits. */
const FETCH_CONCURRENCY = 4
const REQUEST_SPACING_MS = 150

const questionCache = new Map<string, EnemHubQuestion>()

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
      const backoffMs = Math.min(retryAfter * Math.pow(1.5, attempt), 30) * 1000
      await sleep(backoffMs)
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
  const resultMap = new Map<string, EnemHubQuestion>()

  for (let start = 0; start < uniqueIds.length; start += FETCH_CONCURRENCY) {
    const chunk = uniqueIds.slice(start, start + FETCH_CONCURRENCY)
    const results = await Promise.all(chunk.map((id) => fetchQuestionById(id)))

    for (let index = 0; index < chunk.length; index += 1) {
      resultMap.set(chunk[index], results[index])
    }

    if (start + FETCH_CONCURRENCY < uniqueIds.length) {
      await sleep(REQUEST_SPACING_MS)
    }
  }

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
