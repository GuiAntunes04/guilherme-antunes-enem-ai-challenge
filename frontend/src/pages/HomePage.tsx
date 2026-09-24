import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SubjectPerformanceList } from '../components/dashboard/SubjectPerformanceList'
import { SubjectRadarChart } from '../components/dashboard/SubjectRadarChart'
import { SimulationProgressChart } from '../components/dashboard/SimulationProgressChart'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { fetchStats, type StatsResponse } from '../lib/api'
import { navItems } from '../config/navigation'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../lib/cn'

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
      <PageHeader
        eyebrow="Área do estudante"
        title={`Olá, ${profile?.name ?? 'estudante'}!`}
        description={
          <>
            Bem-vindo à sua plataforma de estudos
            {user?.email ? (
              <>
                , <span className="text-muted-foreground">{user.email}</span>
              </>
            ) : (
              ''
            )}
            . Acompanhe seu progresso e acesse as ferramentas abaixo.
          </>
        }
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} as="article">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">
              {statsLoading ? '—' : stat.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-6">
        <Card as="section" padding="lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Desempenho por matéria
              </h2>
              <p className="mt-1 text-sm text-muted">
                Taxa de acerto por matéria, somando todos os simulados finalizados.
              </p>
            </div>
          </div>
          {statsLoading ? (
            <p className="mt-8 text-sm text-muted">Carregando gráfico...</p>
          ) : (
            <div className="mt-4">
              <SubjectRadarChart data={stats?.subjectPerformance ?? []} />
              <SubjectPerformanceList data={stats?.subjectPerformance ?? []} />
            </div>
          )}
        </Card>

        <Card as="section" padding="lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Evolução nos simulados
              </h2>
              <p className="mt-1 text-sm text-muted">
                Desempenho percentual dos últimos simulados finalizados.
              </p>
            </div>
            {!statsLoading && averageAccuracy !== null && (
              <div className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-right">
                <p className="text-xs text-accent-soft/90">Média recente</p>
                <p className="text-lg font-bold text-accent">{averageAccuracy}%</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            {statsLoading ? (
              <p className="text-sm text-muted">Carregando gráfico...</p>
            ) : (
              <SimulationProgressChart data={stats?.simulationTrend ?? []} />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-foreground">Acesso rápido</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group rounded-[var(--radius-card)] border border-border-subtle bg-surface-raised/90 p-5 transition',
                'hover:border-accent/35 hover:bg-surface-overlay',
              )}
            >
              <h3 className="font-semibold text-foreground group-hover:text-accent">
                {item.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
