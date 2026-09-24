import { useCallback, useEffect, useState } from 'react'
import { TutorChatPanel } from '../components/tutor/TutorChatPanel'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import {
  createTutorSession,
  deleteTutorSession,
  fetchTutorSessions,
} from '../lib/tutor-api'
import type { TutorSession } from '../types/tutor'

function formatSessionDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sortSessions(items: TutorSession[]): TutorSession[] {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function TutorPage() {
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [sessions, setSessions] = useState<TutorSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    fetchTutorSessions(token)
      .then((data) => {
        const sorted = sortSessions(data)
        setSessions(sorted)
        if (sorted.length > 0) {
          setActiveSessionId((current) => current ?? sorted[0].id)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar sessões'))
      .finally(() => setLoading(false))
  }, [token])

  const handleSessionUpdated = useCallback((updated: TutorSession) => {
    setSessions((prev) =>
      sortSessions(prev.map((item) => (item.id === updated.id ? updated : item))),
    )
  }, [])

  async function handleNewSession() {
    if (!token || creating) return

    setCreating(true)
    setError(null)

    try {
      const created = await createTutorSession(token)
      setSessions((prev) => sortSessions([created, ...prev]))
      setActiveSessionId(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sessão')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!token || deletingId) return

    const confirmed = window.confirm('Excluir esta conversa? Esta ação não pode ser desfeita.')
    if (!confirmed) return

    setDeletingId(sessionId)
    setError(null)

    try {
      await deleteTutorSession(token, sessionId)
      setSessions((prev) => {
        const next = prev.filter((item) => item.id !== sessionId)
        setActiveSessionId((current) => {
          if (current !== sessionId) return current
          return next[0]?.id ?? null
        })
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conversa')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Tutor IA"
        title="Tire dúvidas com o Gemini"
        description="Converse sobre matérias, conteúdos e estratégias de estudo para o ENEM."
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-raised/90 p-4">
          <Button fullWidth className="mb-4" disabled={creating} onClick={() => void handleNewSession()}>
            {creating ? 'Criando...' : 'Nova conversa'}
          </Button>

          {loading ? (
            <p className="text-sm text-muted">Carregando sessões...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma conversa ainda.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((item) => {
                const isActive = item.id === activeSessionId

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-1 rounded-lg border transition ${
                      isActive
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-border-subtle hover:border-muted'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveSessionId(item.id)}
                      className="min-w-0 flex-1 px-3 py-2 text-left"
                    >
                      <p className="truncate text-sm font-medium text-white">
                        {item.title ?? 'Conversa'}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatSessionDate(item.updatedAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir conversa"
                      disabled={deletingId === item.id}
                      onClick={() => void handleDeleteSession(item.id)}
                      className="mr-2 mt-2 rounded px-1.5 py-0.5 text-xs text-muted hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </aside>

        <div className="min-h-[520px]">
          {activeSessionId ? (
            <TutorChatPanel
              mode="general"
              sessionId={activeSessionId}
              onSessionUpdated={handleSessionUpdated}
            />
          ) : (
            <div className="flex h-full min-h-[520px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised/30 p-6 text-center">
              <p className="max-w-sm text-sm text-muted">
                Crie uma nova conversa para começar a tirar dúvidas com o tutor IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
