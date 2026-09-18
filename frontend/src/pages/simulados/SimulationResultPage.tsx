import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QuestionCard } from '../../components/simulation/QuestionCard'
import { useAuth } from '../../contexts/AuthContext'
import { fetchSimulation } from '../../lib/simulations-api'
import type {
  SimulationAnswer,
  SimulationAttempt,
  SimulationQuestion,
} from '../../types/simulation'

export function SimulationResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [attempt, setAttempt] = useState<SimulationAttempt | null>(null)
  const [answers, setAnswers] = useState<SimulationAnswer[]>([])
  const [questions, setQuestions] = useState<SimulationQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !attemptId) return

    fetchSimulation(token, attemptId)
      .then((data) => {
        if (!data.attempt.finished_at) {
          throw new Error('Simulado ainda não finalizado')
        }

        setAttempt(data.attempt)
        setAnswers(data.answers)
        setQuestions(data.questions ?? [])
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar resultado'),
      )
      .finally(() => setLoading(false))
  }, [token, attemptId])

  if (loading) {
    return <p className="text-slate-400">Carregando resultado...</p>
  }

  if (error || !attempt) {
    return (
      <div>
        <p className="text-red-300">{error ?? 'Resultado não encontrado'}</p>
        <Link to="/simulados" className="mt-4 inline-block text-emerald-400 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  const percentage = Math.round((attempt.score / attempt.total) * 100)
  const answerMap = new Map(answers.map((a) => [a.question_id, a]))

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
          Resultado
        </p>
        <h1 className="text-3xl font-bold text-white">
          {attempt.score}/{attempt.total} acertos
        </h1>
        <p className="mt-2 text-slate-400">
          ENEM {attempt.exam_year} — {attempt.disciplineLabel ?? attempt.discipline} ·{' '}
          {percentage}% de aproveitamento
        </p>
      </div>

      <Link
        to="/simulados"
        className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Novo simulado
      </Link>

      {questions.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-white">Revisão das questões</h2>
          {questions.map((question) => {
            const answer = answerMap.get(question.id)
            return (
              <QuestionCard
                key={question.id}
                question={question}
                selectedOption={answer?.selected_option ?? null}
                onSelect={() => {}}
                showResult
                correctOption={answer?.correct_option}
              />
            )
          })}
        </section>
      )}
    </div>
  )
}
