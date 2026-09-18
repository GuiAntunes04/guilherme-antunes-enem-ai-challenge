import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  fetchEnemAreas,
  fetchEnemYears,
  fetchSimulationHistory,
  startSimulation,
} from '../../lib/simulations-api'
import type { EnemArea, EnemYear, SimulationHistoryItem } from '../../types/simulation'

export function SimuladosHome() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [years, setYears] = useState<EnemYear[]>([])
  const [areas, setAreas] = useState<EnemArea[]>([])
  const [history, setHistory] = useState<SimulationHistoryItem[]>([])
  const [examYear, setExamYear] = useState<number | ''>('')
  const [subjectArea, setSubjectArea] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!token || !examYear) return

    setLoadingAreas(true)
    setSubjectArea('')

    fetchEnemAreas(token, Number(examYear))
      .then((areasData) => {
        setAreas(areasData)
        if (areasData.length > 0) {
          setSubjectArea(areasData[0].area)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar áreas'))
      .finally(() => setLoadingAreas(false))
  }, [token, examYear])

  async function handleStart() {
    if (!examYear || !subjectArea) return

    setError(null)
    setStarting(true)

    try {
      const { attempt, questions } = await startSimulation(token, {
        examYear: Number(examYear),
        subjectArea,
        questionCount,
      })
      navigate(`/simulados/${attempt.id}`, { state: { questions } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar simulado')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return <p className="text-slate-400">Carregando simulados...</p>
  }

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
          Questões oficiais de provas anteriores, via EnemHub API.
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Novo simulado</h2>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
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

          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">Área</span>
            <select
              value={subjectArea}
              onChange={(e) => setSubjectArea(e.target.value)}
              disabled={loadingAreas || areas.length === 0}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
            >
              {loadingAreas ? (
                <option value="">Carregando áreas...</option>
              ) : (
                areas.map((item) => (
                  <option key={item.area} value={item.area}>
                    {item.area}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">Questões</span>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
            >
              {[5, 10, 15, 20].map((count) => (
                <option key={count} value={count}>
                  {count} questões
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={starting || !examYear || !subjectArea || loadingAreas}
          className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {starting ? 'Preparando questões...' : 'Iniciar simulado'}
        </button>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Histórico</h2>

        {history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            Nenhum simulado realizado ainda.
          </p>
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
                    ENEM {item.exam_year} — {item.disciplineLabel ?? item.discipline}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {new Date(item.finished_at!).toLocaleDateString('pt-BR')}
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
