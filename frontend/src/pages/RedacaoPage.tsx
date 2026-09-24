import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EssayWorkbench } from '../components/essay/EssayWorkbench'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import { fetchEssays, startEssay } from '../lib/essays-api'
import { cn } from '../lib/cn'
import type { Essay } from '../types/essay'

export function RedacaoPage() {
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [essayId, setEssayId] = useState<string | null>(null)
  const [history, setHistory] = useState<Essay[]>([])
  const [starting, setStarting] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    fetchEssays(token, 'redacao')
      .then(({ essays }) => setHistory(essays))
      .catch(() => {
        /* history is optional on first load */
      })
      .finally(() => setLoadingHistory(false))
  }, [token])

  async function handleNewTheme() {
    if (!token) return

    setStarting(true)
    setError(null)

    try {
      const { essay } = await startEssay(token)
      setEssayId(essay.id)
      setHistory((current) => [essay, ...current.filter((item) => item.id !== essay.id)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar tema')
    } finally {
      setStarting(false)
    }
  }

  function handleOpenEssay(essay: Essay) {
    setEssayId(essay.id)
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
          <Card padding="lg">
            {error && <Alert className="mb-4">{error}</Alert>}
            <Button disabled={starting || !token} onClick={() => void handleNewTheme()}>
              {starting ? 'Gerando tema...' : 'Gerar novo tema'}
            </Button>
          </Card>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Suas redações</h2>
            {loadingHistory ? (
              <p className="mt-4 text-sm text-muted">Carregando histórico...</p>
            ) : history.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nenhuma redação ainda.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {history.map((essay) => (
                  <button
                    key={essay.id}
                    type="button"
                    onClick={() => handleOpenEssay(essay)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-[var(--radius-card)] border border-border-subtle',
                      'bg-surface-raised/90 px-5 py-4 text-left transition hover:border-accent/35',
                    )}
                  >
                    <div>
                      <p className="font-medium text-foreground">{essay.theme}</p>
                      <p className="mt-1 text-sm text-muted">
                        {new Date(essay.createdAt).toLocaleDateString('pt-BR')}
                        {essay.status === 'done' && essay.aiFeedback
                          ? ` · ${essay.aiFeedback.nota_total}/1000`
                          : essay.status === 'draft'
                            ? ' · Rascunho'
                            : ' · Corrigindo...'}
                      </p>
                    </div>
                    <span className="text-sm text-accent">Abrir</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <>
          <EssayWorkbench key={essayId} token={token} essayId={essayId} />
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
            <Link to="/simulados" className="self-center text-sm text-muted hover:text-foreground">
              Ir para simulados
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
