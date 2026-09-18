import { env } from '../config/env.js'
import type {
  EnemHubArea,
  EnemHubListResponse,
  EnemHubQuestion,
  SanitizedQuestion,
} from '../types/enemhub.js'

const BASE_URL = 'https://api.enemhub.com.br/v1/enem/questions'
const MAX_PAGE_SIZE = 100
const MAX_RETRIES = 3

const questionCache = new Map<string, EnemHubQuestion>()
const areasCache = new Map<number, EnemHubArea[]>()

export const AVAILABLE_YEARS = [
  2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010,
  2009,
]

async function enemhubFetch(url: string): Promise<Response> {
  if (!env.enemhubApiKey) {
    throw new Error('ENEMHUB_API_KEY não configurada no backend')
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      headers: { 'X-API-Key': env.enemhubApiKey },
    })

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After') ?? 60)
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
      continue
    }

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`EnemHub API error ${response.status}: ${body}`)
    }

    return response
  }

  throw new Error('EnemHub API rate limit persistente após 3 tentativas')
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

export async function fetchAllQuestionsForYear(year: number): Promise<EnemHubQuestion[]> {
  const all: EnemHubQuestion[] = []

  for (let page = 1; ; page += 1) {
    const { data, meta } = await fetchQuestionsList({
      year: String(year),
      page: String(page),
      limit: String(MAX_PAGE_SIZE),
    })

    all.push(...data)
    cacheQuestions(data)

    if (all.length >= meta.total || data.length === 0) break
  }

  return all
}

export async function fetchQuestionsByIds(ids: string[]): Promise<EnemHubQuestion[]> {
  return Promise.all(ids.map((id) => fetchQuestionById(id)))
}

export async function fetchAreas(year: number): Promise<EnemHubArea[]> {
  const cached = areasCache.get(year)
  if (cached) return cached

  const all = await fetchAllQuestionsForYear(year)
  const areaSet = new Set<string>()

  for (const question of all) {
    if (question.subject?.area) {
      areaSet.add(question.subject.area)
    }
  }

  const areas = [...areaSet].sort().map((area) => ({ area }))
  areasCache.set(year, areas)
  return areas
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
