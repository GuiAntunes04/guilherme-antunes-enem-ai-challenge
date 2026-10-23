import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { type BlockerFunction, useBlocker } from 'react-router'
import { LayoutGrid } from 'lucide-react'
import { ConfirmLeaveSimulationDialog } from '../../components/simulation/ConfirmLeaveSimulationDialog'
import { SimulationGabaritoDrawer } from '../../components/simulation/SimulationGabaritoDrawer'
import { QuestionCard } from '../../components/simulation/QuestionCard'
import {
  formatTime,
  getElapsedSeconds,
  SimulationTimer,
} from '../../components/simulation/SimulationTimer'
import { TutorChatPanel } from '../../components/tutor/TutorChatPanel'
import { useAuth } from '../../contexts/AuthContext'
import {
  useSimulationLeaveGuard,
  useSimulationQuizSidebar,
} from '../../contexts/SimulationQuizContext'
import {
  beginSimulationQuiz,
  fetchSimulation,
  fetchSimulationQuestionBatch,
  submitSimulation,
} from '../../lib/simulations-api'
import type { TutorMessage } from '../../types/tutor'
import { cn } from '../../lib/cn'
import type { SimulationAttempt, SimulationQuestion } from '../../types/simulation'

const TUTOR_COLLAPSED_KEY = 'enem-prep-tutor-collapsed'

