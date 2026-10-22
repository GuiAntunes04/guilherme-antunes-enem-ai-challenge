import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EssayWorkbench } from '../components/essay/EssayWorkbench'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import { deleteEssay, fetchEssays, startEssay } from '../lib/essays-api'
import type { Essay } from '../types/essay'

function upsertEssay(list: Essay[], essay: Essay): Essay[] {
  return [essay, ...list.filter((item) => item.id !== essay.id)]
}

function isEssayInProgress(essay: Essay): boolean {
  return essay.status !== 'done'
}

export function RedacaoPage() {
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [essayId, setEssayId] = useState<string | null>(null)
  const [essays, setEssays] = useState<Essay[]>([])
  const [starting, setStarting] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const inProgress = useMemo(() => essays.filter(isEssayInProgress), [essays])
  const finished = useMemo(() => essays.filter((essay) => essay.status === 'done'), [essays])

  const openEssay = useMemo(
    () => (essayId ? essays.find((item) => item.id === essayId) : undefined),
    [essays, essayId],
  )

  useEffect(() => {
    if (!token) return

    fetchEssays(token, 'redacao')
      .then(({ essays: loaded }) => setEssays(loaded))
      .catch(() => {
        /* list is optional on first load */
      })
      .finally(() => setLoadingList(false))
  }, [token])

  async function handleNewTheme() {
    if (!token) return

    setStarting(true)
    setError(null)

    try {
      const { essay } = await startEssay(token)
      setEssayId(essay.id)
      setEssays((current) => upsertEssay(current, essay))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar tema')
    } finally {
      setStarting(false)
    }
  }

  function handleOpenEssay(id: string) {
    setEssayId(id)
  }

  function handleEssayEvaluated(essay: Essay) {
    setEssays((current) => upsertEssay(current, essay))
  }

  async function handleDeleteEssay(targetId: string) {
    if (!token || deletingId) return

    const confirmed = window.confirm(
      'Excluir esta redação? Esta ação não pode ser desfeita.',
    )
    if (!confirmed) return

    setDeletingId(targetId)
    setError(null)

    try {
      await deleteEssay(token, targetId)
      setEssays((current) => current.filter((item) => item.id !== targetId))
      setEssayId((current) => (current === targetId ? null : current))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir redação')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Redação"
        title="Corretor de redação ENEM"
        description="Gere um tema aleatório, escreva sua dissertação ou importe por foto/documento e receba feedback nas 5 competências do ENEM."
      />

      {!essayId ? (
        <div className="space-y-6">
          <div>
            {error && <Alert className="mb-4">{error}</Alert>}
            <Button disabled={starting || !token} onClick={() => void handleNewTheme()}>
              {starting ? 'Gerando tema...' : 'Gerar novo tema'}
            </Button>
          </div>

          {loadingList ? (
            <p className="text-sm text-muted">Carregando redações...</p>
          ) : (
            <>
              {inProgress.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground">Em andamento</h2>
                  <div className="mt-4 space-y-3">
                    {inProgress.map((essay) => (
                      <div
                        key={essay.id}
                        className="flex items-stretch overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 transition hover:border-amber-400/50"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenEssay(essay.id)}
                          className="flex min-w-0 flex-1 items-center justify-between px-5 py-4 text-left"
                        >
                          <div className="min-w-0 pr-4">
                            <p className="font-medium text-foreground">{essay.theme}</p>
                            <p className="mt-1 text-sm text-muted">
                              Iniciada em {new Date(essay.createdAt).toLocaleDateString('pt-BR')}
                              {essay.status === 'evaluating'
                                ? ' · Corrigindo...'
                                : ' · Rascunho'}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-medium text-amber-300">
                            Continuar
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label="Excluir redação em andamento"
                          disabled={deletingId === essay.id || essay.status === 'evaluating'}
                          onClick={() => void handleDeleteEssay(essay.id)}
                          className="shrink-0 border-l border-amber-500/20 px-4 text-sm text-muted transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
                        >
                          {deletingId === essay.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-lg font-semibold text-foreground">Histórico</h2>
                {finished.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">Nenhuma redação corrigida ainda.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {finished.map((essay) => (
                      <button
                        key={essay.id}
                        type="button"
                        onClick={() => handleOpenEssay(essay.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/90 px-5 py-4 text-left transition hover:border-accent/35"
                      >
                        <div className="min-w-0 pr-4">
                          <p className="font-medium text-foreground">{essay.theme}</p>
                          <p className="mt-1 text-sm text-muted">
                            {new Date(essay.finishedAt ?? essay.createdAt).toLocaleDateString(
                              'pt-BR',
                            )}
                            {essay.elapsedSeconds
                              ? ` · ${Math.floor(essay.elapsedSeconds / 60)} min`
                              : ''}
                          </p>
                        </div>
                        {essay.aiFeedback && (
                          <p className="shrink-0 text-lg font-bold text-accent">
                            {essay.aiFeedback.nota_total}/1000
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      ) : (
        <>
          {error && <Alert>{error}</Alert>}
          <EssayWorkbench
            key={essayId}
            token={token}
            essayId={essayId}
            onEvaluated={handleEssayEvaluated}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={starting}
              onClick={() => void handleNewTheme()}
            >
              {starting ? 'Gerando...' : 'Novo tema'}
            </Button>
            <Button variant="secondary" onClick={() => setEssayId(null)}>
              Voltar ao histórico
            </Button>
            {openEssay && isEssayInProgress(openEssay) && (
              <Button
                variant="danger"
                disabled={deletingId === essayId || openEssay.status === 'evaluating'}
                onClick={() => void handleDeleteEssay(essayId)}
              >
                {deletingId === essayId ? 'Excluindo...' : 'Excluir redação'}
              </Button>
            )}
            <Link to="/simulados" className="self-center text-sm text-muted hover:text-foreground">
              Ir para simulados
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
