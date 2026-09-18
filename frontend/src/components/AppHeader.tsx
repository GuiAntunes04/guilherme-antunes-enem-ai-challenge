import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type AppHeaderProps = {
  showLogout?: boolean
}

export function AppHeader({ showLogout = false }: AppHeaderProps) {
  const { profile, signOut } = useAuth()

  return (
    <header className="border-b border-slate-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          ENEM Prep AI
        </Link>

        <div className="flex items-center gap-4">
          {showLogout && profile && (
            <span className="hidden text-sm text-slate-400 sm:inline">
              Olá, {profile.name}
            </span>
          )}
          {showLogout ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Sair
            </button>
          ) : (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              Em desenvolvimento
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
