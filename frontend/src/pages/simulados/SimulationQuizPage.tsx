import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { QuestionCard } from '../../components/simulation/QuestionCard'
import { useAuth } from '../../contexts/AuthContext'
import { fetchSimulation, submitSimulation } from '../../lib/simulations-api'
import type { SimulationQuestion } from '../../types/simulation'

type QuizLocationState = {
  questions?: SimulationQuestion[]
}

export function SimulationQuizPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const cachedQuestions = (location.state as QuizLocationState | null)?.questions

  const [questions, setQuestions] = useState<SimulationQuestion[]>(cachedQuestions ?? [])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(!cachedQuestions?.length)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !attemptId) return
    if (cachedQuestions?.length) return

    fetchSimulation(token, attemptId)
      .then((data) => {
        if (data.attempt.finished_at) {
          navigate(`/simulados/${attemptId}/resultado`, { replace: true })
          return
        }

        if (!data.questions?.length) {
          throw new Error('Questões não encontradas para este simulado')
        }

        setQuestions(data.questions)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar simulado'),
      )
      .finally(() => setLoading(false))
  }, [token, attemptId, navigate, cachedQuestions])

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const allAnswered = questions.length > 0 && answeredCount === questions.length

  async function handleSubmit() {
    if (!attemptId || !allAnswered) return

    setSubmitting(true)
    setError(null)

    try {
      await submitSimulation(
        token,
        attemptId,
        questions.map((q) => ({
          questionId: q.id,
          selectedOption: answers[q.id],
        })),
      )
      navigate(`/simulados/${attemptId}/resultado`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar simulado')
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-slate-400">Carregando questões...</p>
  }

  if (error && questions.length === 0) {
    return (
      <div>
        <p className="text-red-300">{error}</p>
        <Link to="/simulados" className="mt-4 inline-block text-emerald-400 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            Questão {currentIndex + 1} de {questions.length}
          </p>
          <p className="text-xs text-slate-500">
            {answeredCount} respondida{answeredCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/simulados" className="text-sm text-slate-400 hover:text-white">
          Cancelar
        </Link>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <QuestionCard
        question={currentQuestion}
        selectedOption={answers[currentQuestion.id] ?? null}
        onSelect={(option) =>
          setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }))
        }
      />

      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
        >
          Anterior
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Próxima
          </button>
        ) : (
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={handleSubmit}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Finalizar simulado'}
          </button>
        )}
      </div>
    </div>
  )
}
