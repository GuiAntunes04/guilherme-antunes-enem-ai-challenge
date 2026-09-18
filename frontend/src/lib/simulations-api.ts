import type {
  EnemArea,
  EnemSubject,
  EnemYear,
  SimulationDetailResponse,
  SimulationHistoryItem,
  StartSimulationPayload,
  StartSimulationResponse,
  SubmitSimulationResponse,
} from '../types/simulation'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function authFetch(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

async function parseError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => null)) as {
    error?: string
    message?: string
  } | null

  throw new Error(body?.message ?? body?.error ?? fallback)
}

export async function fetchEnemYears(token: string): Promise<EnemYear[]> {
  const response = await authFetch('/api/enem/years', token)

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar anos')
  }

  return response.json() as Promise<EnemYear[]>
}

export async function fetchEnemAreas(token: string, year: number): Promise<EnemArea[]> {
  const response = await authFetch(`/api/enem/areas?year=${year}`, token)

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar áreas')
  }

  return response.json() as Promise<EnemArea[]>
}

export async function fetchEnemSubjects(token: string, year: number): Promise<EnemSubject[]> {
  const response = await authFetch(`/api/enem/subjects?year=${year}`, token)

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar matérias')
  }

  return response.json() as Promise<EnemSubject[]>
}

export async function fetchSimulationHistory(
  token: string,
): Promise<SimulationHistoryItem[]> {
  const response = await authFetch('/api/simulations', token)

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar histórico')
  }

  return response.json() as Promise<SimulationHistoryItem[]>
}

export async function startSimulation(
  token: string,
  payload: StartSimulationPayload,
): Promise<StartSimulationResponse> {
  const response = await authFetch('/api/simulations/start', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao iniciar simulado')
  }

  return response.json() as Promise<StartSimulationResponse>
}

export async function fetchSimulation(
  token: string,
  attemptId: string,
): Promise<SimulationDetailResponse> {
  const response = await authFetch(`/api/simulations/${attemptId}`, token)

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
