import type {
  BeginSimulationResponse,
  EnemSubjectArea,
  SimulationDetailResponse,
  SimulationHistoryItem,
  SimulationQuestionsBatchResponse,
  StartSimulationPayload,
  StartSimulationResponse,
  SubmitSimulationResponse,
} from '../types/simulation'
import { SIMULATION_QUESTION_BATCH_SIZE } from '../types/simulation'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

function resolveFetchError(error: unknown, timeoutMs: number): Error {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new Error(
        `O servidor demorou mais de ${Math.round(timeoutMs / 1000)} segundos. Tente novamente.`,
      )
    }

    const message = error.message.toLowerCase()
    if (
      message === 'fetch failed' ||
      message.includes('failed to fetch') ||
      message.includes('networkerror')
    ) {
      return new Error(
        `Não foi possível conectar ao backend em ${API_URL}. Confirme que o servidor está rodando (npm run dev no backend).`,
      )
    }

    return error
  }

  return new Error('Erro de conexão com o servidor')
}

type AuthFetchOptions = RequestInit & {
  timeoutMs?: number
}

async function authFetch(
  path: string,
  token: string,
  options: AuthFetchOptions = {},
): Promise<Response> {
  const { timeoutMs = 30_000, ...fetchOptions } = options

  try {
    return await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...fetchOptions.headers,
      },
    })
  } catch (error) {
    throw resolveFetchError(error, timeoutMs)
  }
}

async function parseError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => null)) as {
    error?: string
    message?: string
  } | null

  throw new Error(body?.message ?? body?.error ?? fallback)
}

export async function fetchEnemSubjectAreas(token: string): Promise<EnemSubjectArea[]> {
  const response = await authFetch('/api/enem/subject-areas', token)

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar matérias')
  }

  return response.json() as Promise<EnemSubjectArea[]>
}

export async function fetchSimulationHistory(
  token: string,
  status: 'finished' | 'in_progress' = 'finished',
): Promise<SimulationHistoryItem[]> {
  const params = new URLSearchParams({ status })
  const response = await authFetch(`/api/simulations?${params}`, token)

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar histórico')
  }

  return response.json() as Promise<SimulationHistoryItem[]>
}

/** Creates the attempt with question IDs only — content loads in batches on the quiz page. */
export async function startSimulation(
  token: string,
  payload: StartSimulationPayload,
): Promise<StartSimulationResponse> {
  const response = await authFetch('/api/simulations/start', token, {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: payload.mode === 'essay' ? 90_000 : 30_000,
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao iniciar simulado')
  }

  return response.json() as Promise<StartSimulationResponse>
}

export async function beginSimulationQuiz(
  token: string,
  attemptId: string,
): Promise<BeginSimulationResponse> {
  const response = await authFetch(`/api/simulations/${attemptId}/begin`, token, {
    method: 'POST',
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao iniciar cronômetro do simulado')
  }

  return response.json() as Promise<BeginSimulationResponse>
}

export async function fetchSimulationQuestionBatch(
  token: string,
  attemptId: string,
  from: number,
  count: number = SIMULATION_QUESTION_BATCH_SIZE,
): Promise<SimulationQuestionsBatchResponse> {
  const params = new URLSearchParams({
    from: String(from),
    count: String(count),
  })

  const response = await authFetch(
    `/api/simulations/${attemptId}/questions?${params.toString()}`,
    token,
    { timeoutMs: 90_000 },
  )

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar questões')
  }

  return response.json() as Promise<SimulationQuestionsBatchResponse>
}

export async function fetchSimulation(
  token: string,
  attemptId: string,
): Promise<SimulationDetailResponse> {
  const response = await authFetch(`/api/simulations/${attemptId}`, token, {
    timeoutMs: 120_000,
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar simulado')
  }

  return response.json() as Promise<SimulationDetailResponse>
}

export async function submitSimulation(
  token: string,
  attemptId: string,
  answers: { questionId: string; selectedOption: string }[],
  elapsedSeconds: number,
): Promise<SubmitSimulationResponse> {
  const response = await authFetch(`/api/simulations/${attemptId}/submit`, token, {
    method: 'POST',
    body: JSON.stringify({ answers, elapsedSeconds }),
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao enviar simulado')
  }

  return response.json() as Promise<SubmitSimulationResponse>
}
