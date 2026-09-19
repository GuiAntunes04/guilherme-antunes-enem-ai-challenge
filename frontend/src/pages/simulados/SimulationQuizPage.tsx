import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { QuestionCard } from '../../components/simulation/QuestionCard'
import { TutorChatPanel } from '../../components/tutor/TutorChatPanel'
import {
  getElapsedSeconds,
  SimulationTimer,
} from '../../components/simulation/SimulationTimer'
import { useAuth } from '../../contexts/AuthContext'
import {
  fetchSimulation,
  fetchSimulationQuestionBatch,
  submitSimulation,
} from '../../lib/simulations-api'
import type { SimulationAttempt, SimulationQuestion } from '../../types/simulation'
import { SIMULATION_QUESTION_BATCH_SIZE } from '../../types/simulation'

type QuizLocationState = {
  questions?: SimulationQuestion[]
  attempt?: SimulationAttempt
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function SimulationQuizPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const locationState = location.state as QuizLocationState | null
  const cachedQuestions = locationState?.questions
  const cachedAttempt = locationState?.attempt

  const [attempt, setAttempt] = useState<SimulationAttempt | null>(cachedAttempt ?? null)
  const [questions, setQuestions] = useState<SimulationQuestion[]>(cachedQuestions ?? [])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(!cachedQuestions?.length)
  const [loadProgress, setLoadProgress] = useState({ loaded: cachedQuestions?.length ?? 0, total: cachedAttempt?.total ?? 0 })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const expiredRef = useRef(false)
  const startedAtRef = useRef(cachedAttempt?.started_at ?? new Date().toISOString())
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (!token || !attemptId) return
    if (cachedQuestions?.length) return

    let cancelled = false

    async function loadQuestions() {
      setLoading(true)
      setError(null)

      try {
        let total = cachedAttempt?.total ?? 0
        let modeAttempt = cachedAttempt

        if (!modeAttempt) {
          const detail = await fetchSimulation(token, attemptId!)
          if (detail.attempt.finished_at) {
            navigate(`/simulados/${attemptId}/resultado`, { replace: true })
            return
          }
          modeAttempt = detail.attempt
        }

        if (!modeAttempt) {
          throw new Error('Simulado não encontrado')
        }

        total = modeAttempt.total
        setAttempt(modeAttempt)
        startedAtRef.current = modeAttempt.started_at
        setLoadProgress({ loaded: 0, total })

        const loadedQuestions: SimulationQuestion[] = []

        for (let from = 0; from < total; from += SIMULATION_QUESTION_BATCH_SIZE) {
          if (cancelled) return

          const batch = await fetchSimulationQuestionBatch(
            token,
            attemptId!,
            from,
            SIMULATION_QUESTION_BATCH_SIZE,
          )

          loadedQuestions.push(...batch.questions)
          setQuestions([...loadedQuestions])
          setLoadProgress({ loaded: loadedQuestions.length, total: batch.total })
        }

        if (loadedQuestions.length === 0) {
          throw new Error('Nenhuma questão foi carregada para este simulado')
        }
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

    void loadQuestions()

    return () => {
      cancelled = true
    }
  }, [token, attemptId, navigate, cachedQuestions, cachedAttempt])

  const submitAnswers = useCallback(
    async (force = false) => {
      if (!attemptId || submitting) return
      if (!force && Object.keys(answers).length !== questions.length) return

      setSubmitting(true)
      setError(null)

      try {
        const payload = questions
          .filter((q) => answers[q.id])
          .map((q) => ({
            questionId: q.id,
            selectedOption: answers[q.id],
          }))

        await submitSimulation(
          token,
          attemptId,
          payload,
          getElapsedSeconds(startedAtRef.current),
        )
        navigate(`/simulados/${attemptId}/resultado`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao enviar simulado')
        setSubmitting(false)
      }
    },
    [attemptId, submitting, answers, questions, token, navigate],
  )

  const handleExpire = useCallback(() => {
    if (expiredRef.current) return
    expiredRef.current = true
    void submitAnswers(true)
  }, [submitAnswers])

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const allAnswered = questions.length > 0 && answeredCount === questions.length

  if (loading) {
    return (
      <div className="max-w-md space-y-3">
        <p className="text-slate-300">Carregando questões...</p>
        {loadProgress.total > 0 && (
          <>
            <p className="text-sm text-slate-400">
              {loadProgress.loaded} de {loadProgress.total} questões
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.round((loadProgress.loaded / loadProgress.total) * 100)}%`,
                }}
              />
            </div>
          </>
        )}
      </div>
    )
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

  const tutorPanel = (
    <TutorChatPanel
      mode="simulation"
      attemptId={attemptId}
      question={currentQuestion}
      compact={!isDesktop}
    />
  )

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            Questão {currentIndex + 1} de {questions.length}
          </p>
          <p className="text-xs text-slate-500">
            {answeredCount} respondida{answeredCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {attempt?.time_limit_seconds && (
            <SimulationTimer
              startedAt={startedAtRef.current}
              timeLimitSeconds={attempt.time_limit_seconds}
              onExpire={handleExpire}
            />
          )}
          <Link to="/simulados" className="text-sm text-slate-400 hover:text-white">
            Cancelar
          </Link>
        </div>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
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
                onClick={() => void submitAnswers()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {submitting ? 'Enviando...' : 'Finalizar simulado'}
              </button>
            )}
          </div>

          {!isDesktop && <div className="mt-6">{tutorPanel}</div>}
        </div>

        {isDesktop && tutorPanel}
      </div>
    </div>
  )
}
