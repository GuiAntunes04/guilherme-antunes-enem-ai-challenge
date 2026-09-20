import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EssayFeedbackPanel } from '../../components/essay/EssayFeedbackPanel'
import { EssayThemePanel } from '../../components/essay/EssayThemePanel'
import { useAuth } from '../../contexts/AuthContext'
import { fetchSimulation } from '../../lib/simulations-api'
import type { Essay } from '../../types/essay'
import type { SimulationAttempt } from '../../types/simulation'

type EssayResultPageProps = {
  attemptId: string
}

export function EssayResultPage({ attemptId }: EssayResultPageProps) {
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [attempt, setAttempt] = useState<SimulationAttempt | null>(null)
  const [essay, setEssay] = useState<Essay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    fetchSimulation(token, attemptId)
      .then((data) => {
        if (!data.attempt.finished_at) {
          throw new Error('Simulado ainda não finalizado')
        }
        if (!data.essay?.aiFeedback) {
          throw new Error('Correção não encontrada')
        }

        setAttempt(data.attempt)
        setEssay(data.essay)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar resultado'))
      .finally(() => setLoading(false))
  }, [token, attemptId])

  if (loading) {
    return <p className="text-slate-400">Carregando resultado...</p>
  }

  if (error || !attempt || !essay?.aiFeedback) {
    return (
      <div>
        <p className="text-red-300">{error ?? 'Resultado não encontrado'}</p>
        <Link to="/simulados" className="mt-4 inline-block text-emerald-400 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
          Resultado
        </p>
        <h1 className="text-3xl font-bold text-white">
          {essay.aiFeedback.nota_total}/1000 pontos
        </h1>
        <p className="mt-2 text-slate-400">
          Redação ENEM
          {attempt.elapsed_seconds
            ? ` · ${Math.floor(attempt.elapsed_seconds / 60)} min`
            : ''}
        </p>
      </div>

      <EssayThemePanel theme={essay.theme} motivators={essay.motivators} />
      <EssayFeedbackPanel feedback={essay.aiFeedback} />

      <Link
        to="/simulados"
        className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Voltar aos simulados
      </Link>
    </div>
  )
}
