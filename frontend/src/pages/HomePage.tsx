import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SubjectPerformanceList } from '../components/dashboard/SubjectPerformanceList'
import { SubjectRadarChart } from '../components/dashboard/SubjectRadarChart'
import { SimulationProgressChart } from '../components/dashboard/SimulationProgressChart'
import { fetchStats, type StatsResponse } from '../lib/api'
import { navItems } from '../config/navigation'
import { useAuth } from '../contexts/AuthContext'

const quickLinks = navItems.filter((item) => item.path !== '/')

export function HomePage() {
  const { profile, user, session } = useAuth()
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return

    let mounted = true

    fetchStats(session.access_token)
      .then((data) => {
        if (mounted) setStats(data)
      })
      .catch(() => {
        if (mounted) setStats(null)
      })
      .finally(() => {
        if (mounted) setStatsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [session?.access_token])

  const statCards = [
    { label: 'Simulados realizados', value: stats?.simulations ?? 0 },
    { label: 'Redações enviadas', value: stats?.essays ?? 0 },
    { label: 'Conversas com tutor', value: stats?.tutorSessions ?? 0 },
  ]

  const averageAccuracy =
    stats?.simulationTrend.length
      ? Math.round(
          stats.simulationTrend.reduce((sum, point) => sum + point.accuracy, 0) /
            stats.simulationTrend.length,
        )
      : null

  return (
    <div className="max-w-6xl">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
          Área do estudante
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Olá, {profile?.name ?? 'estudante'}!
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-400">
          Bem-vindo à sua plataforma de estudos
          {user?.email ? (
            <>
              , <span className="text-slate-300">{user.email}</span>
            </>
          ) : (
            ''
          )}
          . Acompanhe seu progresso e acesse as ferramentas abaixo.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
          >
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {statsLoading ? '—' : stat.value}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-6">
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Desempenho por matéria</h2>
              <p className="mt-1 text-sm text-slate-400">
                Taxa de acerto por matéria, somando todos os simulados finalizados.
              </p>
            </div>
          </div>
          {statsLoading ? (
            <p className="mt-8 text-sm text-slate-400">Carregando gráfico...</p>
          ) : (
            <div className="mt-4">
              <SubjectRadarChart data={stats?.subjectPerformance ?? []} />
              <SubjectPerformanceList data={stats?.subjectPerformance ?? []} />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Evolução nos simulados</h2>
              <p className="mt-1 text-sm text-slate-400">
                Desempenho percentual dos últimos simulados finalizados.
              </p>
            </div>
            {!statsLoading && averageAccuracy !== null && (
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-right">
                <p className="text-xs text-sky-200/80">Média recente</p>
                <p className="text-lg font-bold text-sky-300">{averageAccuracy}%</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            {statsLoading ? (
              <p className="text-sm text-slate-400">Carregando gráfico...</p>
            ) : (
              <SimulationProgressChart data={stats?.simulationTrend ?? []} />
            )}
          </div>
        </section>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white">Acesso rápido</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900"
            >
              <h3 className="font-semibold text-white group-hover:text-emerald-400">
                {item.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
