import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EssayWorkbench } from '../../components/essay/EssayWorkbench'
import { useAuth } from '../../contexts/AuthContext'
import { fetchSimulation } from '../../lib/simulations-api'

export function EssaySimulationPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [essayId, setEssayId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !attemptId) return

    let cancelled = false

    async function load() {
      try {
        const data = await fetchSimulation(token, attemptId!)
        if (cancelled) return

        if (data.attempt.finished_at) {
          navigate(`/simulados/${attemptId}/resultado`, { replace: true })
          return
        }

        if (data.attempt.mode !== 'essay' || !data.essay?.id) {
          throw new Error('Simulado de redação inválido')
        }

        setEssayId(data.essay.id)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar simulado')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token, attemptId, navigate])

  if (loading) {
    return <p className="text-muted">Preparando simulado de redação...</p>
  }

  if (error || !essayId || !attemptId) {
    return (
      <div>
        <p className="text-red-300">{error ?? 'Simulado não encontrado'}</p>
        <Link to="/simulados" className="mt-4 inline-block text-accent hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Simulado de Redação ENEM</p>
          <h1 className="text-2xl font-bold text-white">Prova discursiva</h1>
        </div>
        <Link to="/simulados" className="text-sm text-muted hover:text-foreground">
          Cancelar
        </Link>
      </div>

      <EssayWorkbench
        token={token}
        essayId={essayId}
        timed
        onEvaluated={() => navigate(`/simulados/${attemptId}/resultado`)}
      />
    </div>
  )
}
