import type { Essay } from '../types/essay'

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

export async function startEssay(
  token: string,
  options: { timeLimitSeconds?: number | null } = {},
): Promise<{ essay: Essay }> {
  const response = await authFetch('/api/essays/start', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'redacao',
      timeLimitSeconds: options.timeLimitSeconds ?? null,
    }),
    timeoutMs: 60_000,
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao gerar tema de redação')
  }

  return response.json() as Promise<{ essay: Essay }>
}

export async function fetchEssay(token: string, essayId: string): Promise<{ essay: Essay }> {
  const response = await authFetch(`/api/essays/${essayId}`, token)

  if (!response.ok) {
    await parseError(response, 'Falha ao carregar redação')
  }

  return response.json() as Promise<{ essay: Essay }>
}

export async function saveEssayDraft(
  token: string,
  essayId: string,
  content: string,
): Promise<{ essay: Essay }> {
  const response = await authFetch(`/api/essays/${essayId}`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao salvar rascunho')
  }

  return response.json() as Promise<{ essay: Essay }>
}

export async function beginEssayQuiz(token: string, essayId: string): Promise<{ essay: Essay }> {
  const response = await authFetch(`/api/essays/${essayId}/begin`, token, {
    method: 'POST',
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao iniciar cronômetro')
  }

  return response.json() as Promise<{ essay: Essay }>
}

export async function importEssayFile(
  token: string,
  essayId: string,
  file: File,
): Promise<{ extractedText: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await authFetch(`/api/essays/${essayId}/import`, token, {
    method: 'POST',
    body: formData,
    timeoutMs: 90_000,
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao importar arquivo')
  }

  return response.json() as Promise<{ extractedText: string }>
}

export async function evaluateEssay(
  token: string,
  essayId: string,
  content: string,
  elapsedSeconds: number,
): Promise<{ essay: Essay }> {
  const response = await authFetch(`/api/essays/${essayId}/evaluate`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, elapsedSeconds }),
    timeoutMs: 120_000,
  })

  if (!response.ok) {
    await parseError(response, 'Falha ao corrigir redação')
  }

  return response.json() as Promise<{ essay: Essay }>
}
