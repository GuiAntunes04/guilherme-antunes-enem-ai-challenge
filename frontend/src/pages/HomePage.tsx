import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
    { label: 'Sessões com tutor', value: stats?.tutorSessions ?? 0 },
  ]

  return (
    <div className="max-w-5xl">
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
