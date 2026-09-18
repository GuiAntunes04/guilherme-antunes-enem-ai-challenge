const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export type Profile = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type MeResponse = {
  user: {
    id: string
    email?: string
  }
  profile: Profile
}

export type StatsResponse = {
  simulations: number
  essays: number
  tutorSessions: number
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const response = await fetch(`${API_URL}/api/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
      message?: string
    } | null

    throw new Error(body?.message ?? body?.error ?? 'Falha ao carregar perfil')
  }

  return response.json() as Promise<MeResponse>
}

export async function fetchStats(accessToken: string): Promise<StatsResponse> {
  const response = await fetch(`${API_URL}/api/stats`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Falha ao carregar estatísticas')
  }

  return response.json() as Promise<StatsResponse>
}
