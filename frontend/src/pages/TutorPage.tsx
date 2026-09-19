import { useEffect, useState } from 'react'
import { TutorChatPanel } from '../components/tutor/TutorChatPanel'
import { useAuth } from '../contexts/AuthContext'
import { createTutorSession, fetchTutorSessions } from '../lib/tutor-api'
import type { TutorSession } from '../types/tutor'

function formatSessionDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TutorPage() {
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [sessions, setSessions] = useState<TutorSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    fetchTutorSessions(token)
      .then((data) => {
        setSessions(data)
        if (data.length > 0) {
          setActiveSessionId((current) => current ?? data[0].id)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar sessões'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleNewSession() {
    if (!token || creating) return

    setCreating(true)
    setError(null)

    try {
      const created = await createTutorSession(token)
      setSessions((prev) => [created, ...prev])
      setActiveSessionId(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sessão')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
          Tutor IA
        </p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Tire dúvidas com o Gemini
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Converse sobre matérias, conteúdos e estratégias de estudo para o ENEM.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <button
            type="button"
            onClick={() => void handleNewSession()}
            disabled={creating}
            className="mb-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {creating ? 'Criando...' : 'Nova conversa'}
          </button>

          {loading ? (
            <p className="text-sm text-slate-400">Carregando sessões...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma conversa ainda.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((item) => {
                const isActive = item.id === activeSessionId

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSessionId(item.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      isActive
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-white">
                      {item.title ?? 'Conversa'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatSessionDate(item.updatedAt)}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        <div className="min-h-[520px]">
          {activeSessionId ? (
            <TutorChatPanel mode="general" sessionId={activeSessionId} />
          ) : (
            <div className="flex h-full min-h-[520px] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center">
              <p className="max-w-sm text-sm text-slate-400">
                Crie uma nova conversa para começar a tirar dúvidas com o tutor IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
