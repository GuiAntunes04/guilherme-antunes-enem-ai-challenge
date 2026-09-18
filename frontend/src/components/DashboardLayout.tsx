import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { navItems } from '../config/navigation'
import { useAuth } from '../contexts/AuthContext'

function navLinkClass(isActive: boolean) {
  return [
    'flex flex-col rounded-lg px-3 py-2.5 transition',
    isActive
      ? 'bg-emerald-500/10 text-emerald-400'
      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white',
  ].join(' ')
}

export function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 md:flex md:flex-col">
          <div className="border-b border-slate-800 px-6 py-5">
            <Link to="/" className="text-lg font-semibold tracking-tight text-white">
              ENEM Prep AI
            </Link>
            {profile && (
              <p className="mt-1 truncate text-sm text-slate-400">{profile.name}</p>
            )}
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <span className="mt-0.5 text-xs opacity-70">{item.description}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Sair
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <header className="flex items-center justify-between border-b border-slate-800 px-4 py-4 md:hidden">
            <Link to="/" className="text-lg font-semibold text-white">
              ENEM Prep AI
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300"
              aria-expanded={menuOpen}
              aria-label="Abrir menu"
            >
              Menu
            </button>
          </header>

          {menuOpen && (
            <div className="border-b border-slate-800 p-4 md:hidden">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => navLinkClass(isActive)}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
              <button
                type="button"
                onClick={() => signOut()}
                className="mt-4 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"
              >
                Sair
              </button>
            </div>
          )}

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