function readTutorCollapsed(): boolean {
  try {
    return localStorage.getItem(TUTOR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

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

function getQuizTimerStartedAt(attempt: SimulationAttempt): string | null {
  return attempt.quiz_started_at ?? null
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
  const [loadProgress, setLoadProgress] = useState({
    loaded: cachedQuestions?.length ?? 0,
    total: cachedAttempt?.total ?? 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizStartedAt, setQuizStartedAt] = useState<string | null>(
    cachedAttempt ? getQuizTimerStartedAt(cachedAttempt) : null,
  )
  const expiredRef = useRef(false)
  const quizStartedAtRef = useRef<string | null>(quizStartedAt)
  const tutorSimulationCache = useRef(
    new Map<string, { sessionId: string; messages: TutorMessage[] }>(),
  )
  const questionScrollRef = useRef<HTMLDivElement>(null)
  const allowLeaveRef = useRef(false)
  const pendingLeaveRef = useRef<'blocker' | 'manual' | null>(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [gabaritoOpen, setGabaritoOpen] = useState(false)
  const [tutorCollapsed, setTutorCollapsed] = useState(readTutorCollapsed)

  useEffect(() => {
    quizStartedAtRef.current = quizStartedAt
  }, [quizStartedAt])

  useEffect(() => {
    try {
      localStorage.setItem(TUTOR_COLLAPSED_KEY, String(tutorCollapsed))
    } catch {
      /* ignore quota / private mode */
    }
  }, [tutorCollapsed])

  useEffect(() => {
    if (loading || questions.length === 0) return

    if (isDesktop) {
      questionScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [currentIndex, loading, questions.length, isDesktop])

  useEffect(() => {
    if (!token || !attemptId) return

    let cancelled = false

    async function ensureQuizStarted(modeAttempt: SimulationAttempt): Promise<string> {
      const existing = getQuizTimerStartedAt(modeAttempt)
      if (existing) {
        setQuizStartedAt(existing)
        return existing
      }

      const { attempt: begun } = await beginSimulationQuiz(token, attemptId!)
      if (cancelled) return begun.quiz_started_at ?? begun.started_at

      setAttempt(begun)
      const startedAt = begun.quiz_started_at ?? begun.started_at
      setQuizStartedAt(startedAt)
      return startedAt
    }

    async function bootstrap() {
      setLoading(true)
      setError(null)

      try {
        let modeAttempt = cachedAttempt ?? null

        if (!modeAttempt) {
          const detail = await fetchSimulation(token, attemptId!)
          if (cancelled) return

          if (detail.attempt.finished_at) {
            navigate(`/simulados/${attemptId}/resultado`, { replace: true })
            return
          }

          modeAttempt = detail.attempt
        }

        if (!modeAttempt) {
          throw new Error('Simulado não encontrado')
        }

        setAttempt(modeAttempt)

        const resumedAt = getQuizTimerStartedAt(modeAttempt)
        if (resumedAt) {
          setQuizStartedAt(resumedAt)
        }

        if (cachedQuestions?.length) {
          setQuestions(cachedQuestions)
          setLoadProgress({ loaded: cachedQuestions.length, total: modeAttempt.total })
        } else {
          const total = modeAttempt.total
          setLoadProgress({ loaded: 0, total })

          const batch = await fetchSimulationQuestionBatch(
            token,
            attemptId!,
            0,
            total,
          )

          if (cancelled) return

          if (batch.questions.length === 0) {
            throw new Error('Nenhuma questão foi carregada para este simulado')
          }

          setQuestions(batch.questions)
          setLoadProgress({ loaded: batch.questions.length, total: batch.total })
        }

        if (cancelled) return

        await ensureQuizStarted(modeAttempt)
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

    void bootstrap()

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

        const timerStart = quizStartedAtRef.current ?? attempt?.started_at
        const elapsedSeconds = timerStart ? getElapsedSeconds(timerStart) : 0

        await submitSimulation(token, attemptId, payload, elapsedSeconds)
        navigate(`/simulados/${attemptId}/resultado`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao enviar simulado')
        setSubmitting(false)
      }
    },
    [attemptId, submitting, answers, questions, token, navigate, attempt?.started_at],
  )

  const handleExpire = useCallback(() => {
    if (expiredRef.current) return
    expiredRef.current = true
    void submitAnswers(true)
  }, [submitAnswers])

  const goToQuestion = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const sidebarState = useMemo(() => {
    if (loading || questions.length === 0) return null

    return {
      total: questions.length,
      currentIndex,
      answers,
      questionIds: questions.map((question) => question.id),
      goToQuestion,
    }
  }, [loading, questions, currentIndex, answers, goToQuestion])

  useSimulationQuizSidebar(sidebarState)

  const guardActive = !loading && questions.length > 0 && !submitting
  useSimulationLeaveGuard(guardActive)

  const shouldBlockNavigation = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (allowLeaveRef.current || !guardActive || !attemptId) return false

      const quizPath = `/simulados/${attemptId}`
      const onQuizPage =
        currentLocation.pathname === quizPath ||
        currentLocation.pathname === `${quizPath}/`

      if (!onQuizPage) return false
      if (nextLocation.pathname.startsWith(`${quizPath}/resultado`)) return false

      return nextLocation.pathname !== currentLocation.pathname
    },
    [guardActive, attemptId],
  )

  const blocker = useBlocker(shouldBlockNavigation)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      pendingLeaveRef.current = 'blocker'
      setLeaveDialogOpen(true)
    }
  }, [blocker.state])

  useEffect(() => {
    if (!guardActive) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [guardActive])

  const requestLeaveSimulado = useCallback(() => {
    pendingLeaveRef.current = 'manual'
    setLeaveDialogOpen(true)
  }, [])

  const stayOnSimulado = useCallback(() => {
    setLeaveDialogOpen(false)
    pendingLeaveRef.current = null
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  const confirmLeaveSimulado = useCallback(() => {
    setLeaveDialogOpen(false)
    const pending = pendingLeaveRef.current
    pendingLeaveRef.current = null

    if (pending === 'manual') {
      allowLeaveRef.current = true
      navigate('/simulados')
      return
    }

    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }, [blocker, navigate])

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const allAnswered = questions.length > 0 && answeredCount === questions.length

  const timerPanel =
    attempt?.time_limit_seconds && quizStartedAt ? (
      <SimulationTimer
        startedAt={quizStartedAt}
        timeLimitSeconds={attempt.time_limit_seconds}
        onExpire={handleExpire}
      />
    ) : attempt?.time_limit_seconds ? (
      <div className="rounded-lg border border-border bg-surface-overlay px-3 py-1.5 text-sm font-mono tabular-nums text-muted">
        {formatTime(attempt.time_limit_seconds)}
      </div>
    ) : null

  if (loading) {
    return (
      <div className="max-w-md space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Carregando questões...</p>
          {timerPanel}
        </div>
        {!quizStartedAt && attempt?.time_limit_seconds && (
          <p className="text-xs text-muted">
            O cronômetro inicia quando todas as questões estiverem prontas.
          </p>
        )}
        {loadProgress.total > 0 && (
          <>
            <p className="text-sm text-muted">
              {loadProgress.loaded} de {loadProgress.total} questões
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-overlay">
              <div
                className="h-full bg-accent transition-all"
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
        <Link to="/simulados" className="mt-4 inline-block text-accent hover:underline">
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
      docked={isDesktop}
      collapsed={tutorCollapsed}
      onToggleCollapsed={isDesktop ? () => setTutorCollapsed((c) => !c) : undefined}
      simulationCache={tutorSimulationCache}
    />
  )

  const quizHeader = (
    <>
      <div className={cn('flex items-center justify-between gap-4', isDesktop ? 'mb-4 shrink-0' : 'mb-6')}>
        <div>
          <p className="text-sm text-muted">
            Questão {currentIndex + 1} de {questions.length}
          </p>
          <p className="text-xs text-muted">
            {answeredCount} respondida{answeredCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {sidebarState && (
            <button
              type="button"
              onClick={() => setGabaritoOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-overlay px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              Gabarito
            </button>
          )}
          {timerPanel}
          <button
            type="button"
            onClick={requestLeaveSimulado}
            className="text-sm text-muted hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      </div>

      <div
        className={cn(
          'h-1.5 overflow-hidden rounded-full bg-surface-overlay',
          isDesktop ? 'mb-4 shrink-0' : 'mb-4',
        )}
      >
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>
    </>
  )

  const questionBody = (
    <>
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
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-40"
        >
          Anterior
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="rounded-lg bg-surface-overlay px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
          >
            Próxima
          </button>
        ) : (
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={() => void submitAnswers()}
            className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Finalizar simulado'}
          </button>
        )}
      </div>

      {!isDesktop && <div className="mt-6">{tutorPanel}</div>}
    </>
  )

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-6xl',
        isDesktop && 'flex min-h-0 flex-1 flex-col',
      )}
    >
      {quizHeader}

      {isDesktop ? (
        <div className="flex min-h-0 flex-1 gap-6">
          <div
            ref={questionScrollRef}
            className="min-w-0 flex-1 overflow-y-auto pr-1 scroll-mt-4"
          >
            {questionBody}
          </div>
          <div
            className={cn(
              'hidden shrink-0 transition-[width] duration-200 ease-out motion-reduce:transition-none lg:block',
              tutorCollapsed ? 'w-[4.5rem]' : 'w-[340px]',
            )}
          >
            {tutorPanel}
          </div>
        </div>
      ) : (
        <div ref={questionScrollRef} className="scroll-mt-4">
          {questionBody}
        </div>
      )}

      {sidebarState && (
        <SimulationGabaritoDrawer
          open={gabaritoOpen}
          onClose={() => setGabaritoOpen(false)}
          total={sidebarState.total}
          currentIndex={sidebarState.currentIndex}
          answers={sidebarState.answers}
          questionIds={sidebarState.questionIds}
          goToQuestion={sidebarState.goToQuestion}
        />
      )}

      <ConfirmLeaveSimulationDialog
        open={leaveDialogOpen}
        onStay={stayOnSimulado}
        onLeave={confirmLeaveSimulado}
      />
    </div>
  )
}
