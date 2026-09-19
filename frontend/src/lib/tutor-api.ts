import type {
  SendTutorMessageResponse,
  TutorMessagesResponse,
  TutorSession,
} from '../types/tutor'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function authFetch(
  path: string,
  token: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 30_000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...fetchOptions.headers,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`O servidor demorou mais de ${Math.round(timeoutMs / 1000)} segundos.`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function parseError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => null)) as {
    error?: string
    message?: string
  } | null

  throw new Error(body?.message ?? body?.error ?? fallback)
}

export async function fetchTutorSessions(token: string): Promise<TutorSession[]> {
  const response = await authFetch('/api/tutor/sessions', token)

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar sessões do tutor')
  }

  return response.json() as Promise<TutorSession[]>
}

export async function createTutorSession(
  token: string,
  title?: string,
): Promise<TutorSession> {
  const response = await authFetch('/api/tutor/sessions', token, {
    method: 'POST',
    body: JSON.stringify({ title }),
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao criar sessão do tutor')
  }

  return response.json() as Promise<TutorSession>
}

export async function getOrCreateSimulationTutorSession(
  token: string,
  attemptId: string,
  questionId: string,
): Promise<TutorSession> {
  const response = await authFetch('/api/tutor/sessions/simulation', token, {
    method: 'POST',
    body: JSON.stringify({ attemptId, questionId }),
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao iniciar tutor do simulado')
  }

  return response.json() as Promise<TutorSession>
}

export async function fetchTutorMessages(
  token: string,
  sessionId: string,
): Promise<TutorMessagesResponse> {
  const response = await authFetch(`/api/tutor/sessions/${sessionId}/messages`, token)

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar mensagens')
  }

  return response.json() as Promise<TutorMessagesResponse>
}

export async function sendTutorMessage(
  token: string,
  sessionId: string,
  content: string,
): Promise<SendTutorMessageResponse> {
  const response = await authFetch(`/api/tutor/sessions/${sessionId}/messages`, token, {
    method: 'POST',
    body: JSON.stringify({ content }),
    timeoutMs: 60_000,
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao enviar mensagem ao tutor')
  }

  return response.json() as Promise<SendTutorMessageResponse>
}
