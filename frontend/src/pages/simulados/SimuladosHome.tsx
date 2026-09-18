import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  fetchEnemSubjects,
  fetchEnemYears,
  fetchSimulationHistory,
  startSimulation,
} from '../../lib/simulations-api'
import type {
  EnemSubject,
  EnemYear,
  SimulationHistoryItem,
  SimulationMode,
} from '../../types/simulation'
import { SIMULATION_MODES } from '../../types/simulation'

export function SimuladosHome() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [years, setYears] = useState<EnemYear[]>([])
  const [subjects, setSubjects] = useState<EnemSubject[]>([])
  const [history, setHistory] = useState<SimulationHistoryItem[]>([])
  const [mode, setMode] = useState<SimulationMode>('subject_practice')
  const [examYear, setExamYear] = useState<number | ''>('')
  const [subjectId, setSubjectId] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsSubject = mode === 'subject_practice'
  const needsQuestionCount = mode === 'subject_practice'

  useEffect(() => {
    if (!token) return

    Promise.all([fetchEnemYears(token), fetchSimulationHistory(token)])
      .then(([yearsData, historyData]) => {
        setYears(yearsData)
        setHistory(historyData)
        if (yearsData.length > 0) {
          setExamYear(yearsData[0].year)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!token || !examYear || !needsSubject) return

    setLoadingMeta(true)
    setSubjectId('')

    fetchEnemSubjects(token, Number(examYear))
      .then((subjectsData) => {
        setSubjects(subjectsData)
        if (subjectsData.length > 0) setSubjectId(subjectsData[0].id)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar opções'))
      .finally(() => setLoadingMeta(false))
  }, [token, examYear, needsSubject])

  useEffect(() => {
    if (mode === 'subject_practice' && questionCount > 45) {
      setQuestionCount(45)
    }
  }, [mode, questionCount])

  async function handleStart() {
    setError(null)
    setStarting(true)

    try {
      const payload = {
        mode,
        ...(examYear ? { examYear: Number(examYear) } : {}),
        ...(needsSubject ? { subjectId, questionCount } : {}),
      }

      const { attempt, questions } = await startSimulation(token, payload)
      navigate(`/simulados/${attempt.id}`, {
        state: { questions, attempt },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar simulado')
    } finally {
      setStarting(false)
    }
  }

  const canStart =
    !starting &&
    !loadingMeta &&
    Boolean(examYear) &&
    (needsSubject ? Boolean(subjectId) : true)

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
          Questões oficiais via EnemHub — pratique por matéria ou simule o 1º ou 2º dia
          completo da prova, com cronômetro.
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-300">Ano da prova</span>
              <select
                value={examYear}
                onChange={(e) => setExamYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
              >
                {years.map((item) => (
                  <option key={item.year} value={item.year}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>

            {needsSubject && (
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Matéria</span>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={loadingMeta || subjects.length === 0}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
                >
                  {loadingMeta ? (
                    <option value="">Carregando...</option>
                  ) : (
                    subjects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
            )}

            {needsQuestionCount && (
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Questões</span>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                >
                  {[5, 10, 15, 20, 30, 45].map((count) => (
                    <option key={count} value={count}>
                      {count} questões
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
          {starting ? 'Preparando questões...' : 'Iniciar simulado'}
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
