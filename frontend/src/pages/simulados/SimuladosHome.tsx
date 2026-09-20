import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  fetchEnemSubjectAreas,
  fetchSimulationHistory,
  startSimulation,
} from '../../lib/simulations-api'
import type {
  EnemSubjectArea,
  SimulationHistoryItem,
  SimulationMode,
} from '../../types/simulation'
import {
  SIMULATION_MODES,
  SIMULATION_TIMER_OPTIONS,
  SUBJECT_PRACTICE_MAX_QUESTIONS,
  SUBJECT_PRACTICE_QUESTION_PRESETS,
  TIME_DAY_SECONDS,
  TIME_ESSAY_SECONDS,
} from '../../types/simulation'

function loadableQuestionCount(available: number): number {
  return Math.min(available, SUBJECT_PRACTICE_MAX_QUESTIONS)
}

function defaultQuestionSelection(available: number): number | 'all' {
  const loadable = loadableQuestionCount(available)
  if (loadable <= 0) return 10
  if (loadable < 5) return 'all'

  const preset = SUBJECT_PRACTICE_QUESTION_PRESETS.find((count) => count <= loadable)
  return preset ?? 'all'
}

function defaultTimerForMode(mode: SimulationMode): number | null {
  if (mode === 'day_one' || mode === 'day_two') {
    return TIME_DAY_SECONDS
  }
  if (mode === 'essay') {
    return TIME_ESSAY_SECONDS
  }
  return null
}

