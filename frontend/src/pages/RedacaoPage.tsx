import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EssayWorkbench } from '../components/essay/EssayWorkbench'
import { useAuth } from '../contexts/AuthContext'
import { fetchEssays, startEssay } from '../lib/essays-api'
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
      <div>
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
          Redação
        </p>
        <h1 className="text-3xl font-bold text-white">Corretor de redação ENEM</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Gere um tema aleatório, escreva sua dissertação ou importe por foto/documento e receba
          feedback nas 5 competências do ENEM.
        </p>
      </div>

      {!essayId ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            {error && (
              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={starting || !token}
              onClick={() => void handleNewTheme()}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {starting ? 'Gerando tema...' : 'Gerar novo tema'}
            </button>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-white">Suas redações</h2>
            {loadingHistory ? (
              <p className="mt-4 text-sm text-slate-400">Carregando histórico...</p>
            ) : history.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Nenhuma redação ainda.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {history.map((essay) => (
                  <button
                    key={essay.id}
                    type="button"
                    onClick={() => handleOpenEssay(essay)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 text-left transition hover:border-emerald-500/40"
                  >
                    <div>
                      <p className="font-medium text-white">{essay.theme}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {new Date(essay.createdAt).toLocaleDateString('pt-BR')}
                        {essay.status === 'done' && essay.aiFeedback
                          ? ` · ${essay.aiFeedback.nota_total}/1000`
                          : essay.status === 'draft'
                            ? ' · Rascunho'
                            : ' · Corrigindo...'}
                      </p>
                    </div>
                    <span className="text-sm text-emerald-400">Abrir</span>
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
            <button
              type="button"
              disabled={starting}
              onClick={() => void handleNewTheme()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              {starting ? 'Gerando...' : 'Novo tema'}
            </button>
            <button
              type="button"
              onClick={() => setEssayId(null)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              Voltar ao histórico
            </button>
            <Link to="/simulados" className="text-sm text-slate-400 hover:text-white">
              Ir para simulados
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