export function SimuladosHome() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [subjectAreas, setSubjectAreas] = useState<EnemSubjectArea[]>([])
  const [history, setHistory] = useState<SimulationHistoryItem[]>([])
  const [mode, setMode] = useState<SimulationMode>('subject_practice')
  const [subjectArea, setSubjectArea] = useState('')
  const [questionCount, setQuestionCount] = useState<number | 'all'>(10)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSubjectPractice = mode === 'subject_practice'
  const isDaySimulation = mode === 'day_one' || mode === 'day_two'
  const isEssaySimulation = mode === 'essay'

  const selectedSubjectArea = subjectAreas.find((item) => item.area === subjectArea)
  const availableCount = selectedSubjectArea?.count ?? 0
  const loadableCount = loadableQuestionCount(availableCount)

  const questionOptions = useMemo(() => {
    const presets = SUBJECT_PRACTICE_QUESTION_PRESETS.filter((count) => count <= loadableCount)
    return { presets, showAll: loadableCount > 0, loadableCount }
  }, [loadableCount])

  useEffect(() => {
    if (!token) return

    fetchSimulationHistory(token)
      .then(setHistory)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!token || !isSubjectPractice) return

    setLoadingMeta(true)
    setSubjectArea('')

    fetchEnemSubjectAreas(token)
      .then((areasData) => {
        setSubjectAreas(areasData)
        if (areasData.length > 0) {
          setSubjectArea(areasData[0].area)
          setQuestionCount(defaultQuestionSelection(areasData[0].count))
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar matérias'))
      .finally(() => setLoadingMeta(false))
  }, [token, isSubjectPractice])

  useEffect(() => {
    setTimeLimitSeconds(defaultTimerForMode(mode))
  }, [mode])

  useEffect(() => {
    if (!isSubjectPractice || loadableCount === 0) return

    if (questionCount === 'all') return

    if (questionCount > loadableCount) {
      setQuestionCount(defaultQuestionSelection(availableCount))
    }
  }, [isSubjectPractice, availableCount, loadableCount, questionCount])

  function handleSubjectAreaChange(nextArea: string) {
    setSubjectArea(nextArea)
    const next = subjectAreas.find((item) => item.area === nextArea)
    if (next) {
      setQuestionCount(defaultQuestionSelection(next.count))
    }
  }

  async function handleStart() {
    setError(null)
    setStarting(true)

    try {
      const payload = isSubjectPractice
        ? {
            mode,
            subjectArea,
            questionCount: questionCount === 'all' ? null : questionCount,
            timeLimitSeconds,
          }
        : {
            mode,
            timeLimitSeconds,
          }

      const { attempt } = await startSimulation(token, payload)
      const destination =
        mode === 'essay' ? `/simulados/${attempt.id}/redacao` : `/simulados/${attempt.id}`
      navigate(destination, {
        state: { attempt },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar simulado')
    } finally {
      setStarting(false)
    }
  }

  const canStart = isSubjectPractice
    ? !starting && !loadingMeta && Boolean(subjectArea) && availableCount > 0
    : !starting

  if (loading) {
    return <p className="text-slate-400">Carregando simulados...</p>
  }

  const selectedMode = SIMULATION_MODES.find((m) => m.value === mode)

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
          Simulados
        </p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Pratique com questões reais do ENEM
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Questões oficiais via EnemHub — pratique por tópico ou simule o 1º ou 2º dia completo
          com questões aleatórias de vários anos.
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Novo simulado</h2>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">Tipo de simulado</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as SimulationMode)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
            >
              {SIMULATION_MODES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} — {item.description}
                </option>
              ))}
            </select>
          </label>

          {selectedMode && (
            <p className="text-sm text-slate-500">{selectedMode.description}</p>
          )}

          {isDaySimulation && (
            <p className="text-sm text-slate-400">
              90 questões distribuídas por disciplina (padrão ENEM), sorteadas entre todos os
              anos disponíveis. Cada simulado é único em relação aos seus anteriores.
            </p>
          )}

          {isEssaySimulation && (
            <p className="text-sm text-slate-400">
              Tema gerado aleatoriamente pela IA. Escreva sua dissertação no tempo configurado e
              receba correção nas 5 competências do ENEM.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isSubjectPractice && (
              <>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm text-slate-300">Matéria</span>
                  <select
                    value={subjectArea}
                    onChange={(e) => handleSubjectAreaChange(e.target.value)}
                    disabled={loadingMeta || subjectAreas.length === 0}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
                  >
                    {loadingMeta ? (
                      <option value="">Carregando...</option>
                    ) : (
                      subjectAreas.map((item) => (
                        <option key={item.area} value={item.area}>
                          {item.area} ({item.count})
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Questões</span>
                  <select
                    value={questionCount === 'all' ? 'all' : String(questionCount)}
                    onChange={(e) => {
                      const value = e.target.value
                      setQuestionCount(value === 'all' ? 'all' : Number(value))
                    }}
                    disabled={loadingMeta || availableCount === 0}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
                  >
                    {questionOptions.presets.map((count) => (
                      <option key={count} value={count}>
                        {count} questões
                      </option>
                    ))}
                    {questionOptions.showAll && (
                      <option value="all">
                        Todas ({questionOptions.loadableCount}
                        {availableCount > SUBJECT_PRACTICE_MAX_QUESTIONS
                          ? ` de ${availableCount}`
                          : ''}
                        )
                      </option>
                    )}
                  </select>
                </label>
              </>
            )}

            {(isSubjectPractice || isDaySimulation || isEssaySimulation) && (
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Cronômetro</span>
                <select
                  value={timeLimitSeconds === null ? 'unlimited' : String(timeLimitSeconds)}
                  onChange={(e) => {
                    const value = e.target.value
                    setTimeLimitSeconds(value === 'unlimited' ? null : Number(value))
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                >
                  {SIMULATION_TIMER_OPTIONS.map((option) => (
                    <option
                      key={option.label}
                      value={option.value === null ? 'unlimited' : String(option.value)}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {starting
            ? isDaySimulation
              ? 'Montando simulado de 90 questões...'
              : `Buscando ${questionCount === 'all' ? questionOptions.loadableCount : questionCount} questões...`
            : 'Iniciar simulado'}
        </button>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Histórico</h2>

        {history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Nenhum simulado realizado ainda.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <Link
                key={item.id}
                to={`/simulados/${item.id}/resultado`}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 transition hover:border-emerald-500/40"
              >
                <div>
                  <p className="font-medium text-white">
                    {item.attemptTitle ?? (item.exam_year ? `ENEM ${item.exam_year}` : 'Simulado')}{' '}
                    — {item.disciplineLabel ?? item.discipline}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {new Date(item.finished_at!).toLocaleDateString('pt-BR')}
                    {item.elapsed_seconds
                      ? ` · ${Math.floor(item.elapsed_seconds / 60)} min`
                      : ''}
                  </p>
                </div>
                <p className="text-lg font-bold text-emerald-400">
                  {item.score}/{item.total}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
